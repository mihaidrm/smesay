// Personal invites (stories/E6-2) on the test database: the list parser (acceptance 1), the
// minutes estimate (acceptance 2), and sendInvites: refused before the public link is
// published, one row and one email 2 per address with its own token and the link's dates
// (acceptance 2), the repeat refused (acceptance 1), a failed send kept as Not sent with the
// provider's reason while the others go (acceptance 5), the rows' status from the responses
// (acceptance 4), the personal link's prefill (acceptance 3), and another workspace reading
// nothing.
import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { instruments, invites, links, projects, responses } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { commitUpload } from "@/lib/imports";
import { buildOnLatest, openDraft, saveIntro } from "@/lib/instruments";
import { cutServers, INVITEES_COPY, INVITEES_ERRORS, inviteStatus, listInvitees, refusalCopy, sendInvites } from "@/lib/invitees";
import { INVITEES_MAX_PER_SEND, minutesFor, parseInvitees } from "@/lib/invitees-rules";
import { memoryOutbox, type Mail } from "@/lib/mail";
import { BUILD_COPY } from "@/lib/build-copy";
import { NotFoundError } from "@/lib/errors";
import { setArchived } from "@/lib/projects";
import { publishLink, saveLink, SHARE_COPY } from "@/lib/sharing";
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
  const signedIn = await signIn(`invitees-${stamp}@example.com`);
  const wsA = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Invitees A", slug: `invitees-a-${stamp}` }, signedIn.id)).id);
  const wsB = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Invitees B", slug: `invitees-b-${stamp}` }, signedIn.id)).id);
  a = { ws: wsA, userId: signedIn.id }; b = { ws: wsB, userId: signedIn.id };
}, 60_000);

describe("parseInvitees (acceptance 1)", () => {
  it("takes addresses apart by new lines, commas, semicolons or spaces, with a name and a role after commas", () => {
    expect(parseInvitees("ana@x.example, Ana Pop, Finance\nbo@x.example\nCy@x.example; dee@x.example ed@x.example")).toEqual({ invitees: [
      { email: "ana@x.example", name: "Ana Pop", role: "Finance" },
      { email: "bo@x.example", name: null, role: null },
      { email: "cy@x.example", name: null, role: null },
      { email: "dee@x.example", name: null, role: null },
      { email: "ed@x.example", name: null, role: null },
    ] });
    expect(parseInvitees("ana@x.example, Ana\nana@x.example, Again")).toEqual({ invitees: [{ email: "ana@x.example", name: "Ana", role: null }] });
  });
  it("refuses an empty list, a piece that is not an address, a third piece, a long name and more than the cap", () => {
    expect(parseInvitees("")).toEqual({ error: INVITEES_ERRORS.empty });
    expect(parseInvitees(" \n , ")).toEqual({ error: INVITEES_ERRORS.empty });
    expect(parseInvitees(42)).toEqual({ error: INVITEES_ERRORS.badShape });
    expect(parseInvitees("Ana Pop, ana@x.example")).toEqual({ error: INVITEES_ERRORS.badAddress("Ana Pop") });
    expect(parseInvitees("ana@x.example, Ana, Finance, Extra")).toEqual({ error: INVITEES_ERRORS.badAddress("Extra") });
    expect(parseInvitees("not an address")).toEqual({ error: INVITEES_ERRORS.badAddress("not an address") });
    expect(parseInvitees(`ana@x.example, ${"n".repeat(81)}`)).toEqual({ error: INVITEES_ERRORS.longName });
    expect(parseInvitees(`ana@x.example, ${"n".repeat(80)}`)).toEqual({ invitees: [{ email: "ana@x.example", name: "n".repeat(80), role: null }] });
    const many = Array.from({ length: INVITEES_MAX_PER_SEND + 1 }, (_, i) => `p${i}@x.example`).join("\n");
    expect(parseInvitees(many)).toEqual({ error: INVITEES_ERRORS.tooMany });
  });
});

describe("minutesFor (acceptance 2)", () => {
  it("counts 20 seconds per item and rounds up to the next five minutes, at least five", () => {
    expect(minutesFor(1)).toBe(5);
    expect(minutesFor(15)).toBe(5);
    expect(minutesFor(16)).toBe(10);
    expect(minutesFor(60)).toBe(20);
    expect(minutesFor(61)).toBe(25);
  });
});

describe("sendInvites", () => {
  it("needs the public link, then makes one row and one email per address, refuses a repeat, keeps a failed send as Not sent", async () => {
    const project = await projects.create(a.ws, { name: "Expense tool", createdBy: a.userId });
    const pasted = await savePaste({ ws: a.ws, userId: a.userId }, project.id, ["One", "Two", "Three"].join("\n"));
    if (!("upload" in pasted)) throw new Error(pasted.error);
    await commitUpload(a.ws, pasted.upload.id, a.userId);
    const { instrument } = (await openDraft(a.ws, project))!;
    await saveIntro(a.ws, project.id, instrument.id, "Expense tool", "Line one.\nLine two.\nLine three.\nLine four.");
    const sender = { name: "Dana PM", email: "dana@marlow.example" };
    const now = new Date("2026-10-03T12:00:00Z");
    expect(await sendInvites(a.ws, project.id, instrument.id, "ana@x.example", sender, BASE, now)).toEqual({ error: INVITEES_COPY.needLink });
    const published = await publishLink(a.ws, project.id, instrument.id, "", "2026-10-20T15:00:00Z", "letmein", now);
    if (!("invite" in published)) throw new Error(published.error);
    expect(await sendInvites(a.ws, project.id, instrument.id, "nope", sender, BASE, now)).toEqual({ error: INVITEES_ERRORS.badAddress("nope") });

    // Two people; the second transport call fails as a provider would.
    const sent: Mail[] = [];
    const flaky = async (mail: Mail) => { if (mail.to === "bo@x.example") throw new Error("550 5.1.1 The email account that you tried to reach does not exist\nmore"); sent.push(mail); };
    const result = await sendInvites(a.ws, project.id, instrument.id, "ana@x.example, Ana Pop, Finance\nbo@x.example, Bo", sender, BASE, now, flaky);
    if (!("outcomes" in result)) throw new Error(result.error);
    expect(result.outcomes).toEqual([
      { email: "ana@x.example", line: "ana@x.example, Ana Pop, Finance", sent: true, error: null },
      { email: "bo@x.example", line: "bo@x.example, Bo", sent: false, error: INVITEES_ERRORS.notSent("bo@x.example", "550 5.1.1 The email account that you tried to reach does not exist") },
    ]);
    expect(sent).toHaveLength(1);
    const mail = sent[0];
    expect(mail.to).toBe("ana@x.example");
    expect(mail.fromName).toBe("Dana PM via SMEsay");
    expect(mail.replyTo).toBe("dana@marlow.example");
    expect(mail.subject).toBe("Dana PM asks for your view on Expense tool");
    expect(mail.text).toContain("Hi Ana Pop,");
    expect(mail.text).toContain("Dana PM at Invitees A is checking a list of 3 requirements for Expense tool");
    expect(mail.text).toContain("It takes about 5 minutes.");
    expect(mail.text).toContain("Line three.");
    expect(mail.text).not.toContain("Line four.");
    expect(mail.text).toContain("It closes on 20 Oct 2026, 15:00 UTC.");
    expect(mail.html).toContain("Open your link");
    const url = mail.text.split("\n").find((l) => l.startsWith(`${BASE}/r/`))!;
    expect(url).toMatch(/\/r\/[0-9a-f]{32}$/);
    expect(mail.html).toContain(url);

    // The rows: tokens of their own, the link's dates, no passcode; the failed one with its
    // reason; the statuses.
    const rows = await listInvitees(a.ws, instrument.id);
    expect(rows.map((r) => [r.email, r.name, r.roleHint, inviteStatus(r), r.sendError])).toEqual([
      ["ana@x.example", "Ana Pop", "Finance", "invited", null],
      ["bo@x.example", "Bo", null, "notSent", "550 5.1.1 The email account that you tried to reach does not exist"],
    ]);
    expect(rows[0].sentAt).toEqual(now);
    expect(rows[1].sentAt).toBeNull();
    expect(rows[0].token).toMatch(/^[0-9a-f]{32}$/);
    expect(rows[0].token).not.toBe(rows[1].token);
    expect(rows[0].token).not.toBe(published.invite.token);
    expect(rows[0].closesAt).toEqual(new Date("2026-10-20T15:00:00Z"));
    expect(rows[0].opensAt).toBeNull();
    expect(rows[0].passcodeHash).toBeNull();
    expect(url.endsWith(rows[0].token)).toBe(true);

    // A repeat of a sent address is refused whole: nothing is sent for the new address
    // either. The Not sent address goes again on its row and token, with the role typed now;
    // a connection string in the reason is cut; a missing mail variable is thrown, not stored.
    expect(await sendInvites(a.ws, project.id, instrument.id, "cy@x.example\nana@x.example", sender, BASE, now, flaky)).toEqual({ error: INVITEES_ERRORS.already("ana@x.example") });
    expect(await listInvitees(a.ws, instrument.id)).toHaveLength(2);
    const later = new Date("2026-10-03T13:00:00Z");
    expect(await invites.claimResend(b.ws, rows[1].id, { name: null, roleHint: null }, later)).toBeNull();
    const again = await sendInvites(a.ws, project.id, instrument.id, "bo@x.example, Bo, Sales", sender, BASE, later, async (mail) => { sent.push(mail); });
    expect(again).toEqual({ outcomes: [{ email: "bo@x.example", line: "bo@x.example, Bo, Sales", sent: true, error: null }] });
    const resent = (await listInvitees(a.ws, instrument.id))[1];
    expect([resent.id, resent.token, resent.roleHint, resent.sentAt, resent.sendError, inviteStatus(resent)]).toEqual([rows[1].id, rows[1].token, "Sales", later, null, "invited"]);
    expect(sent[1].to).toBe("bo@x.example");
    const dee = await sendInvites(a.ws, project.id, instrument.id, "dee@x.example", sender, BASE, now, async () => { throw new Error("connect ECONNREFUSED smtp://user:secret@mail.example:587 now"); });
    expect(dee).toEqual({ outcomes: [{ email: "dee@x.example", line: "dee@x.example", sent: false, error: INVITEES_ERRORS.notSent("dee@x.example", "connect ECONNREFUSED [server] now") }] });
    const cut = await sendInvites(a.ws, project.id, instrument.id, "gil@x.example", sender, BASE, now, async () => { throw new Error("getaddrinfo ENOTFOUND smtp_relay.internal.example 10.0.0.5:587 mail.internal:25 <gil@x.example> at 10:30, code 5.1.1."); });
    expect(cut).toEqual({ outcomes: [{ email: "gil@x.example", line: "gil@x.example", sent: false, error: INVITEES_ERRORS.notSent("gil@x.example", "getaddrinfo ENOTFOUND [server] [server] [server] [server] at 10:30, code 5.1.1") }] });
    expect(cutServers("user:secret@mail.example:587 refused; login failed for user:hunter2@relay.corp.example; see https://x.example/help (host.example).")).toBe("[server] refused; login failed for [server] see [server] [server]");
    expect(cutServers("550 5.1.1 Node.js Code:550 try 10:30 x")).toBe("550 5.1.1 [server] [server] try 10:30 x");
    expect(cutServers("mail.example.com[192.0.2.1]:25: <unknown[192.0.2.1]>: [10.0.0.5] 10.0.0.5/24 mail.example?")).toBe("[server] [server] [server] [server] [server]");
    expect(cutServers("connect ECONNREFUSED ::1:587 [2001:db8::1]:587 fd00::5 (::1) refused.Please")).toBe("connect ECONNREFUSED [server] [server] [server] [server] [server]");
    expect(cutServers("(".repeat(5000) + "x")).toBe("(".repeat(200));
    const slowStart = Date.now();
    expect(cutServers("a".repeat(16000) + " " + "-a".repeat(8000))).toBe("a".repeat(200));
    expect(Date.now() - slowStart).toBeLessThan(500);
    const only = await sendInvites(a.ws, project.id, instrument.id, "gus3@x.example", sender, BASE, now, async () => { throw new Error("mail.internal:25"); });
    expect(only).toEqual({ outcomes: [{ email: "gus3@x.example", line: "gus3@x.example", sent: false, error: INVITEES_ERRORS.notSent("gus3@x.example", "the mail server refused it, and its reason named only servers") }] });
    // A long reason is cut to 200 characters before the patterns run, in bounded time.
    const started = Date.now();
    const long = await sendInvites(a.ws, project.id, instrument.id, "gus2@x.example", sender, BASE, now, async () => { throw new Error("a:".repeat(5000)); });
    expect(Date.now() - started).toBeLessThan(2000);
    if (!("outcomes" in long)) throw new Error(long.error);
    expect(long.outcomes[0].error!.length).toBeLessThan(320);
    await expect(sendInvites(a.ws, project.id, instrument.id, "ed@x.example", sender, BASE, now, async () => { throw new Error("MAIL_SMTP_URL is not set. Copy .env.example to .env.local and fill it in (docs/setup.md)."); })).rejects.toThrow("MAIL_SMTP_URL is not set");
    const ed = (await listInvitees(a.ws, instrument.id))[6];
    expect([ed.email, inviteStatus(ed), ed.sendError]).toEqual(["ed@x.example", "notSent", null]);
    // A row with no outcome yet is in flight for 15 minutes, then can be sent again; two
    // resends of one failed row at once send one email.
    expect(await sendInvites(a.ws, project.id, instrument.id, "ed@x.example", sender, BASE, now, async (mail) => { sent.push(mail); })).toEqual({ outcomes: [{ email: "ed@x.example", line: "ed@x.example", sent: false, error: INVITEES_ERRORS.inFlight("ed@x.example") }] });
    const much = new Date(ed.sendStartedAt!.getTime() + 16 * 60 * 1000);
    expect(await sendInvites(a.ws, project.id, instrument.id, "ed@x.example", sender, BASE, much, async (mail) => { sent.push(mail); })).toEqual({ outcomes: [{ email: "ed@x.example", line: "ed@x.example", sent: true, error: null }] });
    const failedTwice = await sendInvites(a.ws, project.id, instrument.id, "hal@x.example", sender, BASE, much, async () => { throw new Error("451 try later."); });
    expect(failedTwice).toEqual({ outcomes: [{ email: "hal@x.example", line: "hal@x.example", sent: false, error: INVITEES_ERRORS.notSent("hal@x.example", "451 try later") }] });
    const slow = async (mail: Mail) => { await new Promise((r) => setTimeout(r, 50)); sent.push(mail); };
    const twice = await Promise.all([
      sendInvites(a.ws, project.id, instrument.id, "hal@x.example", sender, BASE, much, slow),
      sendInvites(a.ws, project.id, instrument.id, "hal@x.example", sender, BASE, much, slow),
    ]);
    const halOutcomes = twice.flatMap((r) => ("outcomes" in r ? r.outcomes : []));
    expect(halOutcomes.filter((o) => o.sent)).toHaveLength(1);
    expect([...halOutcomes.map((o) => o.error), ...twice.map((r) => ("error" in r ? r.error : null))].filter((e) => e === INVITEES_ERRORS.inFlight("hal@x.example") || e === INVITEES_ERRORS.already("hal@x.example"))).toHaveLength(1);
    expect(sent.filter((m) => m.to === "hal@x.example")).toHaveLength(1);

    // Two sends of one new address at once: one row, one email, the other told it exists
    // (under its count when its row insert lost, or as the whole refusal when it read the
    // row sent first).
    const both = await Promise.all([
      sendInvites(a.ws, project.id, instrument.id, "fay@x.example", sender, BASE, now, async (mail) => { sent.push(mail); }),
      sendInvites(a.ws, project.id, instrument.id, "fay@x.example", sender, BASE, now, async (mail) => { sent.push(mail); }),
    ]);
    const fayOutcomes = both.flatMap((r) => ("outcomes" in r ? r.outcomes : []));
    expect(fayOutcomes.filter((o) => o.sent)).toHaveLength(1);
    expect([...fayOutcomes.map((o) => o.error), ...both.map((r) => ("error" in r ? r.error : null))].filter((e) => e === INVITEES_ERRORS.already("fay@x.example") || e === INVITEES_ERRORS.inFlight("fay@x.example"))).toHaveLength(1);
    expect((await listInvitees(a.ws, instrument.id)).filter((r) => r.email === "fay@x.example")).toHaveLength(1);
    expect(sent.filter((m) => m.to === "fay@x.example")).toHaveLength(1);

    // The daily limit says how many can still go.
    expect(INVITEES_ERRORS.tooManyToday(0)).toBe("This workspace sent 500 invites in the last 24 hours. Try again later.");
    expect(INVITEES_ERRORS.tooManyToday(1)).toBe("This workspace can send 1 more invite right now (500 in any 24 hours). Shorten the list, or try again later.");
    // The sample's 6 and this test's 9 so far (ana, bo, dee, gil, gus2, gus3, ed, fay, hal).
    expect(await invites.countPersonalSince(a.ws, 24 * 60, new Date())).toBeGreaterThanOrEqual(15);
    expect(await invites.countPersonalSince(a.ws, 24 * 60, new Date(Date.now() + 48 * 60 * 60 * 1000))).toBe(0);
    expect(await invites.countPersonalSince(b.ws, 24 * 60, new Date())).toBe(6);
    // The personal links follow the public link's dates and carry the open date in the
    // email when it is later than the send; a closed link refuses sends.
    const moved = await saveLink(a.ws, project.id, instrument.id, published.invite.id, "2026-10-05T00:00:00Z", "2026-10-25T15:00:00Z", "", false, now);
    if (!("invite" in moved)) throw new Error(moved.error);
    const followed = (await listInvitees(a.ws, instrument.id))[0];
    expect([followed.opensAt, followed.closesAt, followed.passcodeHash]).toEqual([new Date("2026-10-05T00:00:00Z"), new Date("2026-10-25T15:00:00Z"), null]);
    const opensLater = await sendInvites(a.ws, project.id, instrument.id, "ivy@x.example", sender, BASE, now, async (mail) => { sent.push(mail); });
    expect(opensLater).toEqual({ outcomes: [{ email: "ivy@x.example", line: "ivy@x.example", sent: true, error: null }] });
    expect(sent[sent.length - 1].text).toContain("It opens on 5 Oct 2026, 00:00 UTC. It closes on 25 Oct 2026, 15:00 UTC.");
    expect(await sendInvites(a.ws, project.id, instrument.id, "gus@x.example", sender, BASE, new Date("2026-10-26T00:00:00Z"))).toEqual({ error: INVITEES_COPY.linkClosed });

    // The personal link opens without the passcode and carries the name and role; a
    // response in progress and a submitted one change the status.
    const link = (await links.byToken(rows[0].token))!;
    expect(link.invite.kind).toBe("personal");
    expect(link.invite.passcodeHash).toBeNull();
    expect([link.invite.name, link.invite.roleHint]).toEqual(["Ana Pop", "Finance"]);
    await responses.create(a.ws, { instrumentId: instrument.id, itemSetId: instrument.itemSetId, inviteId: rows[0].id, deviceToken: randomBytes(16).toString("hex"), fields: { name: "Ana Pop", role: "Finance" } });
    expect(inviteStatus((await listInvitees(a.ws, instrument.id))[0])).toBe("inProgress");
    const submitted = new Date("2026-10-04T09:30:00Z");
    await responses.create(a.ws, { instrumentId: instrument.id, itemSetId: instrument.itemSetId, inviteId: rows[1].id, deviceToken: randomBytes(16).toString("hex"), fields: {}, submittedAt: submitted });
    const after = await listInvitees(a.ws, instrument.id);
    expect(inviteStatus(after[1])).toBe("submitted");
    expect(after[1].answeredAt).toEqual(submitted);

    // Another workspace: the list is empty, the send is 404 (own() throws) with no row and
    // no email in either workspace, and the address cannot be read.
    const before = (await listInvitees(a.ws, instrument.id)).length;
    const sentBefore = sent.length;
    expect(await listInvitees(b.ws, instrument.id)).toEqual([]);
    await expect(sendInvites(b.ws, project.id, instrument.id, "x@x.example", sender, BASE, now, async (mail) => { sent.push(mail); })).rejects.toThrow(NotFoundError);
    expect(await invites.personalByEmail(b.ws, instrument.id, "ana@x.example")).toBeNull();
    expect(await invites.createPersonal(b.ws, instrument.id, [{ email: "x@x.example", name: null, role: null, token: "f".repeat(32) }], now)).toBeNull();
    expect(await invites.personalByEmail(a.ws, instrument.id, "x@x.example")).toBeNull();
    expect((await listInvitees(a.ws, instrument.id)).length).toBe(before);
    expect(sent.length).toBe(sentBefore);

    // An archived project refuses; a newer version published closes the personal links too.
    await setArchived(a.ws, project.id, true);
    expect(await sendInvites(a.ws, project.id, instrument.id, "x@x.example", sender, BASE, now)).toEqual({ error: SHARE_COPY.archived });
    await setArchived(a.ws, project.id, false);
    const pasted2 = await savePaste({ ws: a.ws, userId: a.userId }, project.id, ["One", "Two"].join("\n"));
    if (!("upload" in pasted2)) throw new Error(pasted2.error);
    await commitUpload(a.ws, pasted2.upload.id, a.userId);
    const built = await buildOnLatest(a.ws, project.id, instrument.id);
    if (!("instrument" in built)) throw new Error(built.error);
    const newer = await instruments.get(a.ws, built.instrument.id);
    const publishedAgain = await publishLink(a.ws, project.id, newer!.id, "", "2026-11-20T15:00:00Z", "", new Date("2026-10-06T12:00:00Z"));
    if (!("invite" in publishedAgain)) throw new Error(publishedAgain.error);
    expect(newer!.id).not.toBe(instrument.id);
    expect((await listInvitees(a.ws, instrument.id))[0].closesAt).toEqual(new Date("2026-10-06T12:00:00Z"));
    // The replaced instrument refuses under the lock (and own() before it, for a stale
    // tab); closed and revoked refuse there too; each refusal has its words; the newer one
    // sends.
    expect(await invites.createPersonal(a.ws, instrument.id, [{ email: "y@x.example", name: null, role: null, token: "e".repeat(32) }], now)).toEqual({ refused: "replaced" });
    expect(await sendInvites(a.ws, project.id, instrument.id, "y@x.example", sender, BASE, now)).toEqual({ error: BUILD_COPY.replaced });
    expect(await invites.createPersonal(a.ws, newer!.id, [{ email: "y@x.example", name: null, role: null, token: "e".repeat(32) }], new Date("2026-11-21T00:00:00Z"))).toEqual({ refused: "closed" });
    await invites.update(a.ws, publishedAgain.invite.id, { revokedAt: new Date("2026-10-07T00:00:00Z") });
    expect(await invites.createPersonal(a.ws, newer!.id, [{ email: "y@x.example", name: null, role: null, token: "e".repeat(32) }], now)).toEqual({ refused: "revoked" });
    await invites.update(a.ws, publishedAgain.invite.id, { revokedAt: null });
    expect([refusalCopy("none"), refusalCopy("replaced"), refusalCopy("revoked"), refusalCopy("closed")]).toEqual([INVITEES_COPY.needLink, INVITEES_COPY.linkReplaced, INVITEES_COPY.linkRevoked, INVITEES_COPY.linkClosed]);
    const onNewer = await sendInvites(a.ws, project.id, newer!.id, "zed@x.example", sender, BASE, new Date("2026-10-07T12:00:00Z"), async (mail) => { sent.push(mail); });
    expect(onNewer).toEqual({ outcomes: [{ email: "zed@x.example", line: "zed@x.example", sent: true, error: null }] });
  }, 60_000);

  it("refuses the sample project", async () => {
    const sample = (await projects.list(a.ws)).find((p) => p.isSample)!;
    const live = (await invites.livePublic(a.ws, sample.id))!;
    const before = (await listInvitees(a.ws, live.instrumentId)).length;
    expect(before).toBeGreaterThan(0);
    expect(await sendInvites(a.ws, sample.id, live.instrumentId, "x@x.example", { name: null, email: "pm@x.example" }, BASE)).toEqual({ error: BUILD_COPY.sample });
    expect(await listInvitees(a.ws, live.instrumentId)).toHaveLength(before);
    expect(await invites.personalByEmail(a.ws, live.instrumentId, "x@x.example")).toBeNull();
  });
});
