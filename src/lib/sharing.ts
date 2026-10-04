// The public link (stories/E6-1): one invite row of kind public per instrument, created by
// Publish under the instrument row's lock (invites.publish), with the open and close
// instants and an optional passcode (hashed, src/lib/passcode.ts). Publishing a newer
// instrument closes the project's older link at that instant, so one project has one link
// in force (invites.livePublic). The token is 32 hex
// characters from crypto.randomBytes(16) (SECURITY.md; nodejs.org/api/crypto.html,
// crypto.randomBytes). The link is /r/[token]. Dates arrive as ISO instants (the Share form
// converts the browser's local date-time; the zone shown there is the browser's, since the
// workspace has no time zone of its own, docs/review-list.md) and are shown in UTC on the
// respondent side. Words: SHARE_COPY and LINK_ERRORS (docs/copy/app.md, Share; errors.md).
import { randomBytes } from "node:crypto";
import { instruments, invites, projects } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import type { Invite } from "@/db/queries/invites";
import type { WorkspaceId } from "@/db/types";
import { BUILD_COPY } from "@/lib/build-copy";
import { NotFoundError } from "@/lib/errors";
import { hashPasscode, PASSCODE_MAX, PASSCODE_MIN } from "@/lib/passcode";
import { isLinkOpen } from "@/lib/project-status";
import { LINK_ERRORS, SHARE_COPY } from "@/lib/sharing-copy";
import { formatUtc } from "@/lib/sharing-format";

export { LINK_ERRORS, SHARE_COPY };

export type LinkState = "draft" | "notOpen" | "open" | "closed" | "revoked";

export function linkState(invite: Pick<Invite, "opensAt" | "closesAt" | "revokedAt"> | null, now = new Date()): LinkState {
  if (!invite) return "draft";
  if (invite.revokedAt) return "revoked";
  if (invite.opensAt && invite.opensAt > now) return "notOpen";
  if (isLinkOpen(invite, now)) return "open";
  return "closed";
}

export { formatUtc };

export const newToken = (): string => randomBytes(16).toString("hex");

export type LinkInput = { opensAt: Date | null; closesAt: Date; passcode: string | null };

// The dates and the passcode as the form posts them. An empty open date means at once; the
// close date is required and after the open date; on publish it is also in the future,
// while a published link's close date may be moved into the past to close it now
// (docs/review-list.md). An empty passcode means none (or, on a published link, unchanged).
export function parseLinkInput(rawOpens: unknown, rawCloses: unknown, rawPasscode: unknown, now: Date, afterPublish: boolean): { error: string } | { input: LinkInput } {
  const toDate = (raw: unknown): Date | null | undefined => {
    if (raw === null || raw === undefined || raw === "") return null;
    if (typeof raw !== "string") return undefined;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  const opensAt = toDate(rawOpens);
  const closesAt = toDate(rawCloses);
  if (opensAt === undefined || closesAt === undefined) return { error: LINK_ERRORS.badDate };
  if (closesAt === null) return { error: LINK_ERRORS.noClose };
  if (opensAt && closesAt <= opensAt) return { error: LINK_ERRORS.closeBeforeOpen };
  if (!afterPublish && closesAt <= now) return { error: LINK_ERRORS.closeInPast };
  const passcode = typeof rawPasscode === "string" ? rawPasscode.trim() : "";
  if (passcode && passcode.length < PASSCODE_MIN) return { error: LINK_ERRORS.shortPasscode };
  if (passcode.length > PASSCODE_MAX) return { error: LINK_ERRORS.longPasscode };
  return { input: { opensAt, closesAt, passcode: passcode || null } };
}

// The project and the instrument the form named, both in the workspace (404 otherwise), the
// project live (not the sample, not archived), and the instrument either the project's newest
// (the one Publish creates a link for) or the one holding the link in force (whose dates
// still change after "Build on version N", docs/review-list.md).
export async function own(ws: WorkspaceId, projectId: string, instrumentId: string): Promise<{ error: string } | { instrument: Instrument }> {
  const project = await projects.get(ws, projectId);
  const instrument = await instruments.get(ws, instrumentId);
  if (!project || !instrument || instrument.projectId !== project.id) throw new NotFoundError();
  if (project.isSample) return { error: BUILD_COPY.sample };
  if (project.archivedAt) return { error: SHARE_COPY.archived };
  const latest = await instruments.latestForProject(ws, project.id);
  const live = await invites.livePublic(ws, project.id);
  if (latest?.id !== instrument.id && live?.instrumentId !== instrument.id) return { error: BUILD_COPY.replaced };
  return { instrument };
}

// Publish (acceptance 1, 2 and 5): the public link, created under the instrument's lock. A
// second press, or another tab, finds the link already there and gets a message.
export async function publishLink(ws: WorkspaceId, projectId: string, instrumentId: string, rawOpens: unknown, rawCloses: unknown, rawPasscode: unknown, now = new Date()): Promise<{ error: string } | { invite: Invite }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const parsed = parseLinkInput(rawOpens, rawCloses, rawPasscode, now, false);
  if ("error" in parsed) return { error: parsed.error };
  const { opensAt, closesAt, passcode } = parsed.input;
  const result = await invites.publish(ws, instrumentId, { token: newToken(), opensAt, closesAt, passcodeHash: passcode ? await hashPasscode(passcode) : null }, now);
  if (!result) throw new NotFoundError();
  if (!result.created) return { error: LINK_ERRORS.alreadyPublished };
  return { invite: result.invite };
}

// The dates and the passcode of a published link (acceptance 5: dates change after
// publishing). An empty passcode keeps the one set; "remove" clears it.
// `inviteId` is the row the page showed (E6-4): a tab left open across a revoke and a
// Publish again is refused rather than putting its dates on the new link.
export async function saveLink(ws: WorkspaceId, projectId: string, instrumentId: string, inviteId: string, rawOpens: unknown, rawCloses: unknown, rawPasscode: unknown, removePasscode: boolean, now = new Date()): Promise<{ error: string } | { invite: Invite }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const existing = await invites.publicForInstrument(ws, instrumentId);
  if (!existing) return { error: LINK_ERRORS.notPublished };
  if (existing.revokedAt) return { error: LINK_ERRORS.revokedSave };
  if (existing.id !== inviteId) return { error: LINK_ERRORS.changed };
  const parsed = parseLinkInput(rawOpens, rawCloses, rawPasscode, now, true);
  if ("error" in parsed) return { error: parsed.error };
  const { opensAt, closesAt, passcode } = parsed.input;
  const patch: { opensAt: Date | null; closesAt: Date; passcodeHash?: string | null } = { opensAt, closesAt };
  if (removePasscode) patch.passcodeHash = null;
  else if (passcode) patch.passcodeHash = await hashPasscode(passcode);
  const result = await invites.updatePublic(ws, instrumentId, inviteId, patch);
  if (!result) throw new NotFoundError();
  if ("refused" in result) return { error: result.refused === "none" ? LINK_ERRORS.notPublished : result.refused === "revoked" ? LINK_ERRORS.revokedSave : result.refused === "changed" ? LINK_ERRORS.changed : BUILD_COPY.replaced };
  return { invite: result.invite };
}

// Revoke (stories/E6-4, acceptance 1): the link in force gets revoked_at and shows the
// inactive page from then on; the personal links stay as they are (design note 49).
// "Publish again" is publishLink: a new row with a new token, the revoked one stays dead.
// `inviteId` is the row the page showed, so a stale tab cannot revoke a link published
// again since.
export async function revokeLink(ws: WorkspaceId, projectId: string, instrumentId: string, inviteId: string, now = new Date()): Promise<{ error: string } | { invite: Invite }> {
  const owned = await own(ws, projectId, instrumentId);
  if ("error" in owned) return owned;
  const result = await invites.revokePublic(ws, instrumentId, inviteId, now);
  if (!result) throw new NotFoundError();
  if ("refused" in result) return { error: result.refused === "none" ? LINK_ERRORS.notPublished : result.refused === "revoked" ? LINK_ERRORS.alreadyRevoked : result.refused === "changed" ? LINK_ERRORS.changed : BUILD_COPY.replaced };
  return { invite: result.invite };
}
