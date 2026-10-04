// The respondent journey's start (stories/E7-1) on the test database: the field rules (only
// the PM's fields kept, dropdown options, email, mandatory, carried name and role), the
// perspectives, the chapters a respondent sees, and Start on each kind of link: a public
// link creates one response per device with a 32-hex device token in a cookie on the
// link's path, a second Start on that device updates it; a personal link has one response
// even when two Starts race; a passcode link without the proof, a sample link, a closed
// and a revoked link write nothing, and a link that changed under the invite's lock wins;
// a closed personal link whose respondent answered something and did not submit shows the
// respondent's own state; a rate-blind instrument sends no proposed value; another
// workspace's rows are never touched. The answers (stories/E7-2): the card's note, the
// mapping of a pick to the stored answer (the reason kept only when it is needed, the
// comment only when it is not), one answer per item that the last save replaces, and the
// refusals: not started, an item not in the list, a value not on the scale, a revoked link.
// E7-3: the landing chapter for a returning visit (resumeAt); a write lands when it was made
// on the stored version, comes from the page that wrote it last with a higher number, or names
// the last writer's save (or a later one of its own page) among the saves it was made on top
// of (after), and otherwise changes nothing and gets the stored answer back (409 stale at the
// route); a write
// for a response that is not the device's is "not started"; the autosave route after a
// revocation answers 410 and writes nothing.
import { beforeAll, describe, expect, it } from "vitest";
import { answers, invites, items, projects, responses } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { RespondentFieldSpec, WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { commitUpload } from "@/lib/imports";
import { openDraft, saveFields, savePerspectives, saveScoring, tagItem } from "@/lib/instruments";
import { listInvitees, sendInvites } from "@/lib/invitees";
import { checkPasscode, clearAttempts } from "@/lib/link-access";
import { memoryOutbox, type Mail } from "@/lib/mail";
import { DEVICE_COOKIE, loadRespondent, saveAnswer, startResponse } from "@/lib/respondent";
import { cookieValue } from "@/lib/request-cookies";
import { isJsonType, JSON_BODY_MAX, readJson } from "@/lib/request-json";
import { answeredCount, answerFor, carriedFields, chaptersFor, gapsOf, isComplete, landingOf, needsReason, noteFor, progressOf, parseAnswerInput, parseFieldValues, parsePicks, parseScreen, pickedOf, RESPONDENT_COPY, RESPONDENT_ERRORS, resumeAt, screenCount, screenParam, type RespondentItem } from "@/lib/respondent-rules";
import { linkState } from "@/lib/sharing";
import { publishLink, revokeLink, saveLink } from "@/lib/sharing";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";
import { POST as startRoute } from "@/app/r/[token]/start/route";
import { PUT as answersRoute } from "@/app/r/[token]/answers/route";

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
  const signedIn = await signIn(`respondent-${stamp}@example.com`);
  const wsA = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Respondent A", slug: `respondent-a-${stamp}` }, signedIn.id)).id);
  const wsB = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Respondent B", slug: `respondent-b-${stamp}` }, signedIn.id)).id);
  a = { ws: wsA, userId: signedIn.id }; b = { ws: wsB, userId: signedIn.id };
}, 60_000);

const FIELDS: RespondentFieldSpec[] = [
  { key: "name", label: "Name", type: "text", mandatory: true },
  { key: "role", label: "Role", type: "dropdown", mandatory: true, options: ["Sales", "Finance"] },
  { key: "email", label: "Email", type: "email", mandatory: false },
];

describe("the field rules", () => {
  it("keeps only the PM's fields, checks options, addresses, length and the mandatory ones", () => {
    expect(parseFieldValues(FIELDS, { name: " Ana ", role: "Sales", email: "", extra: "dropped" }, {})).toEqual({ values: { name: "Ana", role: "Sales" } });
    expect(parseFieldValues(FIELDS, { name: "Ana", role: "Ops" }, {})).toEqual({ error: RESPONDENT_ERRORS.badOption("Role") });
    expect(parseFieldValues(FIELDS, { name: "Ana", role: "Sales", email: "nope" }, {})).toEqual({ error: RESPONDENT_ERRORS.badEmail("nope") });
    expect(parseFieldValues(FIELDS, { name: "x".repeat(201), role: "Sales" }, {})).toEqual({ error: RESPONDENT_ERRORS.tooLong("Name") });
    expect(parseFieldValues(FIELDS, { name: "Ana" }, {})).toEqual({ error: "Fill in your name and role to start." });
    expect(parseFieldValues(FIELDS, { name: 3, role: "Sales" }, {})).toEqual({ error: RESPONDENT_ERRORS.badShape });
    expect(parseFieldValues(FIELDS, "nope", {})).toEqual({ error: RESPONDENT_ERRORS.badShape });
    // The carried values win over anything posted for their keys.
    expect(parseFieldValues(FIELDS, { name: "Someone else" }, { name: "Ana Pop", role: "Finance" })).toEqual({ values: { name: "Ana Pop", role: "Finance" } });
  });
  it("carries a personal invite's name and role onto the PM's fields only, a dropdown only with an option", () => {
    expect(carriedFields({ kind: "personal", name: "Ana", roleHint: "Finance" }, FIELDS)).toEqual({ name: "Ana", role: "Finance" });
    expect(carriedFields({ kind: "personal", name: "Ana", roleHint: "Ops" }, FIELDS)).toEqual({ name: "Ana" });
    expect(carriedFields({ kind: "public", name: "Ana", roleHint: "Sales" }, FIELDS)).toEqual({});
    expect(carriedFields({ kind: "personal", name: "Ana", roleHint: "Sales" }, [FIELDS[2]])).toEqual({});
  });
  it("takes the perspectives from the instrument's list only", () => {
    expect(parsePicks(["Finance", "Sales"], ["Sales", "Finance", "Sales"])).toEqual({ picks: ["Finance", "Sales"] });
    expect(parsePicks(["Finance"], ["Ops"])).toEqual({ error: RESPONDENT_ERRORS.badPerspective });
    expect(parsePicks(["Finance"], undefined)).toEqual({ picks: [] });
  });
});

describe("screens, completeness and the request readers", () => {
  it("reads the screen from the address; before Start only About you", () => {
    expect(parseScreen("2", false, 3)).toEqual({ kind: "about" });
    expect(parseScreen("about", true, 3)).toEqual({ kind: "about" });
    expect(parseScreen("2", true, 3)).toEqual({ kind: "chapter", index: 1 });
    expect([parseScreen("9", true, 3), parseScreen("1.5", true, 3), parseScreen(null, true, 3)]).toEqual([{ kind: "chapter", index: 0 }, { kind: "chapter", index: 0 }, { kind: "chapter", index: 0 }]);
    expect(parseScreen("1", true, 0)).toEqual({ kind: "about" });
    expect([screenParam({ kind: "about" }), screenParam({ kind: "chapter", index: 2 })]).toEqual(["about", "3"]);
  });
  it("counts an answer only when complete: a reason for change, disagree and unclear", () => {
    expect((["agree", "pick", "change", "disagree", "unclear"] as const).map(needsReason)).toEqual([false, false, true, true, true]);
    expect(isComplete({ kind: "change", value: "S", reason: "Later", comment: null })).toBe(true);
    expect(isComplete({ kind: "unclear", value: null, reason: "  ", comment: null })).toBe(false);
    expect(isComplete({ kind: "agree", value: "M", reason: null, comment: null })).toBe(true);
    expect(isComplete(undefined)).toBe(false);
    const done = { kind: "agree" as const, value: "M", reason: null, comment: null };
    expect(answeredCount([{ id: "1" }, { id: "2" }, { id: "3" }], { "1": done, "2": { ...done, kind: "disagree", reason: null }, "9": done })).toBe(1);
  });
  it("reads a cookie, and takes JSON only, within 16 KB", async () => {
    const req = (cookie: string) => new Request("http://x.example/", { headers: { cookie } });
    expect(cookieValue(req("a=1; smesay-device=ab%20c; b=2"), "smesay-device")).toBe("ab c");
    expect(cookieValue(req("smesay-device=%E0%A4%A"), "smesay-device")).toBeUndefined();
    expect(cookieValue(req("a=1"), "smesay-device")).toBeUndefined();
    expect([isJsonType("application/json; charset=utf-8"), isJsonType("Application/JSON"), isJsonType("text/plain; x=application/json"), isJsonType(null)]).toEqual([true, true, false, false]);
    const post = (body: string, type = "application/json") => new Request("http://x.example/", { method: "POST", body, headers: { "content-type": type } });
    expect(await readJson(post('{"a":1}'))).toEqual({ body: { a: 1 } });
    expect(await readJson(post('{"a":1}', "text/plain; x=application/json"))).toEqual({ status: 415 });
    expect(await readJson(post("{"))).toEqual({ status: 400 });
    expect(await readJson(post(JSON.stringify({ a: "x".repeat(JSON_BODY_MAX) })))).toEqual({ status: 413 });
  });
});

describe("chaptersFor", () => {
  const it_ = (id: string, area: string | null, perspectives: string[] = []): RespondentItem => ({ id, reference: null, title: id, details: null, area, proposed: null, perspectives });
  it("orders the areas, puts loose items last as Other items, drops a chapter the picks empty", () => {
    const list = [it_("1", "Paying"), it_("2", "Submitting"), it_("3", null), it_("4", "Approving", ["Finance"])];
    const areas = [{ name: "Submitting", intro: "How a claim gets in." }, { name: "Approving", intro: null }, { name: "Paying", intro: null }];
    expect(chaptersFor(areas, list, []).map((c) => [c.name, c.intro, c.items.map((i) => i.id)])).toEqual([["Submitting", "How a claim gets in.", ["2"]], ["Paying", null, ["1"]], [RESPONDENT_COPY.otherItems, null, ["3"]]]);
    expect(chaptersFor(areas, list, ["Finance"]).map((c) => c.name)).toEqual(["Submitting", "Approving", "Paying", RESPONDENT_COPY.otherItems]);
    expect(chaptersFor([], [it_("1", null), it_("2", null)], [])).toEqual([{ name: null, intro: null, items: [it_("1", null), it_("2", null)] }]);
    expect(chaptersFor([], [it_("1", null, ["Finance"])], [])).toEqual([]);
  });
});

async function publishedProject(name: string, opts: { passcode?: string; blind?: boolean; closes?: string } = {}) {
  const project = await projects.create(a.ws, { name, createdBy: a.userId });
  const pasted = await savePaste({ ws: a.ws, userId: a.userId }, project.id, ["One | Submitting | Must", "Two | Paying | Should", "Three | Paying | Could"].join("\n"));
  if (!("upload" in pasted)) throw new Error(pasted.error);
  await commitUpload(a.ws, pasted.upload.id, a.userId);
  const { instrument } = (await openDraft(a.ws, project))!;
  const fields = await saveFields(a.ws, project.id, instrument.id, JSON.stringify([{ label: "Name", type: "text", mandatory: true }, { label: "Role", type: "dropdown", mandatory: true, options: "Sales\nFinance" }]));
  if (!("instrument" in fields)) throw new Error(fields.error);
  await savePerspectives(a.ws, project.id, instrument.id, "Finance");
  if (opts.blind) {
    const blind = await saveScoring(a.ws, project.id, instrument.id, "moscow", false, null, "chapters");
    if (!("instrument" in blind)) throw new Error(blind.error);
  }
  const rows = await items.forSet(a.ws, instrument.itemSetId);
  await tagItem(a.ws, project.id, rows[2].id, JSON.stringify(["Finance"]));
  const published = await publishLink(a.ws, project.id, instrument.id, "", opts.closes ?? "2027-01-20T15:00:00Z", opts.passcode ?? "", new Date("2026-10-03T12:00:00Z"));
  if (!("invite" in published)) throw new Error(published.error);
  return { project, instrument, link: published.invite };
}

describe("rate-blind", () => {
  it("sends no proposed value to the page when the proposal is hidden", async () => {
    const now = new Date("2026-10-05T12:00:00Z");
    const shown = await loadRespondent((await publishedProject("Shown")).link.token, {}, now);
    expect(shown.kind === "ready" ? shown.items.map((it) => it.proposed) : null).toEqual(["M", "S", "C"]);
    const blind = await loadRespondent((await publishedProject("Blind", { blind: true })).link.token, {}, now);
    expect(blind.kind === "ready" ? blind.items.map((it) => it.proposed) : null).toEqual([null, null, null]);
  }, 60_000);
});

describe("Start", () => {
  const now = new Date("2026-10-05T12:00:00Z");
  it("on a public link: one response per device, the device token in the cookie, a second Start updates it", async () => {
    const { project, link } = await publishedProject("Public start");
    const before = await loadRespondent(link.token, {}, now);
    expect(before.kind).toBe("ready");
    if (before.kind !== "ready") throw new Error();
    expect(before.response).toBeNull();
    expect(chaptersFor(before.areas, before.items, []).map((c) => [c.name, c.items.length])).toEqual([["Submitting", 1], ["Paying", 1]]);
    expect(await startResponse(link.token, {}, { fields: { name: "Ana" }, perspectives: [] }, now)).toEqual({ status: 422, error: "Fill in your name and role to start." });
    const first = await startResponse(link.token, {}, { fields: { name: "Ana", role: "Sales", hidden: "x" }, perspectives: ["Finance"] }, now);
    if ("status" in first) throw new Error(first.error);
    expect(first.device).toMatch(/^[0-9a-f]{32}$/);
    expect([first.response.fields, first.response.perspectives, first.response.inviteId, first.response.workspaceId]).toEqual([{ name: "Ana", role: "Sales" }, ["Finance"], link.id, a.ws]);
    const again = await startResponse(link.token, { device: first.device! }, { fields: { name: "Ana B", role: "Finance" }, perspectives: [] }, now);
    if ("status" in again) throw new Error(again.error);
    expect([again.device, again.response.id, again.response.fields]).toEqual([null, first.response.id, { name: "Ana B", role: "Finance" }]);
    const after = await loadRespondent(link.token, { device: first.device! }, now);
    expect(after.kind === "ready" ? after.response?.id : null).toBe(first.response.id);
    // Another device starts its own response; another link's cookie finds nothing.
    const other = await startResponse(link.token, {}, { fields: { name: "Bo", role: "Sales" } }, now);
    if ("status" in other) throw new Error(other.error);
    expect(other.response.id).not.toBe(first.response.id);
    const { link: link2 } = await publishedProject("Other public");
    const cross = await loadRespondent(link2.token, { device: first.device! }, now);
    expect(cross.kind === "ready" ? cross.response : "x").toBeNull();
    // The route: JSON only, the cookie on the link's path, httpOnly.
    const bad = await startRoute(new Request(`${BASE}/r/${link.token}/start`, { method: "POST", body: "fields=1", headers: { "content-type": "application/x-www-form-urlencoded" } }), { params: Promise.resolve({ token: link.token }) });
    expect(bad.status).toBe(415);
    const ok = await startRoute(new Request(`${BASE}/r/${link.token}/start`, { method: "POST", body: JSON.stringify({ fields: { name: "Cy", role: "Sales" } }), headers: { "content-type": "application/json" } }), { params: Promise.resolve({ token: link.token }) });
    expect(ok.status).toBe(200);
    // The reply names the response, which ties this device's queue to it (E7-3).
    const started = (await ok.json()) as { ok: boolean; response: string; submittedAt: string | null; changedSince: boolean };
    expect([started.ok, started.submittedAt, started.changedSince]).toEqual([true, null, false]);
    expect(started.response).toMatch(/^[0-9a-f-]{36}$/);
    const cookie = ok.headers.getSetCookie().find((c) => c.startsWith(`${DEVICE_COOKIE}=`))!;
    expect(cookie).toMatch(new RegExp(`^${DEVICE_COOKIE}=[0-9a-f]{32};`));
    expect(cookie).toContain(`Path=/r/${link.token}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    void project;
  }, 60_000);

  it("on a personal link: one response even when two Starts race, the carried name and role stored", async () => {
    const { project, instrument } = await publishedProject("Personal start");
    const sent: Mail[] = [];
    const result = await sendInvites(a.ws, project.id, instrument.id, "ana@x.example, Ana Pop, Finance", { name: "Dana", email: "dana@x.example" }, BASE, new Date("2026-10-03T12:00:00Z"), async (m) => { sent.push(m); });
    if (!("outcomes" in result)) throw new Error(result.error);
    const [ana] = await listInvitees(a.ws, instrument.id);
    const both = await Promise.all([
      startResponse(ana.token, {}, { fields: { name: "Someone", role: "Sales" } }, now),
      startResponse(ana.token, {}, { fields: {} }, now),
    ]);
    const ids = both.map((r) => ("response" in r ? r.response.id : null));
    expect(ids[0]).not.toBeNull();
    expect(ids[0]).toBe(ids[1]);
    expect(both.every((r) => "response" in r && r.device === null)).toBe(true);
    const stored = await responses.forInvite(a.ws, ana.id);
    expect(stored?.fields).toEqual({ name: "Ana Pop", role: "Finance" });
    const view = await loadRespondent(ana.token, {}, now);
    expect(view.kind === "ready" ? view.response?.id : null).toBe(ids[0]);
    // Another workspace cannot start, read or change this invite's response.
    const data = { instrumentId: instrument.id, itemSetId: instrument.itemSetId, inviteId: ana.id, deviceToken: "f".repeat(32), fields: {}, perspectives: [] };
    expect(await responses.startPersonal(b.ws, data, () => true)).toBeNull();
    expect(await responses.createPublic(b.ws, { ...data, inviteId: (await invites.livePublic(a.ws, project.id))!.id }, () => true)).toBeNull();
    expect(await responses.update(b.ws, ids[0]!, { fields: { name: "Changed" } })).toBeNull();
    expect(await responses.restart(b.ws, ids[0]!, { fields: { name: "Changed" }, perspectives: [] }, new Date())).toBeNull();
    expect((await responses.forInvite(a.ws, ana.id))?.fields).toEqual({ name: "Ana Pop", role: "Finance" });
  }, 60_000);

  it("re-reads the link under the invite's lock: a Revoke committed after the check wins", async () => {
    const { project, instrument, link } = await publishedProject("Race revoke");
    const revoked = await revokeLink(a.ws, project.id, instrument.id, link.id, now);
    if (!("invite" in revoked)) throw new Error(revoked.error);
    const data = { instrumentId: instrument.id, itemSetId: instrument.itemSetId, inviteId: link.id, deviceToken: "e".repeat(32), fields: {}, perspectives: [] };
    const result = await responses.createPublic(a.ws, data, (d) => linkState(d, now) === "open");
    expect(result && "refused" in result ? linkState(result.refused, now) : null).toBe("revoked");
    expect(await responses.forDevice(a.ws, link.id, "e".repeat(32))).toBeNull();
    // A personal invite renewed under another token: the old token's Start is refused.
    const live = await publishedProject("Race renew");
    const sent = await sendInvites(a.ws, live.project.id, live.instrument.id, "cy@x.example, Cy, Sales", { name: "Dana", email: "dana@x.example" }, BASE, new Date("2026-10-03T12:00:00Z"), async () => {});
    if (!("outcomes" in sent)) throw new Error(sent.error);
    const [cy] = await listInvitees(a.ws, live.instrument.id);
    const personal = await responses.startPersonal(a.ws, { ...data, instrumentId: live.instrument.id, itemSetId: live.instrument.itemSetId, inviteId: cy.id, deviceToken: "d".repeat(32) }, (d) => d.token === "an-old-token");
    expect(personal && "refused" in personal ? personal.refused.token : null).toBe(cy.token);
    expect(await responses.forInvite(a.ws, cy.id)).toBeNull();
  }, 60_000);

  it("writes nothing on a passcode link without the proof, a sample, a not-yet-open, a closed or a revoked link", async () => {
    const { project, instrument, link } = await publishedProject("Guarded", { passcode: "letmein" });
    expect(await startResponse(link.token, {}, { fields: { name: "Ana", role: "Sales" } }, now)).toEqual({ status: 403, error: "passcode" });
    clearAttempts();
    const proof = await checkPasscode(link.token, "letmein", "10.0.0.1", now);
    if (proof.kind !== "ok") throw new Error(proof.kind);
    const opened = await startResponse(link.token, { passcode: proof.proof }, { fields: { name: "Ana", role: "Sales" } }, now);
    expect("response" in opened).toBe(true);
    const moved = await saveLink(a.ws, project.id, instrument.id, link.id, "2026-10-06T00:00:00Z", "2027-01-20T15:00:00Z", "", false, now);
    if (!("invite" in moved)) throw new Error(moved.error);
    expect(await startResponse(link.token, { passcode: proof.proof }, { fields: { name: "Ana", role: "Sales" } }, now)).toEqual({ status: 409, error: "notOpen" });
    expect(await startResponse(link.token, { passcode: proof.proof }, { fields: { name: "Ana", role: "Sales" } }, new Date("2027-02-01T00:00:00Z"))).toEqual({ status: 410, error: "closed" });
    const revoked = await revokeLink(a.ws, project.id, instrument.id, link.id, now);
    if (!("invite" in revoked)) throw new Error(revoked.error);
    expect(await startResponse(link.token, { passcode: proof.proof }, { fields: { name: "Ana", role: "Sales" } }, now)).toEqual({ status: 410, error: "revoked" });
    expect(await startResponse("0".repeat(32), {}, {}, now)).toEqual({ status: 404, error: "unknown" });
    const sample = (await projects.list(a.ws)).find((p) => p.isSample)!;
    const sampleLink = (await invites.livePublic(a.ws, sample.id))!;
    expect((await loadRespondent(sampleLink.token, {}, new Date("2026-10-10T00:00:00Z"))).kind).toBe("sample");
    expect(await startResponse(sampleLink.token, {}, { fields: { name: "Ana", role: "Sales" } }, new Date("2026-10-10T00:00:00Z"))).toEqual({ status: 403, error: "sample" });
  }, 60_000);

  it("shows a closed personal link's own state; a closed public link shows none", async () => {
    const { project, instrument, link } = await publishedProject("Closed own");
    const result = await sendInvites(a.ws, project.id, instrument.id, "bo@x.example, Bo, Sales", { name: "Dana", email: "dana@x.example" }, BASE, new Date("2026-10-03T12:00:00Z"), async () => {});
    if (!("outcomes" in result)) throw new Error(result.error);
    const [bo] = await listInvitees(a.ws, instrument.id);
    const later = new Date("2027-02-01T00:00:00Z");
    expect((await loadRespondent(bo.token, {}, later)).kind).toBe("closed");
    const boStart = await startResponse(bo.token, {}, { fields: {} }, now);
    if ("status" in boStart) throw new Error(boStart.error);
    // Started with nothing answered: the plain closed page.
    expect((await loadRespondent(bo.token, {}, later)).kind).toBe("closed");
    const [first] = (await items.forSet(a.ws, instrument.itemSetId));
    await answers.create(a.ws, { responseId: boStart.response.id, itemSetId: instrument.itemSetId, itemId: first.id, kind: "agree", value: "M", reason: null, comment: null });
    const own = await loadRespondent(bo.token, {}, later);
    expect(own.kind).toBe("closedOwn");
    if (own.kind !== "closedOwn") throw new Error();
    expect([own.answered, own.total]).toEqual([1, 2]);
    // Another workspace reads none of its answers.
    expect(await answers.forResponse(b.ws, boStart.response.id)).toEqual([]);
    // Submitted: the submitted page (E7-6), not the unsubmitted count.
    await responses.update(a.ws, boStart.response.id, { submittedAt: now });
    expect((await loadRespondent(bo.token, {}, later)).kind).toBe("closedSubmitted");
    const pub = await startResponse(link.token, {}, { fields: { name: "Cy", role: "Sales" } }, now);
    if ("status" in pub) throw new Error(pub.error);
    expect((await loadRespondent(link.token, { device: pub.device! }, later)).kind).toBe("closed");
    // Another workspace holds none of these rows.
    expect(await responses.forInvite(b.ws, bo.id)).toBeNull();
    expect(await responses.forDevice(b.ws, link.id, pub.device!)).toBeNull();
  }, 60_000);
});

describe("the answer rules", () => {
  it("maps a pick to the stored answer, keeping the reason only when it is needed and the comment only when it is not", () => {
    const pick = (picked: string, reason: string | null = "why", comment: string | null = "note") => answerFor("moscow", true, "M", { picked, reason, comment });
    expect(pick("M")).toEqual({ answer: { kind: "agree", value: "M", reason: null, comment: "note" } });
    expect(pick("S")).toEqual({ answer: { kind: "change", value: "S", reason: "why", comment: null } });
    expect(pick("W")).toEqual({ answer: { kind: "disagree", value: "W", reason: "why", comment: null } });
    expect(pick("unclear")).toEqual({ answer: { kind: "unclear", value: null, reason: "why", comment: null } });
    expect(answerFor("moscow", false, "M", { picked: "S", reason: "why", comment: "note" })).toEqual({ answer: { kind: "pick", value: "S", reason: null, comment: "note" } });
    expect(answerFor("kcd", true, "K", { picked: "D", reason: null, comment: null })).toEqual({ answer: { kind: "disagree", value: "D", reason: null, comment: null } });
    expect(answerFor("fit", true, "4", { picked: "3", reason: null, comment: null })).toEqual({ answer: { kind: "change", value: "3", reason: null, comment: null } });
    expect(answerFor("moscow", true, "M", { picked: "4", reason: null, comment: null })).toEqual({ error: RESPONDENT_ERRORS.badAnswer });
  });
  it("says exactly what a card is missing, or nothing when it is complete", () => {
    expect(noteFor(null)).toBe("notRated");
    expect(noteFor({ kind: "agree", value: "M", reason: null, comment: null })).toBeNull();
    expect(noteFor({ kind: "pick", value: "S", reason: null, comment: null })).toBeNull();
    expect(noteFor({ kind: "change", value: "S", reason: null, comment: null })).toBe("sayWhy");
    expect(noteFor({ kind: "disagree", value: "W", reason: "  ", comment: null })).toBe("sayWhy");
    expect(noteFor({ kind: "change", value: "S", reason: "Too late", comment: null })).toBeNull();
    expect(noteFor({ kind: "unclear", value: null, reason: null, comment: null })).toBe("writeQuestion");
    expect(noteFor({ kind: "unclear", value: null, reason: "Which team?", comment: null })).toBeNull();
    expect([pickedOf({ kind: "unclear", value: null, reason: null, comment: null }), pickedOf({ kind: "change", value: "S", reason: null, comment: null }), pickedOf(undefined)]).toEqual(["unclear", "S", null]);
  });
  it("reads a card's post: the item, the pick, trimmed texts within 2000 characters, the version, the page and its save number, the response", () => {
    const post = { base: 0, page: "page-0001", seq: 1, after: [], response: "r" };
    expect(parseAnswerInput({ itemId: "i", picked: "M", reason: "  why ", comment: "", ...post })).toEqual({ input: { itemId: "i", picked: "M", reason: "why", comment: null, ...post } });
    expect(parseAnswerInput({ itemId: "i", picked: "M", ...post })).toEqual({ input: { itemId: "i", picked: "M", reason: null, comment: null, ...post } });
    expect(parseAnswerInput({ itemId: "i", ...post })).toEqual({ error: RESPONDENT_ERRORS.badAnswer });
    expect(parseAnswerInput({ itemId: "i", picked: "M", reason: 3, ...post })).toEqual({ error: RESPONDENT_ERRORS.badAnswer });
    expect(parseAnswerInput([])).toEqual({ error: RESPONDENT_ERRORS.badAnswer });
    expect(parseAnswerInput({ itemId: "i", picked: "M", comment: "x".repeat(2001), ...post })).toEqual({ error: RESPONDENT_ERRORS.longText });
    // E7-3: the version and the save number are whole numbers within Postgres integer (the
    // number from 1), the page id 8 to 64 letters, digits or hyphens, and the response named.
    for (const base of [undefined, -1, 0.5, "0", 2_147_483_648]) expect(parseAnswerInput({ itemId: "i", picked: "M", ...post, base })).toEqual({ error: RESPONDENT_ERRORS.badAnswer });
    for (const seq of [undefined, 0, 1.5, "1", 2_147_483_648]) expect(parseAnswerInput({ itemId: "i", picked: "M", ...post, seq })).toEqual({ error: RESPONDENT_ERRORS.badAnswer });
    for (const page of [undefined, "short", "x".repeat(65), "page 0001", 7]) expect(parseAnswerInput({ itemId: "i", picked: "M", ...post, page })).toEqual({ error: RESPONDENT_ERRORS.badAnswer });
    expect(parseAnswerInput({ itemId: "i", picked: "M", ...post, response: undefined })).toEqual({ error: RESPONDENT_ERRORS.badAnswer });
    // The saves the change was made on top of: absent is none; at most 8 well-formed.
    expect(parseAnswerInput({ itemId: "i", picked: "M", base: 0, page: "page-0001", seq: 1, response: "r" })).toEqual({ input: { itemId: "i", picked: "M", reason: null, comment: null, ...post } });
    expect(parseAnswerInput({ itemId: "i", picked: "M", ...post, after: [{ page: "page-0000", seq: 5 }] })).toMatchObject({ input: { after: [{ page: "page-0000", seq: 5 }] } });
    for (const after of [{}, [{ page: "x", seq: 1 }], [{ page: "page-0000", seq: 0 }], Array.from({ length: 9 }, () => ({ page: "page-0000", seq: 1 }))]) expect(parseAnswerInput({ itemId: "i", picked: "M", ...post, after })).toEqual({ error: RESPONDENT_ERRORS.badAnswer });
  });
  it("counts the chapter row from the server and lists what is still to finish (E7-4)", () => {
    const it_ = (id: string, reference: string | null = null): RespondentItem => ({ id, reference, title: `Item ${id}`, details: null, area: null, proposed: null, perspectives: [] });
    const chapters = [{ name: "A", intro: null, items: [it_("1", "R-1"), it_("2")] }, { name: "B", intro: null, items: [it_("3"), it_("4")] }];
    const done = { "1": true, "3": true, "4": false };
    expect(progressOf(chapters, done)).toEqual([{ done: 1, count: 2 }, { done: 1, count: 2 }]);
    const cards: Record<string, { kind: "change" | "agree"; value: string; reason: null; comment: null }> = { "4": { kind: "change", value: "S", reason: null, comment: null }, "2": { kind: "agree", value: "M", reason: null, comment: null } };
    expect(gapsOf(chapters, done, (id) => cards[id] ?? null)).toEqual([
      { itemId: "2", reference: null, title: "Item 2", chapter: 0, note: "notSaved" },
      { itemId: "4", reference: null, title: "Item 4", chapter: 1, note: "sayWhy" },
    ]);
    expect(gapsOf(chapters, {}, () => null).map((g) => g.note)).toEqual(["notRated", "notRated", "notRated", "notRated"]);
    expect([parseScreen("wrap", true, 2), parseScreen("wrap", false, 2), screenParam({ kind: "wrap" })]).toEqual([{ kind: "wrap" }, { kind: "about" }, "wrap"]);
  });
  it("lands a returning respondent on the first unfinished chapter and item", () => {
    const it_ = (id: string): RespondentItem => ({ id, reference: null, title: id, details: null, area: null, proposed: null, perspectives: [] });
    const chapters = [{ name: "A", intro: null, items: [it_("1"), it_("2")] }, { name: "B", intro: null, items: [it_("3"), it_("4")] }];
    const done = { kind: "agree" as const, value: "M", reason: null, comment: null };
    expect(resumeAt(chapters, {})).toEqual({ index: 0, item: 0 });
    expect(resumeAt(chapters, { "1": done, "2": done, "3": done })).toEqual({ index: 1, item: 1 });
    expect(resumeAt(chapters, { "1": done, "2": { ...done, kind: "change", value: "S" } })).toEqual({ index: 0, item: 1 });
    expect(resumeAt(chapters, { "1": done, "2": done, "3": done, "4": done })).toEqual({ index: 1, item: 0 });
    expect(resumeAt([], {})).toEqual({ index: 0, item: 0 });
    // landingOf (E7-4, acceptance 4): the screen, the item and Welcome back.
    const half = { "1": done, "2": { ...done, kind: "change" as const, value: "S" } };
    expect(landingOf(chapters, half, "item", undefined, true)).toEqual({ screen: { kind: "chapter", index: 0 }, item: 1, welcome: { answered: 1, total: 4 } });
    expect(landingOf(chapters, half, "chapters", undefined, true)).toEqual({ screen: { kind: "chapter", index: 0 }, item: 0, welcome: { answered: 1, total: 4 } });
    expect(landingOf(chapters, half, "page", undefined, true)).toEqual({ screen: { kind: "chapter", index: 0 }, item: 0, welcome: { answered: 1, total: 4 } });
    // Everything complete: the Wrap up, with Welcome back.
    expect(landingOf(chapters, { "1": done, "2": done, "3": done, "4": done }, "chapters", undefined, true)).toEqual({ screen: { kind: "wrap" }, item: 0, welcome: { answered: 4, total: 4 } });
    // Only incomplete answers still say Welcome back, with 0 answered; none at all, no Welcome back.
    expect(landingOf(chapters, { "1": { ...done, kind: "unclear" as const, value: null } }, "chapters", undefined, true).welcome).toEqual({ answered: 0, total: 4 });
    expect(landingOf(chapters, {}, "chapters", undefined, true).welcome).toBeNull();
    // A screen in the address is taken as it is; not started is About you.
    expect(landingOf(chapters, half, "chapters", "2", true)).toEqual({ screen: { kind: "chapter", index: 1 }, item: 0, welcome: null });
    expect(landingOf(chapters, half, "chapters", undefined, false)).toEqual({ screen: { kind: "about" }, item: 0, welcome: null });
  });
  it("counts the single page as one screen", () => {
    expect([screenCount("page", 3), screenCount("page", 0), screenCount("chapters", 3), screenCount("item", 2)]).toEqual([1, 0, 3, 2]);
    expect(parseScreen("2", true, screenCount("page", 3))).toEqual({ kind: "chapter", index: 0 });
  });
});

describe("saving an answer", () => {
  const now = new Date("2026-10-05T12:00:00Z");
  it("stores one answer per item that the last save replaces, and refuses what it must", async () => {
    // The route calls below run on the real clock, so this link closes far ahead.
    const { project, instrument, link } = await publishedProject("Answers", { closes: "2099-01-20T15:00:00Z" });
    const rows = await items.forSet(a.ws, instrument.itemSetId);
    const [one, two, three] = rows;
    // E7-3: every save names the version it was made on, the page that sends it and that
    // page's number for it. P is this window, Q another window or device.
    const P = "page-p-0001";
    const Q = "page-q-0002";
    const w = (base: number, seq: number, page = P, after: { page: string; seq: number }[] = []) => ({ base, page, seq, after });
    // Not started on this device: nothing stored.
    expect(await saveAnswer(link.token, {}, { itemId: one.id, picked: "M", ...w(0, 1), response: "00000000-0000-4000-8000-000000000000" }, now)).toEqual({ status: 409, error: RESPONDENT_ERRORS.notStarted });
    const started = await startResponse(link.token, {}, { fields: { name: "Ana", role: "Sales" }, perspectives: [] }, now);
    if ("status" in started) throw new Error(started.error);
    const device = { device: started.device! };
    const rid = started.response.id;
    // Change without a reason is stored and not complete; with the reason it is. Each write
    // counts the version up and names its page and number.
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "S", reason: "", comment: "dropped", ...w(0, 1), response: rid }, now)).toEqual({ answer: { kind: "change", value: "S", reason: null, comment: null }, complete: false, version: 1, writer: P, writerSeq: 1, changedSince: false, submittedAt: null });
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "S", reason: "Not this quarter", ...w(1, 2), response: rid }, now)).toEqual({ answer: { kind: "change", value: "S", reason: "Not this quarter", comment: null }, complete: true, version: 2, writer: P, writerSeq: 2, changedSince: false, submittedAt: null });
    expect(await saveAnswer(link.token, device, { itemId: two.id, picked: "unclear", ...w(0, 3), response: rid }, now)).toEqual({ answer: { kind: "unclear", value: null, reason: null, comment: null }, complete: false, version: 1, writer: P, writerSeq: 3, changedSince: false, submittedAt: null });
    // A later save of the same page lands even on an older version (its earlier save's reply
    // was lost, a timeout); an earlier one of the same page does not (a late request).
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "S", reason: "Not this year", ...w(1, 4), response: rid }, now)).toMatchObject({ complete: true, version: 3, writer: P, writerSeq: 4 });
    const storedOne = { answer: { kind: "change", value: "S", reason: "Not this year", comment: null }, complete: true, version: 3, writer: P, writerSeq: 4, changedSince: false, submittedAt: null };
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "M", ...w(2, 4), response: rid }, now)).toEqual({ stale: storedOne });
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "M", ...w(1, 3), response: rid }, now)).toEqual({ stale: storedOne });
    // Another page lands only on the version it was made on: a save made on an older one
    // (another window, a device's old queue) changes nothing and gets the stored answer back.
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "M", ...w(2, 9, Q), response: rid }, now)).toEqual({ stale: storedOne });
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "S", reason: "Not this year", ...w(3, 1, Q), response: rid }, now)).toMatchObject({ version: 4, writer: Q, writerSeq: 1 });
    // After the other page's write, this page's next number on the old version is stale too.
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "M", ...w(3, 5), response: rid }, now)).toMatchObject({ stale: { version: 4, writer: Q, writerSeq: 1 } });
    // A change made on top of another page's save the server had not answered for (a change
    // the device kept, restored and edited) names it: it lands when the stored answer is that
    // save or an earlier one of that page, and not after a later one or another page's.
    const R = "page-r-0003";
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "S", reason: "Not this year", ...w(1, 1, R, [{ page: Q, seq: 1 }]), response: rid }, now)).toMatchObject({ version: 5, writer: R, writerSeq: 1 });
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "M", ...w(1, 1, P, [{ page: Q, seq: 9 }, { page: "page-z-0009", seq: 2 }]), response: rid }, now)).toMatchObject({ stale: { version: 5, writer: R } });
    // The bound: a change naming R's first save does not reach over R's second (R is a tab
    // still open that changed the answer again).
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "S", reason: "Not this year", ...w(5, 2, R), response: rid }, now)).toMatchObject({ version: 6, writer: R, writerSeq: 2 });
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "M", ...w(1, 1, P, [{ page: R, seq: 1 }]), response: rid }, now)).toMatchObject({ stale: { version: 6, writer: R, writerSeq: 2 } });
    // A version, a number or a page id out of range is refused; a response that is not this
    // device's (an open window whose cookie was replaced) is "not started".
    for (const bad of [{ base: -1 }, { base: 0.5 }, { seq: 0 }, { seq: "2" }, { page: "x" }, { base: undefined }]) expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "M", ...w(4, 6), ...bad, response: rid }, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.badAnswer });
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "M", ...w(4, 6), response: "00000000-0000-4000-8000-000000000000" }, now)).toEqual({ status: 409, error: RESPONDENT_ERRORS.notStarted });
    const stored = await answers.forResponse(a.ws, started.response.id);
    expect(stored.map((r) => [r.itemId, r.kind, r.value, r.reason]).sort()).toEqual([[one.id, "change", "S", "Not this year"], [two.id, "unclear", null, null]].sort());
    // The reminder's count (E6-3) takes complete answers only: the Unclear with no question is not one.
    expect(await answers.countForResponse(a.ws, started.response.id)).toBe(1);
    const view = await loadRespondent(link.token, device, now);
    expect(view.kind === "ready" ? [view.answers[one.id], view.versions] : null).toEqual([{ kind: "change", value: "S", reason: "Not this year", comment: null }, { [one.id]: 6, [two.id]: 1 }]);
    // The item tagged Finance is not in a list without that perspective; another set's item is not either.
    expect(await saveAnswer(link.token, device, { itemId: three.id, picked: "C", ...w(0, 7), response: rid }, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.hiddenItem });
    const { instrument: other } = await publishedProject("Answers other");
    const otherItem = (await items.forSet(a.ws, other.itemSetId))[0];
    expect(await saveAnswer(link.token, device, { itemId: otherItem.id, picked: "M", ...w(0, 7), response: rid }, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.hiddenItem });
    expect(await saveAnswer(link.token, device, { itemId: "not-a-uuid", picked: "M", ...w(0, 7), response: rid }, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.hiddenItem });
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "5", ...w(4, 7), response: rid }, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.badAnswer });
    // After Start with Finance, the tagged item is in the list.
    await startResponse(link.token, device, { fields: { name: "Ana", role: "Sales" }, perspectives: ["Finance"] }, now);
    expect(await saveAnswer(link.token, device, { itemId: three.id, picked: "C", comment: "fine", ...w(0, 8), response: rid }, now)).toEqual({ answer: { kind: "agree", value: "C", reason: null, comment: "fine" }, complete: true, version: 1, writer: P, writerSeq: 8, changedSince: false, submittedAt: null });
    // The route: JSON only, the device cookie read from the request.
    const put = (body: string, type = "application/json", cookie = `${DEVICE_COOKIE}=${started.device}`) => answersRoute(new Request(`${BASE}/r/${link.token}/answers`, { method: "PUT", body, headers: { "content-type": type, cookie } }), { params: Promise.resolve({ token: link.token }) });
    expect((await put("itemId=1", "application/x-www-form-urlencoded")).status).toBe(415);
    expect((await put("{")).status).toBe(400);
    const ok = await put(JSON.stringify({ itemId: two.id, picked: "unclear", reason: "Which team pays?", ...w(1, 9), response: rid }));
    expect([ok.status, await ok.json()]).toEqual([200, { saved: true, kind: "unclear", complete: true, version: 2, writer: P, writerSeq: 9, changedSince: false, submittedAt: null }]);
    // The same save again (a duplicate after a timeout): 409 stale with the stored answer and who wrote it.
    const late = await put(JSON.stringify({ itemId: two.id, picked: "M", ...w(1, 9), response: rid }));
    expect([late.status, await late.json()]).toEqual([409, { error: "stale", answer: { kind: "unclear", value: null, reason: "Which team pays?", comment: null }, complete: true, version: 2, writer: P, writerSeq: 9, changedSince: false, submittedAt: null }]);
    const noCookie = await put(JSON.stringify({ itemId: two.id, picked: "M", ...w(2, 10), response: rid }), "application/json", "");
    expect(noCookie.status).toBe(409);
    expect((await answers.forResponse(a.ws, started.response.id)).length).toBe(3);
    // Under the invite's lock: a link that changed since the check wins, and nothing is written.
    const data = { responseId: started.response.id, itemSetId: started.response.itemSetId, itemId: three.id, kind: "agree" as const, value: "C", reason: null, comment: "fine" };
    const refused = await answers.upsert(a.ws, link.id, { ...data, kind: "pick", value: "M", comment: null, ...w(1, 11) }, () => false, now);
    expect(refused && "refused" in refused ? refused.refused.token : null).toBe(link.token);
    expect((await answers.forResponse(a.ws, started.response.id)).find((r) => r.itemId === three.id)?.kind).toBe("agree");
    expect(await answers.upsert(b.ws, link.id, { ...data, kind: "pick", value: "M", comment: null, ...w(1, 11) }, () => true, now)).toBeNull();
    // The response's last save never moves back: a write stamped earlier than the last one
    // (a request that waited for the response row's lock) leaves it as it was.
    const later = new Date(now.getTime() + 60_000);
    await answers.upsert(a.ws, link.id, { ...data, comment: "fine, later", ...w(1, 12) }, () => true, later);
    await answers.upsert(a.ws, link.id, { ...data, comment: "fine again", ...w(2, 13) }, () => true, now);
    expect((await answers.forResponse(a.ws, started.response.id)).find((r) => r.itemId === three.id)?.version).toBe(3);
    expect((await responses.get(a.ws, started.response.id))?.updatedAt.toISOString()).toBe(later.toISOString());
    // Another workspace reads none of it; a revoked link takes nothing more.
    expect(await answers.forResponse(b.ws, started.response.id)).toEqual([]);
    const revoked = await revokeLink(a.ws, project.id, instrument.id, link.id, now);
    if (!("invite" in revoked)) throw new Error(revoked.error);
    expect(await saveAnswer(link.token, device, { itemId: one.id, picked: "M", ...w(4, 14), response: rid }, now)).toEqual({ status: 410, error: "revoked" });
    // The autosave route after the revocation (E7-3, acceptance 7, owed from E6-4): 410, nothing written.
    const afterRevoke = await put(JSON.stringify({ itemId: two.id, picked: "M", ...w(2, 15), response: rid }));
    expect([afterRevoke.status, await afterRevoke.json()]).toEqual([410, { error: "revoked" }]);
    expect((await answers.forResponse(a.ws, started.response.id)).find((r) => r.itemId === two.id)?.kind).toBe("unclear");
    expect((await answers.forResponse(a.ws, started.response.id)).find((r) => r.itemId === one.id)?.kind).toBe("change");
  }, 60_000);
});
