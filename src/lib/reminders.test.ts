// Reminders (stories/E6-3) on the test database: the three-day rule across the boundary
// (71 hours refused, 73 allowed; acceptance 5), email 3's two branches (acceptance 2), the
// counters (acceptance 3), no reminder to a submitted person or a Not sent row, "Remind
// everyone" with per-row outcomes, a failed email giving the claim back, the other
// workspace reading nothing, and nothing automatic (acceptance 4: the only sends are the
// calls below); an Anonymous validation refused on every path (E5-7).
import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { answers, invites, projects, responses } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { commitUpload } from "@/lib/imports";
import { openDraft, saveAnonymity, saveFields } from "@/lib/instruments";
import { INVITEES_ERRORS, listInvitees, renewInvitee, sendInvites } from "@/lib/invitees";
import { memoryOutbox, type Mail } from "@/lib/mail";
import { NotFoundError } from "@/lib/errors";
import { remindAll, remindInvitee, REMINDERS_COPY } from "@/lib/reminders";
import { canRemind, REMIND_AFTER_HOURS, tooSoonLine } from "@/lib/reminders-rules";
import { publishLink } from "@/lib/sharing";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";

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
  const signedIn = await signIn(`reminders-${stamp}@example.com`);
  const wsA = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Reminders A", slug: `reminders-a-${stamp}` }, signedIn.id)).id);
  const wsB = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Reminders B", slug: `reminders-b-${stamp}` }, signedIn.id)).id);
  a = { ws: wsA, userId: signedIn.id }; b = { ws: wsB, userId: signedIn.id };
}, 60_000);

describe("canRemind (acceptance 1 and 5)", () => {
  const base = { sentAt: new Date("2026-10-01T00:00:00Z"), revokedAt: null, responseStatus: "none" as const };
  it("refuses 71 hours after the last reminder and allows 73", () => {
    const last = new Date("2026-10-03T12:00:00Z");
    const at = (hours: number) => new Date(last.getTime() + hours * 60 * 60 * 1000);
    expect(canRemind({ ...base, lastReminderAt: last }, at(71))).toEqual({ ok: false, why: "tooSoon", days: 2, next: at(REMIND_AFTER_HOURS) });
    expect(canRemind({ ...base, lastReminderAt: last }, at(72))).toEqual({ ok: true });
    expect(canRemind({ ...base, lastReminderAt: last }, at(73))).toEqual({ ok: true });
    expect(canRemind({ ...base, lastReminderAt: null }, at(0))).toEqual({ ok: true });
    expect(tooSoonLine({ ok: false, why: "tooSoon", days: 2, next: at(72) })).toBe("Reminded 2 days ago. The next reminder can go on 6 Oct 2026, 12:00 UTC.");
    expect(tooSoonLine({ ok: false, why: "tooSoon", days: 1, next: at(72) })).toBe("Reminded 1 day ago. The next reminder can go on 6 Oct 2026, 12:00 UTC.");
  });
  it("refuses a submitted person, a Not sent row and a revoked link", () => {
    expect(canRemind({ ...base, lastReminderAt: null, responseStatus: "submitted" })).toEqual({ ok: false, why: "submitted", days: 0, next: null });
    expect(canRemind({ ...base, lastReminderAt: null, sentAt: null })).toEqual({ ok: false, why: "notSent", days: 0, next: null });
    expect(canRemind({ ...base, lastReminderAt: null, revokedAt: new Date() })).toEqual({ ok: false, why: "revoked", days: 0, next: null });
  });
});

describe("remindInvitee and remindAll", () => {
  it("sends email 3 with the right branch, counts, refuses too soon, gives a failed claim back, skips the submitted", async () => {
    const project = await projects.create(a.ws, { name: "Expense tool", createdBy: a.userId });
    const pasted = await savePaste({ ws: a.ws, userId: a.userId }, project.id, ["One", "Two", "Three"].join("\n"));
    if (!("upload" in pasted)) throw new Error(pasted.error);
    const committed = await commitUpload(a.ws, pasted.upload.id, a.userId);
    if (!("set" in committed)) throw new Error(committed.error);
    const { instrument } = (await openDraft(a.ws, project))!;
    const sender = { name: "Dana PM", email: "dana@marlow.example" };
    const t0 = new Date("2026-10-03T12:00:00Z");
    const published = await publishLink(a.ws, project.id, instrument.id, "", "2026-10-20T15:00:00Z", "", t0);
    if (!("invite" in published)) throw new Error(published.error);
    const sent: Mail[] = [];
    const keep = async (mail: Mail) => { sent.push(mail); };
    const invited = await sendInvites(a.ws, project.id, instrument.id, "ana@x.example, Ana Pop\nbo@x.example\ncy@x.example\ndee@x.example", sender, BASE, t0, keep);
    if (!("outcomes" in invited)) throw new Error(invited.error);
    const dee = await sendInvites(a.ws, project.id, instrument.id, "ed@x.example", sender, BASE, t0, async () => { throw new Error("550 no"); });
    if (!("outcomes" in dee)) throw new Error(dee.error);
    const rows = await listInvitees(a.ws, instrument.id);
    const [ana, bo, cy, deeRow, ed] = rows;
    expect(rows.map((r) => r.email)).toEqual(["ana@x.example", "bo@x.example", "cy@x.example", "dee@x.example", "ed@x.example"]);
    // bo answered two of three; cy submitted.
    const items = committed.set ? (await import("@/db/queries")).items : null;
    const itemRows = await items!.forSet(a.ws, instrument.itemSetId);
    const boResponse = await responses.create(a.ws, { instrumentId: instrument.id, itemSetId: instrument.itemSetId, inviteId: bo.id, deviceToken: randomBytes(16).toString("hex"), fields: { name: "Bo" } });
    for (const item of itemRows.slice(0, 2)) await answers.create(a.ws, { responseId: boResponse.id, itemSetId: instrument.itemSetId, itemId: item.id, kind: "agree" });
    await responses.create(a.ws, { instrumentId: instrument.id, itemSetId: instrument.itemSetId, inviteId: cy.id, deviceToken: randomBytes(16).toString("hex"), fields: {}, submittedAt: t0 });

    // Ana, not started; Bo, 2 of 3; the counters; the email.
    const t1 = new Date("2026-10-05T09:00:00Z");
    sent.length = 0;
    expect(await remindInvitee(a.ws, project.id, instrument.id, ana.id, sender, BASE, t1, keep)).toEqual({ outcome: { email: "ana@x.example", sent: true, error: null } });
    expect(sent[0].to).toBe("ana@x.example");
    expect(sent[0].fromName).toBe("Dana PM via SMEsay");
    expect(sent[0].replyTo).toBe("dana@marlow.example");
    expect(sent[0].subject).toBe("Reminder: Expense tool closes on 20 Oct 2026");
    expect(sent[0].text).toContain("Hi Ana Pop,");
    expect(sent[0].text).toContain("Dana PM is still waiting for your answers on Expense tool. The link closes on 20 Oct 2026, 15:00 UTC.");
    expect(sent[0].text).toContain("You have not started yet.");
    expect(sent[0].text).toContain(`${BASE}/r/${ana.token}`);
    expect(sent[0].text).toContain("reply to this email and say so, and Dana PM will stop reminding you.");
    expect(sent[0].html).toContain("Carry on");
    expect(await remindInvitee(a.ws, project.id, instrument.id, bo.id, sender, BASE, t1, keep)).toEqual({ outcome: { email: "bo@x.example", sent: true, error: null } });
    expect(sent[1].text).toContain("Hi,");
    expect(sent[1].text).toContain("You answered 2 of 3 items. Your answers are saved; pick up where you left off.");
    const after = await listInvitees(a.ws, instrument.id);
    expect([after[0].remindersSent, after[0].lastReminderAt, after[1].remindersSent, after[1].lastReminderAt]).toEqual([1, t1, 1, t1]);

    // Too soon at 71 hours, allowed at 73; a submitted person and a Not sent row refused.
    const h = (hours: number) => new Date(t1.getTime() + hours * 60 * 60 * 1000);
    expect(await remindInvitee(a.ws, project.id, instrument.id, ana.id, sender, BASE, h(71), keep)).toEqual({ error: "Reminded 2 days ago. The next reminder can go on 8 Oct 2026, 09:00 UTC." });
    expect(await remindInvitee(a.ws, project.id, instrument.id, cy.id, sender, BASE, h(73), keep)).toEqual({ error: REMINDERS_COPY.notDue("cy@x.example") });
    expect(await remindInvitee(a.ws, project.id, instrument.id, ed.id, sender, BASE, h(73), keep)).toEqual({ error: REMINDERS_COPY.notDue("ed@x.example") });
    expect(await invites.claimReminder(a.ws, ana.id, h(71), REMIND_AFTER_HOURS)).toBeNull();
    expect(await invites.claimReminder(a.ws, cy.id, h(73), REMIND_AFTER_HOURS)).toBeNull();
    expect(sent).toHaveLength(2);
    // Exactly 72 hours is allowed by the statement too (Bo, last reminded at t1).
    const boAt72 = await invites.claimReminder(a.ws, bo.id, h(72), REMIND_AFTER_HOURS);
    expect(boAt72?.remindersSent).toBe(2);
    await invites.unclaimReminder(a.ws, bo.id, h(72), t1);
    expect((await listInvitees(a.ws, instrument.id))[1].remindersSent).toBe(1);
    expect(await remindInvitee(a.ws, project.id, instrument.id, ana.id, sender, BASE, h(73), keep)).toEqual({ outcome: { email: "ana@x.example", sent: true, error: null } });
    expect((await listInvitees(a.ws, instrument.id))[0].remindersSent).toBe(2);
    // A missing mail variable is thrown, named, and the claim is given back.
    await expect(remindInvitee(a.ws, project.id, instrument.id, deeRow.id, sender, BASE, h(73), async () => { throw new Error("MAIL_SMTP_URL is not set. Copy .env.example to .env.local and fill it in (docs/setup.md)."); })).rejects.toThrow("MAIL_SMTP_URL is not set");
    expect([(await listInvitees(a.ws, instrument.id))[3].remindersSent, (await listInvitees(a.ws, instrument.id))[3].lastReminderAt]).toEqual([0, null]);

    // A failed email gives the claim back; two presses at once send one.
    const failed = await remindInvitee(a.ws, project.id, instrument.id, deeRow.id, sender, BASE, h(73), async () => { throw new Error("451 try later smtp.internal.example"); });
    expect(failed).toEqual({ outcome: { email: "dee@x.example", sent: false, error: REMINDERS_COPY.notSent("dee@x.example", "451 try later [server]") } });
    const deeAfter = (await listInvitees(a.ws, instrument.id))[3];
    expect([deeAfter.remindersSent, deeAfter.lastReminderAt]).toEqual([0, null]);
    const slow = async (mail: Mail) => { await new Promise((r) => setTimeout(r, 30)); sent.push(mail); };
    const twice = await Promise.all([
      remindInvitee(a.ws, project.id, instrument.id, deeRow.id, sender, BASE, h(74), slow),
      remindInvitee(a.ws, project.id, instrument.id, deeRow.id, sender, BASE, h(74), slow),
    ]);
    expect(twice.filter((r) => "outcome" in r && r.outcome.sent)).toHaveLength(1);
    // The loser read the row before or after the win: the too-soon line either way, with
    // the address in front when it comes as an outcome.
    expect(twice.filter((r) => ("error" in r && r.error.startsWith("Reminded 0 days ago.")) || ("outcome" in r && r.outcome.error?.startsWith("dee@x.example: Reminded 0 days ago.")))).toHaveLength(1);
    // The claim reads the newest response: Bo's older in-progress response with a newer
    // submitted one refuses; a newer in-progress one after an older submitted one allows,
    // as the list shows Remind then (docs/review-list.md).
    const boSubmitted = await responses.create(a.ws, { instrumentId: instrument.id, itemSetId: instrument.itemSetId, inviteId: bo.id, deviceToken: randomBytes(16).toString("hex"), fields: {}, submittedAt: h(75), updatedAt: new Date(boResponse.updatedAt.getTime() + 1000) });
    expect(await invites.claimReminder(a.ws, bo.id, h(200), REMIND_AFTER_HOURS)).toBeNull();
    await responses.update(a.ws, boSubmitted.id, { updatedAt: new Date(boResponse.updatedAt.getTime() - 1000) });
    const boAgain = await invites.claimReminder(a.ws, bo.id, h(200), REMIND_AFTER_HOURS);
    expect(boAgain?.remindersSent).toBe(2);
    await invites.unclaimReminder(a.ws, bo.id, h(200), t1);
    await responses.remove(a.ws, boSubmitted.id);
    expect((await listInvitees(a.ws, instrument.id))[3].remindersSent).toBe(1);

    // Remind everyone 73 hours after Dee's reminder at h(74): Ana (h(73)), Bo (t1) and Dee
    // are due; Cy submitted, Ed never sent.
    const later = h(74 + 73);
    const all = await remindAll(a.ws, project.id, instrument.id, sender, BASE, later, keep);
    expect(all).toEqual({ outcomes: [{ email: "ana@x.example", sent: true, error: null }, { email: "bo@x.example", sent: true, error: null }, { email: "dee@x.example", sent: true, error: null }] });
    const finalRows = await listInvitees(a.ws, instrument.id);
    expect(finalRows.map((r) => [r.email, r.remindersSent])).toEqual([["ana@x.example", 3], ["bo@x.example", 2], ["cy@x.example", 0], ["dee@x.example", 2], ["ed@x.example", 0]]);
    expect(await remindAll(a.ws, project.id, instrument.id, sender, BASE, later, keep)).toEqual({ outcomes: [] });

    // A closed link refuses; the other workspace reads nothing and sends nothing.
    expect(await remindAll(a.ws, project.id, instrument.id, sender, BASE, new Date("2026-10-21T00:00:00Z"), keep)).toEqual({ error: "The public link is closed. Move its close date to send invites." });
    const sentBefore = sent.length;
    await expect(remindInvitee(b.ws, project.id, instrument.id, ana.id, sender, BASE, later, keep)).rejects.toThrow(NotFoundError);
    await expect(remindAll(b.ws, project.id, instrument.id, sender, BASE, later, keep)).rejects.toThrow(NotFoundError);
    expect(await invites.claimReminder(b.ws, ana.id, later, REMIND_AFTER_HOURS)).toBeNull();
    await invites.unclaimReminder(b.ws, ana.id, later, null);
    expect(await responses.forInvite(b.ws, bo.id)).toBeNull();
    expect(await answers.countForResponse(b.ws, boResponse.id)).toBe(0);
    expect(await answers.countForResponse(a.ws, boResponse.id)).toBe(2);
    expect(sent.length).toBe(sentBefore);
    expect((await listInvitees(a.ws, instrument.id))[0].remindersSent).toBe(3);
  }, 60_000);

  // E5-7 (amended 2026-10-06 after the audit): an Anonymous validation takes no reminder and
  // no new link, even for a personal invite a crafted write left on it (Share sends none), and
  // no invite: every server path answers the invites' message and sends nothing.
  it("refuses a reminder, a new link and an invite on an Anonymous validation", async () => {
    const project = await projects.create(a.ws, { name: "Anonymous survey", createdBy: a.userId });
    const pasted = await savePaste({ ws: a.ws, userId: a.userId }, project.id, ["One", "Two"].join("\n"));
    if (!("upload" in pasted)) throw new Error(pasted.error);
    await commitUpload(a.ws, pasted.upload.id, a.userId);
    const { instrument } = (await openDraft(a.ws, project))!;
    await saveFields(a.ws, project.id, instrument.id, JSON.stringify([{ label: "Role", type: "dropdown", mandatory: true, options: "Sales\nFinance" }]));
    const saved = await saveAnonymity(a.ws, project.id, instrument.id, "anonymous");
    if (!("instrument" in saved)) throw new Error(saved.error);
    const t0 = new Date("2026-10-03T12:00:00Z");
    const published = await publishLink(a.ws, project.id, instrument.id, "", "2026-10-20T15:00:00Z", "", t0);
    if (!("invite" in published)) throw new Error(published.error);
    const made = await invites.createPersonal(a.ws, instrument.id, [{ email: "ana@x.example", name: null, role: null, token: randomBytes(16).toString("hex") }], t0);
    if (!made || !("created" in made)) throw new Error("no invite");
    const [ana] = made.created;
    await invites.update(a.ws, ana.id, { sentAt: t0 });
    const sender = { name: "Dana PM", email: "dana@marlow.example" };
    const sent: Mail[] = [];
    const keep = async (mail: Mail) => { sent.push(mail); };
    const later = new Date("2026-10-08T12:00:00Z");
    expect(await remindInvitee(a.ws, project.id, instrument.id, ana.id, sender, BASE, later, keep)).toEqual({ error: INVITEES_ERRORS.anonymous });
    expect(await remindAll(a.ws, project.id, instrument.id, sender, BASE, later, keep)).toEqual({ error: INVITEES_ERRORS.anonymous });
    await invites.update(a.ws, ana.id, { revokedAt: later });
    expect(await renewInvitee(a.ws, project.id, instrument.id, ana.id, sender, BASE, later, keep)).toEqual({ error: INVITEES_ERRORS.anonymous });
    expect(await sendInvites(a.ws, project.id, instrument.id, "bo@x.example", sender, BASE, later, keep)).toEqual({ error: INVITEES_ERRORS.anonymous });
    expect(sent).toEqual([]);
    expect((await listInvitees(a.ws, instrument.id)).map((r) => [r.email, r.remindersSent])).toEqual([["ana@x.example", 0]]);
  }, 60_000);
});
