// Share (stories/E6-1; the PM app board, Share): the public link card with its state pill
// (Draft, Published, Revoked), the note for the state, the link with Copy link once
// published, the open and close date-times, the passcode and Publish or Save; "Revoke
// link" under them while a link is in force, and "Publish again" (a new token) once it is
// revoked (stories/E6-4, revoke-link.tsx). The card
// shows the link in force (invites.livePublic: the newest instrument that has one); when a
// newer draft exists above it ("Build on version N" after publishing), a second card offers
// to publish the draft, which makes a new link; the link in force closes then (docs/review-list.md).
// Without an instrument the page points to Build. The sample shows its link read-only
// (E8-8). Personal invites (E6-2, invites-card.tsx) come under the link card, on the same
// instrument, and need its link published; reminders (E6-3) come there too. Copy:
// docs/copy/app.md (Share).
import Link from "next/link";
import { notFound } from "next/navigation";
import { instruments, invites, itemSets, projects, responses } from "@/db/queries";
import { StepTip } from "../step-tip";
import { shareTip } from "@/lib/guide";
import { GUIDE_LINES } from "@/lib/guide-lines";
import type { Instrument } from "@/db/queries/instruments";
import type { Invite } from "@/db/queries/invites";
import { NeutralPill, StatusPill } from "@/components/ui/status-pill";
import { BUILD_COPY } from "@/lib/build-copy";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { readAuthEnv } from "@/lib/auth";
import { formatUtc, linkState, SHARE_COPY } from "@/lib/sharing";
import { CopyLink } from "./copy-link";
import { InvitesCard } from "./invites-card";
import { RevokeLink } from "./revoke-link";
import { ShareForm } from "./share-form";
import { WithPreview } from "../with-preview";

export default async function SharePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/share`);
  const project = await projects.get(current.ws, projectId);
  if (!project) notFound();
  const newest = await instruments.latestForProject(current.ws, project.id);
  if (!newest) {
    return (
      <WithPreview projectId={project.id} step="share">
        <h2 className="text-xl font-bold tracking-[-0.02em]">{SHARE_COPY.title}</h2>
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-hairline-strong bg-surface p-6" data-testid="share-empty">
          <div className="font-semibold">{SHARE_COPY.noInstrument}</div>
          <Link href={`/app/projects/${project.id}/build`} className="text-sm underline underline-offset-4">{SHARE_COPY.noInstrumentLink}</Link>
        </div>
      </WithPreview>
    );
  }
  const live = await invites.livePublic(current.ws, project.id);
  // The card's instrument: the one holding the link in force, else the newest draft.
  const instrument = live && live.instrumentId !== newest.id ? await instruments.get(current.ws, live.instrumentId) : newest;
  if (!instrument) notFound();
  const builtOn = await itemSets.get(current.ws, instrument.itemSetId);
  const newerDraft = live && live.instrumentId !== newest.id ? newest : null;
  const newerSet = newerDraft ? await itemSets.get(current.ws, newerDraft.itemSetId) : null;
  // The guide (stories/E15-3, E15-4): the link in draft; a link out three days with no answer.
  const open = live !== null && live.instrumentId === instrument.id && linkState(live) === "open";
  const openSince = open && instrument.publishedAt ? (live.opensAt && live.opensAt > instrument.publishedAt ? live.opensAt : instrument.publishedAt) : null;
  const tip = shareTip({ publishedAt: instrument.publishedAt, open, openSince, responses: open ? await responses.countForInstrument(current.ws, instrument.id) : 0 });
  return (
    <WithPreview projectId={project.id} step="share">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-[-0.02em]">{SHARE_COPY.title}</h2>
        <p className="text-ink-muted">{SHARE_COPY.line} {builtOn && <span data-testid="share-version">{SHARE_COPY.version(builtOn.version)}</span>}</p>
      </div>
      {!project.isSample && (
        <StepTip path={`/app/projects/${project.id}/share`} tip={tip}
          action={tip === "rescue.noResponse" ? { label: GUIDE_LINES["rescue.noResponse"].action, href: "#share-invites-title" } : undefined} />
      )}
      <LinkCard projectId={project.id} isSample={project.isSample} instrument={instrument} invite={live} />
      <InvitesCard ws={current.ws} projectId={project.id} instrumentId={instrument.id} isSample={project.isSample} linkState={linkState(live)} />
      {newerDraft && newerSet && builtOn && (
        <section className="card flex max-w-[720px] flex-col gap-4" aria-labelledby="share-draft-title" data-testid="draft-card">
          <div className="flex items-center justify-between gap-3">
            <h3 id="share-draft-title" className="text-[15px] font-bold">{SHARE_COPY.newerDraftCard(newerSet.version)}</h3>
            <NeutralPill>{SHARE_COPY.states.draft}</NeutralPill>
          </div>
          <p className="text-sm text-ink-muted">{SHARE_COPY.newerDraft(newerSet.version, builtOn.version)}</p>
          <ShareForm key={newerDraft.id} projectId={project.id} instrumentId={newerDraft.id} published={false} opensAt={null} closesAt={null} hasPasscode={false} />
        </section>
      )}
    </WithPreview>
  );
}

function LinkCard({ projectId, isSample, instrument, invite }: { projectId: string; isSample: boolean; instrument: Instrument; invite: Invite | null }) {
  const state = linkState(invite);
  const url = invite ? `${readAuthEnv().baseURL}/r/${invite.token}` : null;
  const note = state === "draft" ? SHARE_COPY.notes.draft : state === "revoked" ? SHARE_COPY.notes.revoked : state === "closed" ? SHARE_COPY.closedNow : state === "notOpen" ? SHARE_COPY.notOpenNote(formatUtc(invite!.opensAt!)) : SHARE_COPY.notes.published;
  return (
    <section className="card flex max-w-[720px] flex-col gap-4" aria-labelledby="share-link-title" data-testid="link-card" data-state={state}>
      <div className="flex items-center justify-between gap-3">
        <h3 id="share-link-title" className="text-[15px] font-bold">{SHARE_COPY.card}</h3>
        {state === "draft" ? <NeutralPill data-testid="link-state">{SHARE_COPY.states.draft}</NeutralPill> : state === "revoked" ? <NeutralPill data-testid="link-state">{SHARE_COPY.states.revoked}</NeutralPill> : <StatusPill status="agree" data-testid="link-state">{SHARE_COPY.states.published}</StatusPill>}
      </div>
      <p className="text-sm text-ink-muted" data-testid="link-note">{note}</p>
      {url && state !== "revoked" && <CopyLink url={url} />}
      {isSample ? (
        <ul className="flex flex-col text-sm" data-testid="link-list">
          <li className="flex justify-between gap-4 py-2.5"><span>{SHARE_COPY.opensLabel}</span><span className="text-ink-muted">{invite?.opensAt ? formatUtc(invite.opensAt) : BUILD_COPY.off}</span></li>
          <li className="flex justify-between gap-4 border-t border-hairline py-2.5"><span>{SHARE_COPY.closesLabel}</span><span className="text-ink-muted">{invite?.closesAt ? formatUtc(invite.closesAt) : BUILD_COPY.off}</span></li>
          <li className="py-2.5 text-[13px] text-ink-muted">{BUILD_COPY.sample}</li>
        </ul>
      ) : (
        <>
          <ShareForm key={`${instrument.id}-${invite?.id ?? "draft"}-${state === "revoked" ? "revoked" : "live"}`} projectId={projectId} instrumentId={instrument.id} inviteId={invite && state !== "revoked" ? invite.id : null} published={invite !== null && state !== "revoked"} again={state === "revoked"} opensAt={state === "revoked" ? null : (invite?.opensAt?.toISOString() ?? null)} closesAt={state === "revoked" ? null : (invite?.closesAt?.toISOString() ?? null)} hasPasscode={state !== "revoked" && invite?.passcodeHash !== null && invite?.passcodeHash !== undefined} />
          {invite && state !== "revoked" && <RevokeLink projectId={projectId} instrumentId={instrument.id} inviteId={invite.id} />}
        </>
      )}
    </section>
  );
}
