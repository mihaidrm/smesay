// Personal invites (stories/E6-2) on the test database: the list parser (acceptance 1), the
// minutes estimate (acceptance 2), and sendInvites: refused before the public link is
// published, one row and one email 2 per address with its own token and the link's dates
// (acceptance 2), the repeat refused (acceptance 1), a failed send kept as Not sent with the
// provider's reason while the others go (acceptance 5), the rows' status from the responses
// (acceptance 4), the personal link's prefill (acceptance 3), and another workspace reading
// nothing.
import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { invites, links, projects, responses } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { commitUpload } from "@/lib/imports";
import { openDraft, saveIntro } from "@/lib/instruments";
import { INVITEES_COPY, INVITEES_ERRORS, inviteStatus, listInvitees, sendInvites } from "@/lib/invitees";
import { INVITEES_MAX_PER_SEND, minutesFor, parseInvitees } from "@/lib/invitees-rules";
import { memoryOutbox, type Mail } from "@/lib/mail";
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
      { email: "ana@x.example", sent: true, error: null },
      { email: "bo@x.example", sent: false, error: INVITEES_ERRORS.notSent("bo@x.example", "550 5.1.1 The email account that you tried to reach does not exist") },
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

    // A repeat is refused whole: nothing is sent for the new address either.
    expect(await sendInvites(a.ws, project.id, instrument.id, "cy@x.example\nana@x.example", sender, BASE, now, flaky)).toEqual({ error: INVITEES_ERRORS.already("ana@x.example") });
    expect(await listInvitees(a.ws, instrument.id)).toHaveLength(2);

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

    // Another workspace: the list is empty and the send is 404 (own() throws).
    expect(await listInvitees(b.ws, instrument.id)).toEqual([]);
    await expect(sendInvites(b.ws, project.id, instrument.id, "x@x.example", sender, BASE, now)).rejects.toThrow();
    expect(await invites.personalByEmail(b.ws, instrument.id, "ana@x.example")).toBeNull();
  }, 60_000);

  it("refuses the sample project", async () => {
    const sample = (await projects.list(a.ws)).find((p) => p.isSample)!;
    const live = (await invites.livePublic(a.ws, sample.id))!;
    const result = await sendInvites(a.ws, sample.id, live.instrumentId, "x@x.example", { name: null, email: "pm@x.example" }, BASE);
    expect("error" in result).toBe(true);
  });
});
