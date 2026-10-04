// The kill switch (stories/E6-4) on the test database: revoking the public link sets
// revoked_at and the link reads as the inactive page (acceptance 1 and 3); "Publish again"
// makes a new token and the old one stays dead; a date save on a revoked link is refused;
// a revoked personal link shows the same page, cannot be reminded, and "New link" gives it
// a fresh token with the public link's dates and sends email 2 (acceptance 2); the state
// check answers 410 for a revoked or closed link and 404 for an unknown one, so an
// autosave route refuses to write after a revocation (acceptance 4); the other workspace
// reads and changes nothing.
import { beforeAll, describe, expect, it } from "vitest";
import { invites, links, projects } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { BUILD_COPY } from "@/lib/build-copy";
import { NotFoundError } from "@/lib/errors";
import { commitUpload } from "@/lib/imports";
import { openDraft } from "@/lib/instruments";
import { INVITEES_COPY, INVITEES_ERRORS, inviteStatus, listInvitees, renewInvitee, revokeInvitee, sendInvites } from "@/lib/invitees";
import { linkStatus, viewLink } from "@/lib/link-access";
import { memoryOutbox, type Mail } from "@/lib/mail";
import { remindInvitee, REMINDERS_COPY } from "@/lib/reminders";
import { LINK_ERRORS, linkState, publishLink, revokeLink, saveLink } from "@/lib/sharing";
import { projectStatus } from "@/lib/project-status";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";
import { GET as stateRoute } from "@/app/r/[token]/state/route";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let a: { ws: WorkspaceId; userId: string }; let b: { ws: WorkspaceId; userId: string };

async function signIn(email: string) {
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, headers };
}

beforeAll(async () => {
  await prepareTestDatabase();
  const stamp = Date.now();
  const signedIn = await signIn(`revoke-${stamp}@example.com`);
  const wsA = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Revoke A", slug: `revoke-a-${stamp}` }, signedIn.id)).id);
  const wsB = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Revoke B", slug: `revoke-b-${stamp}` }, signedIn.id)).id);
  a = { ws: wsA, userId: signedIn.id }; b = { ws: wsB, userId: signedIn.id };
}, 60_000);

describe("the kill switch (stories/E6-4)", () => {
  it("revokes the public link, publishes again with a new token, revokes and renews a personal link, answers the state check", async () => {
    const project = await projects.create(a.ws, { name: "Expense tool", createdBy: a.userId });
    const pasted = await savePaste({ ws: a.ws, userId: a.userId }, project.id, ["One", "Two"].join("\n"));
    if (!("upload" in pasted)) throw new Error(pasted.error);
    await commitUpload(a.ws, pasted.upload.id, a.userId);
    const { instrument } = (await openDraft(a.ws, project))!;
    const sender = { name: "Dana PM", email: "dana@marlow.example" };
    const t0 = new Date("2026-10-03T12:00:00Z");
    const sent: Mail[] = [];
    const keep = async (mail: Mail) => { sent.push(mail); };
    // Nothing to revoke before publishing.
    expect(await revokeLink(a.ws, project.id, instrument.id, t0)).toEqual({ error: LINK_ERRORS.notPublished });
    const published = await publishLink(a.ws, project.id, instrument.id, "", "2026-10-20T15:00:00Z", "", t0);
    if (!("invite" in published)) throw new Error(published.error);
    const first = published.invite;
    const invited = await sendInvites(a.ws, project.id, instrument.id, "ana@x.example, Ana Pop\nbo@x.example", sender, BASE, t0, keep);
    if (!("outcomes" in invited)) throw new Error(invited.error);
    const [ana, bo] = await listInvitees(a.ws, instrument.id);

    // The state check on the open link: 200 open; unknown: 404.
    expect(await linkStatus(first.token, undefined, t0)).toEqual({ status: 200, state: "open" });
    expect(await linkStatus("0".repeat(32), undefined, t0)).toEqual({ status: 404, state: "unknown" });
    expect(await linkStatus(first.token, undefined, new Date("2026-10-21T00:00:00Z"))).toEqual({ status: 410, state: "closed" });

    // Revoke the public link (acceptance 1): revoked_at set, the inactive page, 410; the
    // personal links stay open; the project reads Closed; a second revoke and a date save
    // are refused; sending invites is refused.
    const t1 = new Date("2026-10-04T09:00:00Z");
    const revoked = await revokeLink(a.ws, project.id, instrument.id, t1);
    if (!("invite" in revoked)) throw new Error(revoked.error);
    expect([revoked.invite.id, revoked.invite.revokedAt]).toEqual([first.id, t1]);
    expect(linkState(revoked.invite, t1)).toBe("revoked");
    expect((await viewLink(first.token, undefined, t1)).kind).toBe("revoked");
    expect(await linkStatus(first.token, undefined, t1)).toEqual({ status: 410, state: "revoked" });
    expect((await viewLink(ana.token, undefined, t1)).kind).toBe("open");
    expect(projectStatus(project, [revoked.invite], t1)).toBe("Closed");
    expect(await revokeLink(a.ws, project.id, instrument.id, t1)).toEqual({ error: LINK_ERRORS.alreadyRevoked });
    expect(await saveLink(a.ws, project.id, instrument.id, "", "2026-10-25T15:00:00Z", "", false, t1)).toEqual({ error: LINK_ERRORS.revokedSave });
    expect(await sendInvites(a.ws, project.id, instrument.id, "cy@x.example", sender, BASE, t1, keep)).toEqual({ error: INVITEES_COPY.linkRevoked });
    expect((await invites.livePublic(a.ws, project.id))?.id).toBe(first.id);

    // The route handler itself: 410 with the state word only.
    const response = await stateRoute(new Request(`${BASE}/r/${first.token}/state`), { params: Promise.resolve({ token: first.token }) });
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ state: "revoked" });
    expect(response.headers.get("cache-control")).toBe("no-store");

    // Publish again (acceptance 1): a new row with a new token; the old one stays dead;
    // the card's link is the new one; the personal links take the new dates.
    const t2 = new Date("2026-10-04T10:00:00Z");
    const again = await publishLink(a.ws, project.id, instrument.id, "", "2026-10-30T15:00:00Z", "", t2);
    if (!("invite" in again)) throw new Error(again.error);
    expect(again.invite.id).not.toBe(first.id);
    expect(again.invite.token).not.toBe(first.token);
    expect(again.invite.token).toMatch(/^[0-9a-f]{32}$/);
    expect(again.invite.revokedAt).toBeNull();
    expect((await viewLink(first.token, undefined, t2)).kind).toBe("revoked");
    expect((await viewLink(again.invite.token, undefined, t2)).kind).toBe("open");
    expect((await invites.livePublic(a.ws, project.id))?.id).toBe(again.invite.id);
    expect((await invites.publicForInstrument(a.ws, instrument.id))?.id).toBe(again.invite.id);
    expect(await publishLink(a.ws, project.id, instrument.id, "", "2026-10-30T15:00:00Z", "", t2)).toEqual({ error: LINK_ERRORS.alreadyPublished });
    const moved = await saveLink(a.ws, project.id, instrument.id, "", "2026-10-28T15:00:00Z", "", false, t2);
    if (!("invite" in moved)) throw new Error(moved.error);
    expect(moved.invite.id).toBe(again.invite.id);
    expect((await listInvitees(a.ws, instrument.id))[0].closesAt).toEqual(new Date("2026-10-28T15:00:00Z"));
    expect((await invites.get(a.ws, first.id))?.closesAt).toEqual(new Date("2026-10-20T15:00:00Z"));

    // Revoke a personal link (acceptance 2): the inactive page, 410, the row Revoked, no
    // reminder, a second revoke refused; the other row untouched.
    const t3 = new Date("2026-10-04T11:00:00Z");
    const anaRevoked = await revokeInvitee(a.ws, project.id, instrument.id, ana.id, t3);
    if (!("invite" in anaRevoked)) throw new Error(anaRevoked.error);
    expect(anaRevoked.invite.revokedAt).toEqual(t3);
    expect((await viewLink(ana.token, undefined, t3)).kind).toBe("revoked");
    expect(await linkStatus(ana.token, undefined, t3)).toEqual({ status: 410, state: "revoked" });
    expect(inviteStatus((await listInvitees(a.ws, instrument.id))[0])).toBe("revoked");
    expect((await viewLink(bo.token, undefined, t3)).kind).toBe("open");
    expect(await remindInvitee(a.ws, project.id, instrument.id, ana.id, sender, BASE, t3, keep)).toEqual({ error: REMINDERS_COPY.notDue("ana@x.example") });
    expect(await revokeInvitee(a.ws, project.id, instrument.id, ana.id, t3)).toEqual({ error: INVITEES_ERRORS.alreadyRevoked("ana@x.example") });
    expect(await renewInvitee(a.ws, project.id, instrument.id, bo.id, sender, BASE, t3, keep)).toEqual({ error: INVITEES_ERRORS.notRevoked("bo@x.example") });
    // Pasting the revoked address again is "already has a personal link" (the row is sent).
    expect(await sendInvites(a.ws, project.id, instrument.id, "ana@x.example", sender, BASE, t3, keep)).toEqual({ error: INVITEES_ERRORS.already("ana@x.example") });

    // New link (acceptance 2): a fresh token on the row, the public link's dates, email 2
    // sent; the old token reads as unknown; a failed send leaves the row Not sent.
    const t4 = new Date("2026-10-04T12:00:00Z");
    sent.length = 0;
    const renewed = await renewInvitee(a.ws, project.id, instrument.id, ana.id, sender, BASE, t4, keep);
    expect(renewed).toEqual({ outcome: { email: "ana@x.example", line: "ana@x.example, Ana Pop", sent: true, error: null } });
    const anaNew = (await listInvitees(a.ws, instrument.id))[0];
    expect([anaNew.id, anaNew.revokedAt, anaNew.sentAt, inviteStatus(anaNew)]).toEqual([ana.id, null, t4, "invited"]);
    expect(anaNew.token).not.toBe(ana.token);
    expect(anaNew.closesAt).toEqual(new Date("2026-10-28T15:00:00Z"));
    expect((await viewLink(ana.token, undefined, t4)).kind).toBe("unknown");
    expect((await viewLink(anaNew.token, undefined, t4)).kind).toBe("open");
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("ana@x.example");
    expect(sent[0].text).toContain(`${BASE}/r/${anaNew.token}`);
    expect(sent[0].text).toContain("It closes on 28 Oct 2026, 15:00 UTC.");
    await revokeInvitee(a.ws, project.id, instrument.id, bo.id, t4);
    const boRenew = await renewInvitee(a.ws, project.id, instrument.id, bo.id, sender, BASE, t4, async () => { throw new Error("550 no"); });
    expect(boRenew).toEqual({ outcome: { email: "bo@x.example", line: "bo@x.example", sent: false, error: INVITEES_ERRORS.newLinkNotSent("bo@x.example", "550 no") } });
    const boRow = (await listInvitees(a.ws, instrument.id))[1];
    expect([boRow.revokedAt, boRow.sentAt, boRow.sendError, inviteStatus(boRow)]).toEqual([null, null, "550 no", "notSent"]);

    // The other workspace: 404 on every action, nothing changed.
    await expect(revokeLink(b.ws, project.id, instrument.id, t4)).rejects.toThrow(NotFoundError);
    await expect(revokeInvitee(b.ws, project.id, instrument.id, ana.id, t4)).rejects.toThrow(NotFoundError);
    await expect(renewInvitee(b.ws, project.id, instrument.id, ana.id, sender, BASE, t4, keep)).rejects.toThrow(NotFoundError);
    expect(await invites.revokePublic(b.ws, instrument.id, t4)).toBeNull();
    expect(await invites.revokePersonal(b.ws, ana.id, t4)).toBeNull();
    expect(await invites.renewPersonal(b.ws, bo.id, "f".repeat(32), { opensAt: null, closesAt: null }, t4)).toBeNull();
    expect((await invites.livePublic(a.ws, project.id))?.revokedAt).toBeNull();
    expect((await listInvitees(a.ws, instrument.id))[0].revokedAt).toBeNull();
    // The sample refuses.
    const sample = (await projects.list(a.ws)).find((p) => p.isSample)!;
    const sampleLive = (await invites.livePublic(a.ws, sample.id))!;
    expect(await revokeLink(a.ws, sample.id, sampleLive.instrumentId, t4)).toEqual({ error: BUILD_COPY.sample });
    expect(await links.byToken(sampleLive.token)).not.toBeNull();
  }, 60_000);
});
