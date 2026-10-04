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
import { prepareTestDatabase, revokeWhileLocked } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { BUILD_COPY } from "@/lib/build-copy";
import { NotFoundError } from "@/lib/errors";
import { commitUpload } from "@/lib/imports";
import { openDraft } from "@/lib/instruments";
import { INVITEES_COPY, INVITEES_ERRORS, inviteStatus, linkMark, listInvitees, renewInvitee, revokeInvitee, sendInvites } from "@/lib/invitees";
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
    expect(await revokeLink(a.ws, project.id, instrument.id, "00000000-0000-4000-8000-000000000000", t0)).toEqual({ error: LINK_ERRORS.notPublished });
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
    // personal links stay open, so the project still reads Open with them and Closed on
    // the public row alone; a second revoke and a date save are refused; sending invites
    // is refused.
    const t1 = new Date("2026-10-04T09:00:00Z");
    expect(await revokeLink(a.ws, project.id, instrument.id, ana.id, t1)).toEqual({ error: LINK_ERRORS.changed });
    const revoked = await revokeLink(a.ws, project.id, instrument.id, first.id, t1);
    if (!("invite" in revoked)) throw new Error(revoked.error);
    expect([revoked.invite.id, revoked.invite.revokedAt]).toEqual([first.id, t1]);
    expect(linkState(revoked.invite, t1)).toBe("revoked");
    expect((await viewLink(first.token, undefined, t1)).kind).toBe("revoked");
    expect(await linkStatus(first.token, undefined, t1)).toEqual({ status: 410, state: "revoked" });
    expect((await viewLink(ana.token, undefined, t1)).kind).toBe("open");
    expect(projectStatus(project, [revoked.invite], t1)).toBe("Closed");
    expect(projectStatus(project, [revoked.invite, ana, bo], t1)).toBe("Open");
    expect(await revokeLink(a.ws, project.id, instrument.id, first.id, t1)).toEqual({ error: LINK_ERRORS.alreadyRevoked });
    expect(await saveLink(a.ws, project.id, instrument.id, first.id, "", "2026-10-25T15:00:00Z", "", false, t1)).toEqual({ error: LINK_ERRORS.revokedSave });
    expect(await sendInvites(a.ws, project.id, instrument.id, "cy@x.example", sender, BASE, t1, keep)).toEqual({ error: INVITEES_COPY.linkRevoked });
    expect((await invites.livePublic(a.ws, project.id))?.id).toBe(first.id);

    // The route handler itself: 410 with the state word only.
    const response = await stateRoute(new Request(`${BASE}/r/${first.token}/state`), { params: Promise.resolve({ token: first.token }) });
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ state: "revoked" });
    expect(response.headers.get("cache-control")).toBe("no-store");

    // Publish again (acceptance 1): a new row with a new token; the old one stays dead;
    // the card's link is the new one; the open personal links take the new dates at once;
    // a stale tab's revoke of the old row is refused; sending works again.
    const t2 = new Date("2026-10-04T10:00:00Z");
    const again = await publishLink(a.ws, project.id, instrument.id, "", "2026-10-30T15:00:00Z", "", t2);
    if (!("invite" in again)) throw new Error(again.error);
    expect((await listInvitees(a.ws, instrument.id)).map((r) => r.closesAt)).toEqual([new Date("2026-10-30T15:00:00Z"), new Date("2026-10-30T15:00:00Z")]);
    expect(await revokeLink(a.ws, project.id, instrument.id, first.id, t2)).toEqual({ error: LINK_ERRORS.changed });
    const cy = await sendInvites(a.ws, project.id, instrument.id, "cy@x.example", sender, BASE, t2, keep);
    expect(cy).toEqual({ outcomes: [{ email: "cy@x.example", line: "cy@x.example", sent: true, error: null }] });
    expect((await listInvitees(a.ws, instrument.id))[2].closesAt).toEqual(new Date("2026-10-30T15:00:00Z"));
    expect(again.invite.id).not.toBe(first.id);
    expect(again.invite.token).not.toBe(first.token);
    expect(again.invite.token).toMatch(/^[0-9a-f]{32}$/);
    expect(again.invite.revokedAt).toBeNull();
    expect((await viewLink(first.token, undefined, t2)).kind).toBe("revoked");
    expect((await viewLink(again.invite.token, undefined, t2)).kind).toBe("open");
    expect((await invites.livePublic(a.ws, project.id))?.id).toBe(again.invite.id);
    expect((await invites.publicForInstrument(a.ws, instrument.id))?.id).toBe(again.invite.id);
    expect(await publishLink(a.ws, project.id, instrument.id, "", "2026-10-30T15:00:00Z", "", t2)).toEqual({ error: LINK_ERRORS.alreadyPublished });
    // A tab that still shows the old row cannot put its dates on the new link: refused
    // before the lock, and under it when the pre-check was passed (the race).
    expect(await saveLink(a.ws, project.id, instrument.id, first.id, "", "2026-10-28T15:00:00Z", "", false, t2)).toEqual({ error: LINK_ERRORS.changed });
    expect(await invites.updatePublic(a.ws, instrument.id, first.id, { closesAt: new Date("2026-10-29T15:00:00Z") })).toEqual({ refused: "changed" });
    expect((await invites.get(a.ws, again.invite.id))?.closesAt).toEqual(new Date("2026-10-30T15:00:00Z"));
    const moved = await saveLink(a.ws, project.id, instrument.id, again.invite.id, "", "2026-10-28T15:00:00Z", "", false, t2);
    if (!("invite" in moved)) throw new Error(moved.error);
    expect(moved.invite.id).toBe(again.invite.id);
    expect((await listInvitees(a.ws, instrument.id))[0].closesAt).toEqual(new Date("2026-10-28T15:00:00Z"));
    expect((await invites.get(a.ws, first.id))?.closesAt).toEqual(new Date("2026-10-20T15:00:00Z"));

    // Revoke a personal link (acceptance 2): the inactive page, 410, the row Revoked, no
    // reminder, a second revoke refused, a stale tab's mark refused; the other row
    // untouched; pasting the address again points to New link.
    const t3 = new Date("2026-10-04T11:00:00Z");
    expect(await revokeInvitee(a.ws, project.id, instrument.id, ana.id, linkMark("f".repeat(32)), t3)).toEqual({ error: INVITEES_ERRORS.rowChanged("ana@x.example") });
    expect(linkMark(ana.token)).toMatch(/^[0-9a-f]{16}$/);
    expect(linkMark(ana.token)).not.toContain(ana.token.slice(0, 8));
    const anaRevoked = await revokeInvitee(a.ws, project.id, instrument.id, ana.id, linkMark(ana.token), t3);
    if (!("invite" in anaRevoked)) throw new Error(anaRevoked.error);
    expect(anaRevoked.invite.revokedAt).toEqual(t3);
    expect((await viewLink(ana.token, undefined, t3)).kind).toBe("revoked");
    expect(await linkStatus(ana.token, undefined, t3)).toEqual({ status: 410, state: "revoked" });
    expect(inviteStatus((await listInvitees(a.ws, instrument.id))[0])).toBe("revoked");
    expect((await viewLink(bo.token, undefined, t3)).kind).toBe("open");
    expect(await remindInvitee(a.ws, project.id, instrument.id, ana.id, sender, BASE, t3, keep)).toEqual({ error: REMINDERS_COPY.notDue("ana@x.example") });
    expect(await revokeInvitee(a.ws, project.id, instrument.id, ana.id, linkMark(ana.token), t3)).toEqual({ error: INVITEES_ERRORS.alreadyRevoked("ana@x.example") });
    expect(await renewInvitee(a.ws, project.id, instrument.id, bo.id, sender, BASE, t3, keep)).toEqual({ error: INVITEES_ERRORS.notRevoked("bo@x.example") });
    expect(await sendInvites(a.ws, project.id, instrument.id, "ana@x.example", sender, BASE, t3, keep)).toEqual({ error: INVITEES_ERRORS.revokedAddress("ana@x.example") });
    // A Not sent row revoked: pasting it again is refused the same way, and the claim too.
    const dee = await sendInvites(a.ws, project.id, instrument.id, "dee@x.example", sender, BASE, t3, async () => { throw new Error("550 no"); });
    if (!("outcomes" in dee)) throw new Error(dee.error);
    const deeRow = (await listInvitees(a.ws, instrument.id)).find((r) => r.email === "dee@x.example")!;
    await revokeInvitee(a.ws, project.id, instrument.id, deeRow.id, linkMark(deeRow.token), t3);
    expect(await sendInvites(a.ws, project.id, instrument.id, "dee@x.example", sender, BASE, t3, keep)).toEqual({ error: INVITEES_ERRORS.revokedAddress("dee@x.example") });
    expect(await invites.claimResend(a.ws, deeRow.id, { name: null, roleHint: null }, new Date(t3.getTime() + 60 * 60 * 1000))).toBeNull();
    // A row revoked between the box's read and the resend claim: the row's lock is held
    // while the send reads it as Not sent, the revoke lands under that lock, and the claim
    // then fails against the revoked row; the outcome names the revocation, not a send in
    // flight, and no email goes.
    const fay = await sendInvites(a.ws, project.id, instrument.id, "fay@x.example", sender, BASE, t3, async () => { throw new Error("550 no"); });
    if (!("outcomes" in fay)) throw new Error(fay.error);
    const fayRow = (await listInvitees(a.ws, instrument.id)).find((r) => r.email === "fay@x.example")!;
    const sentBefore = sent.length;
    let racing: Promise<Awaited<ReturnType<typeof sendInvites>>> | null = null;
    await revokeWhileLocked(a.ws, fayRow.id, async () => {
      racing = sendInvites(a.ws, project.id, instrument.id, "fay@x.example", sender, BASE, t3, keep);
      await new Promise((r) => setTimeout(r, 400));
    });
    const raced = await racing!;
    expect("outcomes" in raced ? raced.outcomes[0]?.error : raced.error).toBe(INVITEES_ERRORS.revokedAddress("fay@x.example"));
    expect(sent.length).toBe(sentBefore);

    // New link (acceptance 2): a fresh token on the row, the public link's dates, email 2
    // sent; the old token reads as unknown; a failed send leaves the row Not sent.
    const t4 = new Date("2026-10-04T12:00:00Z");
    sent.length = 0;
    const renewed = await renewInvitee(a.ws, project.id, instrument.id, ana.id, sender, BASE, t4, keep);
    expect(renewed).toEqual({ outcome: { email: "ana@x.example", line: "ana@x.example, Ana Pop", sent: true, error: null } });
    // New link under a closed link is refused there (the row stays revoked); so is a row
    // that is not revoked, and New link while the public link is revoked.
    expect(await invites.renewPersonal(a.ws, instrument.id, deeRow.id, "e".repeat(32), new Date("2026-11-01T00:00:00Z"))).toEqual({ refused: "closed" });
    expect(await invites.renewPersonal(a.ws, instrument.id, bo.id, "e".repeat(32), t4)).toEqual({ refused: "notRevoked" });
    const againRevoked = await revokeLink(a.ws, project.id, instrument.id, again.invite.id, t4);
    if (!("invite" in againRevoked)) throw new Error(againRevoked.error);
    expect(await renewInvitee(a.ws, project.id, instrument.id, deeRow.id, sender, BASE, t4, keep)).toEqual({ error: INVITEES_COPY.linkRevoked });
    expect(await invites.renewPersonal(a.ws, instrument.id, deeRow.id, "e".repeat(32), t4)).toEqual({ refused: "revoked" });
    const third = await publishLink(a.ws, project.id, instrument.id, "", "2026-10-28T15:00:00Z", "", t4);
    if (!("invite" in third)) throw new Error(third.error);
    expect(await revokeLink(a.ws, project.id, instrument.id, again.invite.id, t4)).toEqual({ error: LINK_ERRORS.changed });
    expect((await listInvitees(a.ws, instrument.id)).find((r) => r.email === "dee@x.example")!.revokedAt).not.toBeNull();
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
    await revokeInvitee(a.ws, project.id, instrument.id, bo.id, linkMark(bo.token), t4);
    const boRenew = await renewInvitee(a.ws, project.id, instrument.id, bo.id, sender, BASE, t4, async () => { throw new Error("550 no"); });
    expect(boRenew).toEqual({ outcome: { email: "bo@x.example", line: "bo@x.example", sent: false, error: INVITEES_ERRORS.newLinkNotSent("bo@x.example", "550 no") } });
    const boRow = (await listInvitees(a.ws, instrument.id))[1];
    expect([boRow.revokedAt, boRow.sentAt, boRow.sendError, inviteStatus(boRow)]).toEqual([null, null, "550 no", "notSent"]);

    // The other workspace: 404 on every action, nothing changed.
    await expect(revokeLink(b.ws, project.id, instrument.id, again.invite.id, t4)).rejects.toThrow(NotFoundError);
    await expect(revokeInvitee(b.ws, project.id, instrument.id, ana.id, linkMark(anaNew.token), t4)).rejects.toThrow(NotFoundError);
    await expect(revokeLink(a.ws, project.id, instrument.id, "not-an-id", t4)).rejects.toThrow(NotFoundError);
    await expect(renewInvitee(b.ws, project.id, instrument.id, ana.id, sender, BASE, t4, keep)).rejects.toThrow(NotFoundError);
    expect(await invites.revokePublic(b.ws, instrument.id, again.invite.id, t4)).toBeNull();
    expect(await invites.revokePersonal(b.ws, ana.id, anaNew.token, t4)).toBeNull();
    expect(await invites.renewPersonal(b.ws, instrument.id, bo.id, "f".repeat(32), t4)).toBeNull();
    expect((await invites.livePublic(a.ws, project.id))?.revokedAt).toBeNull();
    expect((await listInvitees(a.ws, instrument.id))[0].revokedAt).toBeNull();
    // The sample refuses.
    const sample = (await projects.list(a.ws)).find((p) => p.isSample)!;
    const sampleLive = (await invites.livePublic(a.ws, sample.id))!;
    expect(await revokeLink(a.ws, sample.id, sampleLive.instrumentId, sampleLive.id, t4)).toEqual({ error: BUILD_COPY.sample });
    expect(await links.byToken(sampleLive.token)).not.toBeNull();
  }, 60_000);
});
