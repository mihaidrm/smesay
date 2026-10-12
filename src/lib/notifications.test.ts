// E16-1 and E16-2: the closing summary goes once, within 48 hours of the close, to the
// workspace's members only; the everyone-has-submitted email goes on the completing Submit,
// once; the digest goes at its hour to a person who turned it on, once a day; the series
// picks one step per run and stops at a published validation; nothing goes with the switch
// off or the gate unset. The memory transport only (decision 0039).
import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { emails, invites, projects, responses } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { commitUpload } from "@/lib/imports";
import { openDraft } from "@/lib/instruments";
import { listInvitees, sendInvites } from "@/lib/invitees";
import { memoryOutbox, type Mail } from "@/lib/mail";
import { closeInstant, notifyComplete, sendClosingSummaries, sendDigests, sendSeries, seriesDue } from "@/lib/notifications";
import { publishLink } from "@/lib/sharing";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const DAY = 86_400_000;
let a: { ws: WorkspaceId; userId: string; email: string };
let b: { ws: WorkspaceId; userId: string; email: string };

async function signIn(email: string) {
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, headers };
}

// A validation with a public link and personal invites, as a PM makes one.
async function validation(who: { ws: WorkspaceId; userId: string }, name: string, people: string, now: Date, closes: Date) {
  const project = await projects.create(who.ws, { name, createdBy: who.userId });
  const pasted = await savePaste({ ws: who.ws, userId: who.userId }, project.id, ["One", "Two", "Three"].join("\n"));
  if ("error" in pasted) throw new Error(pasted.error);
  await commitUpload(who.ws, pasted.upload.id, who.userId);
  const { instrument } = (await openDraft(who.ws, project))!;
  const published = await publishLink(who.ws, project.id, instrument.id, "", closes.toISOString(), "", now);
  if ("error" in published) throw new Error(published.error);
  const keep = async () => {};
  await sendInvites(who.ws, project.id, instrument.id, people, { name: "Mara", email: "mara@x.example" }, BASE, now, keep);
  return { project, instrument, rows: await listInvitees(who.ws, instrument.id) };
}
const submit = (ws: WorkspaceId, instrument: { id: string; itemSetId: string }, inviteId: string, at: Date) =>
  responses.create(ws, { instrumentId: instrument.id, itemSetId: instrument.itemSetId, inviteId, deviceToken: randomBytes(16).toString("hex"), fields: {}, submittedAt: at });
const collect = () => { const box: Mail[] = []; return { box, send: async (m: Mail) => { box.push(m); } }; };

beforeAll(async () => {
  await prepareTestDatabase();
  const stamp = Date.now();
  const one = await signIn(`notify-a-${stamp}@example.com`);
  const two = await signIn(`notify-b-${stamp}@example.com`);
  a = { ws: await requireWorkspace(one.headers, (await createWorkspaceWithSample({ name: "Notify A", slug: `notify-a-${stamp}` }, one.id)).id), userId: one.id, email: `notify-a-${stamp}@example.com` };
  b = { ws: await requireWorkspace(two.headers, (await createWorkspaceWithSample({ name: "Notify B", slug: `notify-b-${stamp}` }, two.id)).id), userId: two.id, email: `notify-b-${stamp}@example.com` };
}, 60_000);

describe("closeInstant", () => {
  const d = (s: string) => new Date(s);
  it("is the live public link's close date, else the last personal one, else none", () => {
    expect(closeInstant([{ kind: "public", closesAt: d("2026-10-20T15:00:00Z"), revokedAt: null, submitted: 0 }, { kind: "personal", closesAt: d("2026-10-25T15:00:00Z"), revokedAt: null, submitted: 0 }])).toEqual(d("2026-10-20T15:00:00Z"));
    expect(closeInstant([{ kind: "public", closesAt: d("2026-10-20T15:00:00Z"), revokedAt: d("2026-10-19T15:00:00Z"), submitted: 0 }, { kind: "personal", closesAt: d("2026-10-25T15:00:00Z"), revokedAt: null, submitted: 0 }, { kind: "personal", closesAt: d("2026-10-22T15:00:00Z"), revokedAt: null, submitted: 1 }])).toEqual(d("2026-10-25T15:00:00Z"));
    expect(closeInstant([{ kind: "personal", closesAt: null, revokedAt: null, submitted: 0 }, { kind: "personal", closesAt: d("2026-10-22T15:00:00Z"), revokedAt: null, submitted: 1 }])).toBeNull();
    expect(closeInstant([{ kind: "public", closesAt: d("2026-10-20T15:00:00Z"), revokedAt: d("2026-10-19T15:00:00Z"), submitted: 0 }])).toBeNull();
  });
});

describe("seriesDue (E16-2, acceptance 1 and 2)", () => {
  const signedUp = new Date("2026-10-01T10:00:00Z");
  const at = (days: number) => new Date(signedUp.getTime() + days * DAY);
  const person = (steps: Record<string, string>, hasList = false, published = false) => ({ createdAt: signedUp, hasList, published, steps });
  it("sends nothing before day 1, then the start step, then the latest due step whose condition holds", () => {
    expect(seriesDue(person({}), at(0.5))).toEqual({ send: null, handled: {} });
    expect(seriesDue(person({}), at(1.5))).toEqual({ send: "start", handled: { start: at(1.5).toISOString() } });
    expect(seriesDue(person({ start: "x" }), at(3.5))).toEqual({ send: "import", handled: { import: at(3.5).toISOString() } });
    expect(seriesDue(person({ start: "x" }, true), at(3.5))).toEqual({ send: null, handled: { import: "skipped" } });
    expect(seriesDue(person({ start: "x", import: "skipped" }, true), at(7.5))).toEqual({ send: "share", handled: { share: at(7.5).toISOString() } });
    expect(seriesDue(person({}), at(8))).toEqual({ send: "share", handled: { start: "skipped", import: "skipped", share: at(8).toISOString() } });
    expect(seriesDue(person({ start: "x", import: "x", share: "x" }), at(15))).toEqual({ send: "last", handled: { last: at(15).toISOString() } });
  });
  it("skips everything left once a validation is published", () => {
    expect(seriesDue(person({ start: "x" }, true, true), at(10))).toEqual({ send: null, handled: { import: "skipped", share: "skipped", last: "skipped" } });
  });
});

describe("the closing summary (E16-1, acceptance 1)", () => {
  it("goes once to the workspace's members, with the counts, the stop link and the headers", async () => {
    const t0 = new Date();
    const closes = new Date(t0.getTime() + DAY);
    const v = await validation(a, "Expense tool", "ana@x.example, Ana Pop\nbo@x.example", t0, closes);
    await submit(a.ws, v.instrument, v.rows.find((r) => r.email === "ana@x.example")!.id, t0);
    const { box, send } = collect();
    const after = new Date(closes.getTime() + 3_600_000);
    await sendClosingSummaries(BASE, after, send);
    const mine = box.filter((m) => m.subject.startsWith("Expense tool closed"));
    expect(mine.map((m) => m.to)).toEqual([a.email]);
    expect(mine[0].subject).toBe("Expense tool closed: 1 of 2 submitted");
    expect(mine[0].text).toContain("1 of the 2 people you invited submitted. 0 more answered through the public link.");
    expect(mine[0].text).toContain(`/app/projects/${v.project.id}/results`);
    expect(mine[0].text).toMatch(/Stop these emails: http:\/\/[^\s]+\/email\/stop\?t=[0-9a-f]{32}&k=validations/);
    expect(mine[0].headers).toMatchObject({ "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
    expect(mine[0].headers?.["List-Unsubscribe"]).toMatch(/^<http:\/\/[^\s]+\/api\/email\/stop\?t=[0-9a-f]{32}&k=validations>$/);
    const again = collect();
    await sendClosingSummaries(BASE, new Date(after.getTime() + 3_600_000), again.send);
    expect(again.box.filter((m) => m.subject.startsWith("Expense tool closed"))).toHaveLength(0);
  });
  it("sends nothing for a close older than 48 hours, nothing with the switch off, and nothing before the close", async () => {
    const t0 = new Date();
    const old = await validation(a, "Old tool", "cy@x.example", new Date(t0.getTime() - 5 * DAY), new Date(t0.getTime() - 4 * DAY));
    const open = await validation(a, "Open tool", "dee@x.example", t0, new Date(t0.getTime() + 2 * DAY));
    const { box, send } = collect();
    const r = await sendClosingSummaries(BASE, t0, send);
    expect(r.skipped).toBeGreaterThanOrEqual(1);
    expect(box.filter((m) => m.subject.startsWith("Old tool closed") || m.subject.startsWith("Open tool closed"))).toHaveLength(0);
    expect((await invites.publicForInstrument(a.ws, open.instrument.id))?.id).toBeTruthy();
    void old;
    await emails.setPrefs(b.userId, { validations: false, digest: false, guide: true });
    const quiet = await validation(b, "Quiet tool", "ed@x.example", t0, new Date(t0.getTime() + DAY));
    const after = collect();
    await sendClosingSummaries(BASE, new Date(t0.getTime() + DAY + 3_600_000), after.send);
    expect(after.box.filter((m) => m.subject.startsWith("Quiet tool closed"))).toHaveLength(0);
    void quiet;
  });
});

describe("everyone has submitted (E16-1, acceptance 2)", () => {
  it("goes on the Submit that completes the invites, once, and not before", async () => {
    const t0 = new Date();
    const v = await validation(a, "Complete tool", "fay@x.example\ngus@x.example", t0, new Date(t0.getTime() + 3 * DAY));
    await submit(a.ws, v.instrument, v.rows[0].id, t0);
    const first = collect();
    expect(await notifyComplete(a.ws, v.instrument.id, BASE, t0, first.send)).toBe(false);
    expect(first.box).toHaveLength(0);
    await submit(a.ws, v.instrument, v.rows[1].id, t0);
    const second = collect();
    expect(await notifyComplete(a.ws, v.instrument.id, BASE, t0, second.send)).toBe(true);
    expect(second.box.map((m) => [m.to, m.subject])).toEqual([[a.email, "Everyone has submitted on Complete tool"]]);
    expect(second.box[0].text).toContain("All 2 people you invited to Complete tool have submitted.");
    expect(second.box[0].text).toContain("The public link stays open until then.");
    const third = collect();
    expect(await notifyComplete(a.ws, v.instrument.id, BASE, t0, third.send)).toBe(false);
    expect(third.box).toHaveLength(0);
  });
});

describe("the digest (E16-1, acceptance 3)", () => {
  it("goes at its hour to a person who turned it on, once a day, with the day's submissions", async () => {
    const t0 = new Date();
    const v = await validation(a, "Digest tool", "hal@x.example\nida@x.example", t0, new Date(t0.getTime() + 3 * DAY));
    await submit(a.ws, v.instrument, v.rows[0].id, t0);
    const six = new Date(Date.UTC(t0.getUTCFullYear(), t0.getUTCMonth(), t0.getUTCDate(), 6, 30));
    if (six.getTime() <= t0.getTime()) six.setUTCDate(six.getUTCDate() + 1);
    const off = collect();
    await sendDigests(BASE, six, off.send);
    expect(off.box.filter((m) => m.to === a.email)).toHaveLength(0);
    await emails.setPrefs(a.userId, { validations: true, digest: true, guide: true });
    const wrongHour = collect();
    await sendDigests(BASE, new Date(six.getTime() + 3_600_000), wrongHour.send);
    expect(wrongHour.box).toHaveLength(0);
    const { box, send } = collect();
    await sendDigests(BASE, six, send);
    const mine = box.filter((m) => m.to === a.email);
    expect(mine).toHaveLength(1);
    expect(mine[0].text).toContain("Digest tool (Notify A): 1 new, 1 of 2 submitted, closes on");
    expect(mine[0].text).toMatch(/Stop these emails: http:\/\/[^\s]+\/email\/stop\?t=[0-9a-f]{32}&k=digest/);
    const again = collect();
    await sendDigests(BASE, new Date(six.getTime() + 60_000), again.send);
    expect(again.box.filter((m) => m.to === a.email)).toHaveLength(0);
  });
});

describe("the series (E16-2)", () => {
  it("counts without the gate, sends the start step with it, and skips a person who published", async () => {
    const stamp = Date.now();
    const email = `notify-c-${stamp}@example.com`;
    await signIn(email);
    const later = new Date(Date.now() + 2 * DAY);
    const counted = collect();
    const gated = await sendSeries(BASE, later, counted.send, {});
    expect(gated.due).toBeGreaterThanOrEqual(1);
    expect(counted.box).toHaveLength(0);
    const { box, send } = collect();
    await sendSeries(BASE, later, send, { LIFECYCLE_EMAILS: "on" });
    const mine = box.filter((m) => m.to === email);
    expect(mine.map((m) => m.subject)).toEqual(["Your first validation in ten minutes"]);
    expect(mine[0].text).toContain("The first step is to name your workspace");
    expect(mine[0].text).toContain("/app?from=email-start");
    expect(mine[0].text).toMatch(/Stop these emails: http:\/\/[^\s]+\/email\/stop\?t=[0-9a-f]{32}&k=guide/);
    // The PM of workspace A published validations above: nothing of the series goes to them.
    expect(box.filter((m) => m.to === a.email)).toHaveLength(0);
    const again = collect();
    await sendSeries(BASE, new Date(later.getTime() + 3_600_000), again.send, { LIFECYCLE_EMAILS: "on" });
    expect(again.box.filter((m) => m.to === email)).toHaveLength(0);
  });
});
