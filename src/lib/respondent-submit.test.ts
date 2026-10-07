// Submit (stories/E7-5) on the test database: the Wrap up's buckets, its areas, the submit
// input and the version rule (the device queue: src/lib/wrap-queue.test.ts); then Submit
// refused while an item is open (checked under the response's lock, with the perspectives as
// locked), without confidence or the sign-off, or with a missing item outside the areas;
// stored with the sign-off sentence, the closing answer, the missing item and the first and
// latest times, and read back for the next visit; a second Submit updating the same response;
// the Wrap up saved as it is written, an old change kept on a device never replacing a newer
// one, a save that changes nothing moving nothing, the missing item keeping its id; the
// receipt only to a personal invite, on its first Submit, never to an address typed on a
// public link; a revoked link and another workspace writing nothing; both routes taking JSON
// only. The migration's backfill of the first Submit: src/db/queries/usage.test.ts. After
// Submit (stories/E7-6): the summary line, the welcome back, the "changed after submitting"
// mark, a closed personal link's submitted page.
import { beforeAll, describe, expect, it } from "vitest";
import { invites, items, missingItems, projects, responses } from "@/db/queries";
import { events } from "@/db/queries/events";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { ReasonRule, WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { DEFAULT_SIGN_OFF } from "@/lib/closing";
import { commitUpload } from "@/lib/imports";
import { openDraft, saveClosing, saveFields, savePerspectives, saveScoring } from "@/lib/instruments";
import { listInvitees, sendInvites } from "@/lib/invitees";
import { memoryOutbox, type Mail } from "@/lib/mail";
import { receiptEmail } from "@/lib/mail/templates/receipt";
import { DEVICE_COOKIE, loadRespondent, saveAnswer, saveWrap, startResponse, submitResponse, type RespondentCookies } from "@/lib/respondent";
import { bucketOf, changedAfterSubmit, changedSinceSubmit, heardSubmit, landingOf, NO_SUBMIT, showsChanged, startSubmit, parseScreen, parseSubmitInput, parseWrapInput, RESPONDENT_COPY, RESPONDENT_ERRORS, tallyOf, wrapTakes} from "@/lib/respondent-rules";
import { publishLink, revokeLink } from "@/lib/sharing";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";
import { PUT as answersRoute } from "@/app/r/[token]/answers/route";
import { POST as startRoute } from "@/app/r/[token]/start/route";
import { POST as submitRoute } from "@/app/r/[token]/submit/route";
import { PUT as wrapRoute } from "@/app/r/[token]/wrap/route";

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
  const signedIn = await signIn(`submit-${stamp}@example.com`);
  const wsA = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Submit A", slug: `submit-a-${stamp}` }, signedIn.id)).id);
  const wsB = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Submit B", slug: `submit-b-${stamp}` }, signedIn.id)).id);
  a = { ws: wsA, userId: signedIn.id }; b = { ws: wsB, userId: signedIn.id };
}, 60_000);

const now = new Date("2026-10-05T12:00:00Z");

// One save per call, each with the next number of one test page: the server's rule takes them
// whatever the version (E7-3).
let seq = 0;
const PAGE = "page-submit-0001";
const save = (token: string, cookies: RespondentCookies, response: string, body: { itemId: string; picked: string; reason?: string; comment?: string }, at = now) => saveAnswer(token, cookies, { ...body, base: 0, page: PAGE, seq: ++seq, response }, at);
// The Wrap up's writes of one test page, numbered the same way (src/lib/respondent-rules.ts
// wrapTakes): `v()` gives the next write's version fields.
let wseq = 0;
const WPAGE = "page-wrap-0001";
const v = (base = 0) => ({ base, page: WPAGE, seq: ++wseq, after: [] as { page: string; seq: number }[] });

type ProjectOptions = { question?: string; emailField?: boolean; perspectives?: string; reasonRule?: ReasonRule };
async function publishedProject(name: string, options: ProjectOptions = {}) {
  return publishedProjectIn(a, name, options);
}
async function publishedProjectIn(w: { ws: WorkspaceId; userId: string }, name: string, options: ProjectOptions = {}) {
  const project = await projects.create(w.ws, { name, createdBy: w.userId });
  const pasted = await savePaste({ ws: w.ws, userId: w.userId }, project.id, ["One | Submitting | Must", "Two | Paying | Should"].join("\n"));
  if (!("upload" in pasted)) throw new Error(pasted.error);
  await commitUpload(w.ws, pasted.upload.id, w.userId);
  const { instrument } = (await openDraft(w.ws, project))!;
  const fields = await saveFields(w.ws, project.id, instrument.id, JSON.stringify([{ label: "Name", type: "text", mandatory: true }, ...(options.emailField ? [{ label: "Email", type: "email", mandatory: false }] : [])]));
  if (!("instrument" in fields)) throw new Error(fields.error);
  if (options.perspectives) {
    const saved = await savePerspectives(w.ws, project.id, instrument.id, options.perspectives);
    if (!("instrument" in saved)) throw new Error(saved.error);
  }
  if (options.question) {
    const closing = await saveClosing(w.ws, project.id, instrument.id, options.question, "1", DEFAULT_SIGN_OFF, "1");
    if (!("instrument" in closing)) throw new Error(closing.error);
  }
  if (options.reasonRule) {
    const ruled = await saveScoring(w.ws, project.id, instrument.id, "moscow", true, null, "chapters", options.reasonRule);
    if (!("instrument" in ruled)) throw new Error(ruled.error);
  }
  const published = await publishLink(w.ws, project.id, instrument.id, "", "2027-01-20T15:00:00Z", "", new Date("2026-10-03T12:00:00Z"));
  if (!("invite" in published)) throw new Error(published.error);
  const [one, two] = await items.forSet(w.ws, instrument.itemSetId);
  return { project, instrument, link: published.invite, one, two };
}

describe("the Wrap up's rules", () => {
  it("puts each answer in its bucket", () => {
    const at = (kind: "agree" | "change" | "disagree" | "unclear" | "pick", value: string | null) => ({ kind, value, reason: "why", comment: null });
    expect(bucketOf("moscow", "S", at("agree", "S"))).toBe("agreed");
    expect(bucketOf("moscow", "S", at("change", "M"))).toBe("higher");
    expect(bucketOf("moscow", "S", at("change", "C"))).toBe("lower");
    expect(bucketOf("moscow", "S", at("disagree", "W"))).toBe("notNeeded");
    expect(bucketOf("moscow", "S", at("unclear", null))).toBe("unclear");
    expect(bucketOf("moscow", null, at("pick", "W"))).toBe("notNeeded");
    expect(bucketOf("moscow", null, at("pick", "M"))).toBe("rated");
    expect(bucketOf("fit", "3", at("change", "5"))).toBe("higher");
    expect(bucketOf("kcd", "K", at("change", "C"))).toBe("lower");
    const tally = tallyOf("moscow", [{ id: "1", proposed: "S" }, { id: "2", proposed: "S" }, { id: "3", proposed: "M" }], { "1": at("change", "M"), "2": { kind: "change", value: "C", reason: null, comment: null }, "3": at("agree", "M") }, "differs");
    expect([tally.higher, tally.lower, tally.agreed]).toEqual([["1"], [], ["3"]]);
  });
  it("reads the Wrap up as Submit posts it", () => {
    const ctx = { method: "moscow" as const, hasQuestion: true, missingForm: true };
    const V = { base: 2, page: "page-wrap-0001", seq: 3 };
    const out = { base: 2, page: "page-wrap-0001", seq: 3, after: [] };
    expect(parseSubmitInput({ response: "r", ...V, confidence: 4, signedOff: true, closingAnswer: " Fine ", missing: { text: " Mileage\nFuel cards " } }, ctx)).toEqual({ input: { response: "r", confidence: 4, closingAnswer: "Fine", missing: { text: "Mileage\nFuel cards" }, ...out } });
    expect(parseSubmitInput({ response: "r", ...V, confidence: 4, signedOff: true, closingAnswer: "x", missing: { text: "" } }, { ...ctx, hasQuestion: false })).toEqual({ input: { response: "r", confidence: 4, closingAnswer: null, missing: null, ...out } });
    expect(parseSubmitInput({ response: "r", ...V, confidence: 4, signedOff: false }, ctx)).toEqual({ error: RESPONDENT_ERRORS.signOff });
    expect(parseSubmitInput({ response: "r", ...V, confidence: 0, signedOff: true }, ctx)).toEqual({ error: RESPONDENT_ERRORS.confidence });
    expect(parseSubmitInput({ response: "r", ...V, signedOff: true }, ctx)).toEqual({ error: RESPONDENT_ERRORS.confidence });
    expect(parseSubmitInput({ response: "r", ...V, confidence: 3, signedOff: true, missing: "x" }, ctx)).toEqual({ error: RESPONDENT_ERRORS.badMissing });
    expect(parseSubmitInput({ response: "r", ...V, confidence: 3, signedOff: true, missing: { text: "x".repeat(2001) } }, ctx)).toEqual({ error: RESPONDENT_ERRORS.missingTooLong });
    expect(parseSubmitInput({ response: "r", ...V, confidence: 3, signedOff: true, closingAnswer: "x".repeat(2001) }, ctx)).toEqual({ error: RESPONDENT_ERRORS.closingTooLong });
    expect(parseSubmitInput("nope", ctx)).toEqual({ error: RESPONDENT_ERRORS.badShape });
    // The response the page answers for is named, and the write's version, page and number.
    expect(parseSubmitInput({ ...V, confidence: 3, signedOff: true }, ctx)).toEqual({ error: RESPONDENT_ERRORS.badShape });
    expect(parseSubmitInput({ response: "r", confidence: 3, signedOff: true }, ctx)).toEqual({ error: RESPONDENT_ERRORS.badShape });
    expect(parseWrapInput({ response: "r", ...V, seq: 0 }, ctx)).toEqual({ error: RESPONDENT_ERRORS.badShape });
    expect(parseWrapInput({ response: "r", ...V, page: "x" }, ctx)).toEqual({ error: RESPONDENT_ERRORS.badShape });
    expect(parseWrapInput({ response: "r", ...V, after: [{ page: "x", seq: 1 }] }, ctx)).toEqual({ error: RESPONDENT_ERRORS.badShape });
    expect(parseWrapInput({ response: "r", ...V, after: [{ page: "page-old-0000", seq: 4 }] }, ctx)).toMatchObject({ input: { after: [{ page: "page-old-0000", seq: 4 }] } });
    // The sign-off sentence the page showed must still be the PM's.
    expect(parseSubmitInput({ response: "r", ...V, confidence: 3, signedOff: true, signOffText: "Old text." }, { ...ctx, signOff: "New text." })).toEqual({ error: RESPONDENT_ERRORS.signOffChanged });
    expect(parseSubmitInput({ response: "r", ...V, confidence: 3, signedOff: true, signOffText: "New text." }, { ...ctx, signOff: "New text." })).toMatchObject({ input: { response: "r", confidence: 3 } });
    // The form switched off: a missing item sent anyway is dropped.
    expect(parseSubmitInput({ response: "r", ...V, confidence: 3, signedOff: true, missing: { text: "x" } }, { ...ctx, missingForm: false })).toEqual({ input: { response: "r", confidence: 3, closingAnswer: null, missing: null, ...out } });
  });
  it("takes a Wrap up write made on the stored one, or on top of the last writer's save", () => {
    const P = "page-wrap-0001";
    const Q = "page-wrap-0002";
    const stored = { version: 5, writer: P, writerSeq: 4 };
    expect(wrapTakes(stored, { base: 5, page: Q, seq: 1, after: [] })).toBe(true);
    expect(wrapTakes(stored, { base: 3, page: P, seq: 5, after: [] })).toBe(true);
    // A late copy of the same page's earlier write, another page's write on an old version.
    expect(wrapTakes(stored, { base: 3, page: P, seq: 4, after: [] })).toBe(false);
    expect(wrapTakes(stored, { base: 3, page: Q, seq: 9, after: [] })).toBe(false);
    // Made on top of that save of P, or a later one (a change kept from an earlier visit).
    expect(wrapTakes(stored, { base: 3, page: Q, seq: 1, after: [{ page: P, seq: 4 }] })).toBe(true);
    expect(wrapTakes(stored, { base: 3, page: Q, seq: 1, after: [{ page: P, seq: 3 }] })).toBe(false);
    expect(wrapTakes({ version: 0, writer: null, writerSeq: 0 }, { base: 0, page: Q, seq: 1, after: [] })).toBe(true);
  });
  it("lands a submitted response on Done, and reads ?at=done", () => {
    const it_ = (id: string) => ({ id, reference: null, title: id, details: null, area: null, proposed: null, perspectives: [] });
    const chapters = [{ name: null, intro: null, items: [it_("1"), it_("2")] }];
    expect(landingOf(chapters, {}, "differs", "chapters", null, true, true)).toEqual({ screen: { kind: "done" }, item: 0, welcome: null });
    expect(landingOf(chapters, {}, "differs", "chapters", null, true, false).screen).toEqual({ kind: "chapter", index: 0 });
    expect(parseScreen("done", true, 1)).toEqual({ kind: "done" });
  });
  it("words the receipt for a rate-blind list and a link with no close date", () => {
    const base = { respondentName: "Ana", projectName: "Expense tool", workspaceName: "Marlow", submittedAt: new Date("2026-10-05T12:00:00Z"), closesAt: null, url: "https://smesay.test/r/abc", counts: { items: 3, changed: 0, rated: 2, notNeeded: 1, unclear: 0, missing: 0, confidence: 4 } };
    const blind = receiptEmail({ ...base, rateBlind: true });
    expect(blind.text).toContain("You answered 3 items. You rated 2, marked 1 not needed and 0 unclear, and suggested 0 missing items. Your confidence: Confident (4 of 5).");
    expect(blind.text).toContain("You can change your answers while the link is open. Open the same link and press Change my answers.");
    expect(receiptEmail({ ...base, rateBlind: false }).text).toContain("You gave 0 a different priority");
  });
});

describe("Submit", () => {
  // E5-2, acceptance 6 (design note 98): Submit counts the open items by the instrument's
  // reason rule: on every answer an agreeing answer needs its comment; never takes a change
  // with no reason and Unclear with no question.
  it("counts the items still to finish by the PM's reason rule", async () => {
    const submitBody = (response: string) => ({ response, confidence: 4, signedOff: true, ...v() });
    const always = await publishedProject("Submit rule always", { reasonRule: "always" });
    const started = await startResponse(always.link.token, {}, { fields: { name: "Ana" } }, now);
    if ("status" in started) throw new Error(started.error);
    const device = { device: started.device! };
    const rid = started.response.id;
    await save(always.link.token, device, rid, { itemId: always.one.id, picked: "M" });
    await save(always.link.token, device, rid, { itemId: always.two.id, picked: "S" });
    expect(await submitResponse(always.link.token, device, submitBody(rid), BASE, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.itemsOpen(2) });
    await save(always.link.token, device, rid, { itemId: always.one.id, picked: "M", comment: "Core to the flow" });
    expect(await submitResponse(always.link.token, device, submitBody(rid), BASE, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.itemsOpen(1) });
    await save(always.link.token, device, rid, { itemId: always.two.id, picked: "S", comment: "As proposed" });
    expect(await submitResponse(always.link.token, device, submitBody(rid), BASE, now)).toMatchObject({ submittedAt: now });
    const never = await publishedProject("Submit rule never", { reasonRule: "never" });
    const begun = await startResponse(never.link.token, {}, { fields: { name: "Ana" } }, now);
    if ("status" in begun) throw new Error(begun.error);
    const nd = { device: begun.device! };
    await save(never.link.token, nd, begun.response.id, { itemId: never.one.id, picked: "C" });
    await save(never.link.token, nd, begun.response.id, { itemId: never.two.id, picked: "unclear" });
    expect(await submitResponse(never.link.token, nd, submitBody(begun.response.id), BASE, now)).toMatchObject({ submittedAt: now });
  });
  it("refuses until everything is in, stores the submission, and a second Submit updates it", async () => {
    const { project, instrument, link, one, two } = await publishedProject("Submit public", { question: "Anything else?", emailField: true });
    // An email typed on a public link: no receipt goes to it (anyone could type any address).
    const started = await startResponse(link.token, {}, { fields: { name: "Ana Pop", email: "someone@x.example" } }, now);
    if ("status" in started) throw new Error(started.error);
    const device = { device: started.device! };
    const rid = started.response.id;
    // E13-1: a new response writes response_started once; nothing about the person.
    expect(await events.countForInstrument(a.ws, "response_started", instrument.id)).toBe(1);
    const sent: Mail[] = [];
    const send = async (m: Mail) => { sent.push(m); };
    const body = { response: rid, confidence: 4, signedOff: true, closingAnswer: " All good ", missing: { text: "Mileage from addresses" } };
    // Each Submit is a write of the test page with its next number.
    const sub = (extra: Record<string, unknown> = {}) => ({ ...body, ...v(), ...extra });
    expect(await submitResponse(link.token, device, sub(), BASE, now, send)).toEqual({ status: 422, error: RESPONDENT_ERRORS.itemsOpen(2) });
    await save(link.token, device, rid, { itemId: one.id, picked: "M" });
    await save(link.token, device, rid, { itemId: two.id, picked: "C" });
    expect(await submitResponse(link.token, device, sub(), BASE, now, send)).toEqual({ status: 422, error: RESPONDENT_ERRORS.itemsOpen(1) });
    await save(link.token, device, rid, { itemId: two.id, picked: "C", reason: "Nice to have" });
    expect(await submitResponse(link.token, device, sub({ confidence: null }), BASE, now, send)).toEqual({ status: 422, error: RESPONDENT_ERRORS.confidence });
    expect(await submitResponse(link.token, device, sub({ signedOff: false }), BASE, now, send)).toEqual({ status: 422, error: RESPONDENT_ERRORS.signOff });
    expect(await submitResponse(link.token, {}, sub(), BASE, now, send)).toEqual({ status: 409, error: RESPONDENT_ERRORS.notStarted });
    // A Submit for a response this device no longer answers for (a window whose cookie was
    // replaced) is "not started" before anything else in the body is read, and nothing is
    // marked.
    expect(await submitResponse(link.token, device, sub({ response: "00000000-0000-4000-8000-000000000000", confidence: 9 }), BASE, now, send)).toEqual({ status: 409, error: RESPONDENT_ERRORS.notStarted });
    expect((await responses.get(a.ws, rid))?.submittedAt).toBeNull();
    // The Wrap up saves as it is written (not a Submit): stored, read back with its version on
    // the next visit, the response not submitted.
    expect(await saveWrap(link.token, device, { response: rid, confidence: 3, closingAnswer: "Draft", missing: { text: "Mileage" }, ...v() }, now)).toEqual({ saved: true, version: 1, writer: WPAGE, writerSeq: wseq, changedSince: false, submittedAt: null });
    const drafted = await loadRespondent(link.token, device, now);
    expect(drafted.kind === "ready" ? [drafted.wrap, drafted.wrapSync.version, drafted.response?.submittedAt] : null).toEqual([{ confidence: 3, signed: false, closingAnswer: "Draft", missing: { text: "Mileage" } }, 1, null]);
    // The missing item keeps its id from one save to the next (E9-1 cites it by id).
    const [kept] = await missingItems.forResponse(a.ws, rid);
    expect((await saveWrap(link.token, device, { response: rid, confidence: 3, closingAnswer: "Draft", missing: { text: "Mileage claims" }, ...v() }, now))).toMatchObject({ saved: true, version: 2 });
    expect((await missingItems.forResponse(a.ws, rid)).map((m) => [m.id, m.text])).toEqual([[kept.id, "Mileage claims"]]);
    expect(await saveWrap(link.token, device, { response: rid, confidence: null, closingAnswer: "", missing: null, ...v() }, now)).toMatchObject({ saved: true, version: 3 });
    expect(await missingItems.forResponse(a.ws, rid)).toEqual([]);
    expect(await saveWrap(link.token, device, { response: rid, confidence: 9, ...v() }, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.confidence });
    expect(await saveWrap(link.token, device, { response: rid, missing: "x", ...v() }, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.badMissing });
    expect(await saveWrap(link.token, device, { response: rid, confidence: 1 }, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.badShape });
    expect(await saveWrap(link.token, device, { response: "00000000-0000-4000-8000-000000000000", confidence: 9, ...v() }, now)).toEqual({ status: 409, error: RESPONDENT_ERRORS.notStarted });
    expect(await saveWrap(link.token, {}, { response: rid, confidence: 1, ...v() }, now)).toEqual({ status: 409, error: RESPONDENT_ERRORS.notStarted });
    expect(await events.countForInstrument(a.ws, "response_submitted", instrument.id)).toBe(0);
    expect(await submitResponse(link.token, device, sub(), BASE, now, send)).toEqual({ submittedAt: now, name: "Ana", version: 4, receipt: null });
    expect(await events.countForInstrument(a.ws, "response_submitted", instrument.id)).toBe(1);
    const row = (await responses.get(a.ws, rid))!;
    expect([row.submittedAt?.toISOString(), row.firstSubmittedAt?.toISOString(), row.signedOff, row.confidence, row.signOffText, row.closingAnswer]).toEqual([now.toISOString(), now.toISOString(), true, 4, DEFAULT_SIGN_OFF, "All good"]);
    const missing = await missingItems.forResponse(a.ws, row.id);
    expect(missing.map((m) => m.text)).toEqual(["Mileage from addresses"]);
    expect(sent).toEqual([]);
    // Another workspace reads none of it while it exists.
    expect(await missingItems.forResponse(b.ws, row.id)).toEqual([]);
    // The next visit reads the Wrap up as stored, so a Submit again keeps what was not changed.
    const view = await loadRespondent(link.token, device, now);
    expect(view.kind === "ready" ? [view.wrap, view.wrapSync] : null).toEqual([{ confidence: 4, signed: false, closingAnswer: "All good", missing: { text: "Mileage from addresses" } }, { version: 4, writer: WPAGE, writerSeq: wseq }]);
    // An old change kept on another device (made on version 1, by a page whose write the
    // server never took) is stale: it gets the stored Wrap up back and changes nothing.
    const old = { response: rid, confidence: null, closingAnswer: "A", missing: null, base: 1, page: "page-laptop-0001", seq: 1, after: [] };
    expect(await saveWrap(link.token, device, old, now)).toEqual({ stale: { wrap: { confidence: 4, signed: false, closingAnswer: "All good", missing: { text: "Mileage from addresses" } }, version: 4, writer: WPAGE, writerSeq: wseq, changedSince: false, submittedAt: now.toISOString() } });
    expect(await submitResponse(link.token, device, { ...old, confidence: 2, signedOff: true }, BASE, now, send)).toMatchObject({ stale: { version: 4 } });
    const untouched = (await responses.get(a.ws, rid))!;
    expect([untouched.confidence, untouched.closingAnswer, untouched.signedOff, untouched.submittedAt?.toISOString(), untouched.wrapVersion]).toEqual([4, "All good", true, now.toISOString(), 4]);
    // A save that says what is stored moves nothing but the version: not the last save.
    const quiet = new Date("2026-10-05T18:00:00Z");
    expect(await saveWrap(link.token, device, { response: rid, confidence: 4, closingAnswer: "All good", missing: { text: "Mileage from addresses" }, ...v() }, quiet)).toMatchObject({ saved: true, version: 5 });
    expect((await responses.get(a.ws, rid))?.updatedAt.toISOString()).toBe(untouched.updatedAt.toISOString());
    expect((await missingItems.forResponse(a.ws, rid)).map((m) => m.id)).toEqual(missing.map((m) => m.id));
    // Again, later, without the missing item: the same response, the first time kept.
    const later = new Date("2026-10-06T08:30:00Z");
    expect(await submitResponse(link.token, device, { response: rid, confidence: 5, signedOff: true, missing: null, ...v() }, BASE, later, send)).toEqual({ submittedAt: later, name: "Ana", version: 6, receipt: null });
    const again = (await responses.get(a.ws, rid))!;
    // Only the first Submit is the event.
    expect(await events.countForInstrument(a.ws, "response_submitted", instrument.id)).toBe(1);
    expect([again.submittedAt?.toISOString(), again.firstSubmittedAt?.toISOString(), again.confidence, again.closingAnswer]).toEqual([later.toISOString(), now.toISOString(), 5, null]);
    expect(await missingItems.forResponse(a.ws, row.id)).toEqual([]);
    expect((await responses.list(a.ws)).filter((r) => r.inviteId === link.id)).toHaveLength(1);
    // Another workspace reads and writes nothing of it: no missing item, no change to the row.
    const wrapWrite = { confidence: 1, closingAnswer: "x", missing: { text: "x" }, base: 6, page: "page-other-0001", seq: 1, after: [] };
    expect(await missingItems.forResponse(b.ws, row.id)).toEqual([]);
    expect(await responses.submit(b.ws, link.id, row.id, { ...wrapWrite, signOffText: "x" }, () => true, () => null, later)).toBeNull();
    // Through an invite of B's own, past the invite's lock: the response row of A is not found.
    const { link: bLink } = await publishedProjectIn(b, "Submit B");
    expect(await responses.submit(b.ws, bLink.id, row.id, { ...wrapWrite, signOffText: "x" }, () => true, () => null, later)).toBeNull();
    expect(await responses.saveWrap(b.ws, bLink.id, row.id, wrapWrite, () => true, later)).toBeNull();
    expect((await responses.get(a.ws, row.id))?.confidence).toBe(5);
    expect(await responses.get(b.ws, row.id)).toBeNull();
    // Under the response's lock, the check sees the answers as stored and the perspectives as
    // locked; its sentence refuses.
    const seen: string[][] = [];
    expect(await responses.submit(a.ws, link.id, row.id, { ...wrapWrite, base: 6, closingAnswer: null, missing: null, signOffText: "x" }, () => true, (rows, perspectives) => { seen.push(perspectives); return rows.length === 2 ? "seen" : null; }, later)).toEqual({ invalid: "seen" });
    expect(seen).toEqual([[]]);
    expect((await responses.get(a.ws, row.id))?.confidence).toBe(5);
    // A revoked link takes nothing more.
    const revoked = await revokeLink(a.ws, project.id, instrument.id, link.id, later);
    if (!("invite" in revoked)) throw new Error(revoked.error);
    expect(await submitResponse(link.token, device, { response: rid, confidence: 2, signedOff: true, ...v() }, BASE, later, send)).toEqual({ status: 410, error: "revoked" });
    expect((await responses.get(a.ws, row.id))?.confidence).toBe(5);
  }, 60_000);

  it("sends the receipt to a personal invite on its first Submit, counts only", async () => {
    const { project, instrument, one, two } = await publishedProject("Submit personal");
    const result = await sendInvites(a.ws, project.id, instrument.id, "ana@x.example, Ana Pop, Sales", { name: "Dana", email: "dana@x.example" }, BASE, new Date("2026-10-03T12:00:00Z"), async () => {});
    if (!("outcomes" in result)) throw new Error(result.error);
    const [ana] = await listInvitees(a.ws, instrument.id);
    const started = await startResponse(ana.token, {}, { fields: {} }, now);
    if ("status" in started) throw new Error(started.error);
    const rid = started.response.id;
    await save(ana.token, {}, rid, { itemId: one.id, picked: "S", reason: "Later" });
    await save(ana.token, {}, rid, { itemId: two.id, picked: "unclear", reason: "Which team?" });
    const sent: Mail[] = [];
    const send = async (m: Mail) => { sent.push(m); };
    const first = await submitResponse(ana.token, {}, { response: rid, confidence: 3, signedOff: true, ...v() }, BASE, now, send);
    if ("status" in first) throw new Error(first.error);
    if ("stale" in first) throw new Error("stale");
    expect([first.submittedAt, first.name]).toEqual([now, "Ana"]);
    // The receipt goes after the reply (the route runs it with after()).
    expect(sent).toEqual([]);
    await first.receipt?.();
    expect(sent.map((m) => [m.to, m.subject])).toEqual([["ana@x.example", "Your answers on Submit personal were submitted"]]);
    expect(sent[0].text).toContain("You answered 2 items. You gave 1 a different priority, marked 0 not needed and 1 unclear, and suggested 0 missing items. Your confidence: Fairly sure (3 of 5).");
    expect(sent[0].text).toContain(`${BASE}/r/${ana.token}`);
    expect(sent[0].text).not.toContain("Later");
    // A second Submit sends none; the Done page is its receipt.
    const second = await submitResponse(ana.token, {}, { response: rid, confidence: 4, signedOff: true, ...v() }, BASE, new Date("2026-10-05T13:00:00Z"), send);
    expect("receipt" in second ? second.receipt : "refused").toBeNull();
  }, 60_000);

  it("takes JSON only on the route and reads the device cookie", async () => {
    const { link, one, two } = await publishedProject("Submit route");
    const started = await startResponse(link.token, {}, { fields: { name: "Bo" } }, now);
    if ("status" in started) throw new Error(started.error);
    const device = { device: started.device! };
    await save(link.token, device, started.response.id, { itemId: one.id, picked: "M" }, new Date());
    await save(link.token, device, started.response.id, { itemId: two.id, picked: "S" }, new Date());
    const headers = (type: string) => ({ "content-type": type, cookie: `${DEVICE_COOKIE}=${started.device}` });
    const params = { params: Promise.resolve({ token: link.token }) };
    const post = (body: string, type = "application/json") => submitRoute(new Request(`${BASE}/r/${link.token}/submit`, { method: "POST", body, headers: headers(type) }), params);
    const put = (body: string, type = "application/json") => wrapRoute(new Request(`${BASE}/r/${link.token}/wrap`, { method: "PUT", body, headers: headers(type) }), params);
    expect((await post("confidence=3", "application/x-www-form-urlencoded")).status).toBe(415);
    expect((await put("confidence=3", "application/x-www-form-urlencoded")).status).toBe(415);
    const saved = await put(JSON.stringify({ response: started.response.id, confidence: 2, ...v() }));
    expect([saved.status, await saved.json()]).toEqual([200, { saved: true, version: 1, writer: WPAGE, writerSeq: wseq, changedSince: false, submittedAt: null }]);
    // A stale write: 409 with the stored Wrap up.
    const stale = await put(JSON.stringify({ response: started.response.id, confidence: 5, base: 0, page: "page-other-0002", seq: 1 }));
    expect([stale.status, await stale.json()]).toEqual([409, { error: "stale", wrap: { confidence: 2, signed: false, closingAnswer: "", missing: { text: "" } }, version: 1, writer: WPAGE, writerSeq: wseq, changedSince: false, submittedAt: null }]);
    const ok = await post(JSON.stringify({ response: started.response.id, confidence: 3, signedOff: true, ...v(1) }));
    expect(ok.status).toBe(200);
    const reply = await ok.json();
    expect([typeof reply.submittedAt, reply.name, reply.version]).toEqual(["string", "Bo", 2]);
  }, 60_000);
});

describe("after Submit", () => {
  it("words the summary and the welcome back, and tells a change after Submit apart", () => {
    expect(RESPONDENT_COPY.summary({ agreed: 4, changed: 2, notNeeded: 0, unclear: 0, rated: 0, added: 1 }, false)).toBe("4 agreed, 2 changed, 0 not needed, 0 unclear, 1 item added");
    // An item with no proposal in a list that shows one counts as rated.
    expect(RESPONDENT_COPY.summary({ agreed: 1, changed: 0, notNeeded: 0, unclear: 0, rated: 1, added: 0 }, false)).toBe("1 agreed, 0 changed, 1 rated, 0 not needed, 0 unclear, 0 items added");
    expect(RESPONDENT_COPY.summary({ agreed: 0, changed: 0, notNeeded: 1, unclear: 2, rated: 3, added: 0 }, true)).toBe("3 rated, 1 not needed, 2 unclear, 0 items added");
    expect(RESPONDENT_COPY.welcomeSubmitted("Ana")).toBe("Welcome back, Ana.");
    expect(RESPONDENT_COPY.submittedOn("7 Oct 2026, 14:05 UTC", "20 Oct 2026, 15:00 UTC")).toBe("You submitted on 7 Oct 2026, 14:05 UTC. You can change your answers until 20 Oct 2026, 15:00 UTC.");
    expect(RESPONDENT_COPY.submittedOn("7 Oct 2026, 14:05 UTC", null)).toBe("You submitted on 7 Oct 2026, 14:05 UTC. You can change your answers while the link is open.");
    expect(RESPONDENT_COPY.closedSubmitted("7 Oct 2026, 14:05 UTC", "20 Oct 2026, 15:00 UTC", false)).toBe("Your answers were submitted on 7 Oct 2026, 14:05 UTC. The link closed on 20 Oct 2026, 15:00 UTC; nothing can be changed now.");
    expect(RESPONDENT_COPY.closedSubmitted("7 Oct 2026, 14:05 UTC", "20 Oct 2026, 15:00 UTC", true)).toBe("Your answers were submitted on 7 Oct 2026, 14:05 UTC. You changed some after that and did not submit them again. The link closed on 20 Oct 2026, 15:00 UTC; nothing can be changed now.");
    const first = new Date("2026-10-07T14:05:00Z");
    expect(changedAfterSubmit({ firstSubmittedAt: null, updatedAt: first })).toBe(false);
    expect(changedAfterSubmit({ firstSubmittedAt: first, updatedAt: first })).toBe(false);
    expect(changedAfterSubmit({ firstSubmittedAt: first, updatedAt: new Date("2026-10-08T09:00:00Z") })).toBe(true);
    expect([changedSinceSubmit({ submittedAt: null, signedOff: false }), changedSinceSubmit({ submittedAt: first, signedOff: true }), changedSinceSubmit({ submittedAt: first, signedOff: false })]).toEqual([false, false, true]);
    // The page's notice: a "changed" counts for the Submit it was heard about, and shows while
    // that is the latest Submit the page knows, whatever order the answers arrive in.
    const S0 = "2026-10-07T14:05:00.000Z"; const S1 = "2026-10-08T09:00:00.000Z";
    const knows = (at: string | null, changedFor: string | null = null) => ({ at, changedFor });
    expect(heardSubmit(NO_SUBMIT, { submittedAt: null, changedSince: false })).toEqual(NO_SUBMIT);
    expect(heardSubmit(knows(S0), { submittedAt: S0, changedSince: true })).toEqual(knows(S0, S0));
    expect(heardSubmit(knows(S0, S0), { submittedAt: S0, changedSince: false })).toEqual(knows(S0, S0));
    // A newer Submit made elsewhere ends a change heard for an older one.
    expect(heardSubmit(knows(S0, S0), { submittedAt: S1, changedSince: false })).toEqual(knows(S1, S0));
    expect(showsChanged(knows(S1, S0))).toBe(false);
    // An answer about the older Submit that arrives late changes neither.
    expect(heardSubmit(knows(S1), { submittedAt: S0, changedSince: true })).toEqual(knows(S1, S0));
    expect(heardSubmit(knows(S1, S1), { submittedAt: S0, changedSince: false })).toEqual(knows(S1, S1));
    // A change after a Submit the page did not know: the notice shows for it.
    expect(showsChanged(heardSubmit(knows(S0), { submittedAt: S1, changedSince: true }))).toBe(true);
    // A time that does not read is left out.
    expect(heardSubmit(knows(S0), { submittedAt: "yesterday", changedSince: true })).toEqual(knows(S0));
    expect([showsChanged(NO_SUBMIT), showsChanged(knows(S0)), showsChanged(knows(S0, S0)), showsChanged(knows(S0, "2026-10-07T14:05:00Z"))]).toEqual([false, false, true, true]);
    // A Start's answer: another response replaces what the page knows; for the same response
    // the page shows the latest Submit it knows, and the answer is heard as any other.
    expect(startSubmit(null, NO_SUBMIT, { submittedAt: null, changedSince: false }, false)).toEqual({ submitted: "keep", seen: NO_SUBMIT });
    expect(startSubmit(null, NO_SUBMIT, { submittedAt: S1, changedSince: false }, false)).toEqual({ submitted: { at: S1 }, seen: knows(S1) });
    // The laptop's notice for S0, the phone's Submit S1, then Start on the laptop: no notice.
    expect(startSubmit(S0, knows(S0, S0), { submittedAt: S1, changedSince: false }, false)).toEqual({ submitted: { at: S1 }, seen: knows(S1, S0) });
    expect(startSubmit(S0, knows(S0), { submittedAt: S1, changedSince: true }, false)).toEqual({ submitted: { at: S1 }, seen: knows(S1, S1) });
    // A save's "changed" heard first is kept: the Start read before it.
    expect(startSubmit(S0, knows(S0, S0), { submittedAt: S0, changedSince: false }, false)).toEqual({ submitted: "keep", seen: knows(S0, S0) });
    // A save named a Submit the page did not show yet: Start shows it.
    expect(startSubmit(S0, knows(S1, S1), { submittedAt: S0, changedSince: false }, false)).toEqual({ submitted: { at: S1 }, seen: knows(S1, S1) });
    expect(startSubmit(S0, knows(S0, S0), { submittedAt: null, changedSince: false }, true)).toEqual({ submitted: null, seen: NO_SUBMIT });
    expect(startSubmit(S0, knows(S0), { submittedAt: S1, changedSince: true }, true)).toEqual({ submitted: { at: S1 }, seen: knows(S1, S1) });
  });

  it("opens a submitted personal link on Done, takes the sign-off back only on a change, and after the close shows the submitted page", async () => {
    const { project, instrument, one, two } = await publishedProject("After submit");
    const result = await sendInvites(a.ws, project.id, instrument.id, "cy@x.example, Cy Lee", { name: "Dana", email: "dana@x.example" }, BASE, new Date("2026-10-03T12:00:00Z"), async () => {});
    if (!("outcomes" in result)) throw new Error(result.error);
    const [cy] = await listInvitees(a.ws, instrument.id);
    const started = await startResponse(cy.token, {}, { fields: {} }, now);
    if ("status" in started) throw new Error(started.error);
    const rid = started.response.id;
    await save(cy.token, {}, rid, { itemId: one.id, picked: "M" });
    await save(cy.token, {}, rid, { itemId: two.id, picked: "S" });
    await submitResponse(cy.token, {}, { response: rid, confidence: 4, signedOff: true, missing: { text: "Mileage" }, ...v() }, BASE, now, async () => {});
    const day = new Date("2026-10-06T00:00:00Z");
    const open = await loadRespondent(cy.token, {}, day);
    expect(open.kind === "ready" ? [open.response?.submittedAt?.toISOString(), open.wrap.missing.text] : null).toEqual([now.toISOString(), "Mileage"]);
    const mark = async () => { const row = (await responses.forInvite(a.ws, cy.id))!; return [changedAfterSubmit(row), changedSinceSubmit(row)]; };
    // Neither the Submit, nor a Start that changes nothing, nor a save that says what is
    // stored (an answer or the Wrap up) is a change.
    expect(await mark()).toEqual([false, false]);
    await startResponse(cy.token, {}, { fields: {} }, day);
    expect(await mark()).toEqual([false, false]);
    expect(await save(cy.token, {}, rid, { itemId: one.id, picked: "M" }, day)).toMatchObject({ changedSince: false, submittedAt: now.toISOString() });
    expect(await saveWrap(cy.token, {}, { response: rid, confidence: 4, missing: { text: "Mileage" }, ...v() }, day)).toMatchObject({ saved: true, changedSince: false, submittedAt: now.toISOString() });
    expect(await mark()).toEqual([false, false]);
    // An answer changed later: the mark, and the sign-off taken back until the next Submit;
    // the save's answer says so.
    expect(await save(cy.token, {}, rid, { itemId: two.id, picked: "C", reason: "Later" }, day)).toMatchObject({ changedSince: true, submittedAt: now.toISOString() });
    expect([...(await mark()), (await responses.forInvite(a.ws, cy.id))!.submittedAt?.toISOString()]).toEqual([true, true, now.toISOString()]);
    const later = new Date("2026-10-06T01:00:00Z");
    await submitResponse(cy.token, {}, { response: rid, confidence: 4, signedOff: true, missing: { text: "Mileage" }, ...v() }, BASE, later, async () => {});
    expect([...(await mark()), (await responses.forInvite(a.ws, cy.id))!.signedOff]).toEqual([true, false, true]);
    // A Submit stored after another whose clock was ahead (two at once), here with the first
    // Submit's own clock: its time still moves forward, a millisecond on, its answer says the
    // stored time, the first Submit stays, and no second receipt goes.
    const ahead = new Date(later.getTime() + 1);
    const behind = await submitResponse(cy.token, {}, { response: rid, confidence: 4, signedOff: true, missing: { text: "Mileage" }, ...v() }, BASE, now, async () => {});
    if (!("submittedAt" in behind)) throw new Error(JSON.stringify(behind));
    const stored = (await responses.forInvite(a.ws, cy.id))!;
    expect([behind.submittedAt.toISOString(), stored.submittedAt?.toISOString(), stored.firstSubmittedAt?.toISOString(), behind.receipt]).toEqual([ahead.toISOString(), ahead.toISOString(), now.toISOString(), null]);
    // The Wrap up changed after Submit takes it back too.
    expect(await saveWrap(cy.token, {}, { response: rid, confidence: 2, missing: { text: "Mileage" }, ...v() }, later)).toMatchObject({ saved: true, changedSince: true, submittedAt: ahead.toISOString() });
    expect((await mark())[1]).toBe(true);
    const closed = await loadRespondent(cy.token, {}, new Date("2027-02-01T00:00:00Z"));
    if (closed.kind !== "closedSubmitted") throw new Error(closed.kind);
    expect([closed.submittedAt.toISOString(), closed.changed]).toEqual([ahead.toISOString(), true]);
    // Revoked (the row's revoked time, as a revoke writes it), then the project archived: the
    // link reads "closed" for the archive and shows nothing of the respondent's.
    await invites.update(a.ws, cy.id, { revokedAt: later });
    await projects.setArchived(a.ws, project.id, true);
    expect((await loadRespondent(cy.token, {}, later)).kind).toBe("closed");
  }, 60_000);

  it("takes the sign-off back on a Start that changes the details or the picks, on a public link too", async () => {
    const { link, one, two } = await publishedProject("After submit public", { perspectives: "Finance" });
    const started = await startResponse(link.token, {}, { fields: { name: "Di Moss" } }, now);
    if ("status" in started) throw new Error(started.error);
    const device = { device: started.device! };
    const rid = started.response.id;
    await save(link.token, device, rid, { itemId: one.id, picked: "M" });
    await save(link.token, device, rid, { itemId: two.id, picked: "S" });
    await submitResponse(link.token, device, { response: rid, confidence: 3, signedOff: true, ...v() }, BASE, now, async () => {});
    // The same device opens it on Done (the landing reads the submitted response); another
    // device has none.
    const back = await loadRespondent(link.token, device, now);
    expect(back.kind === "ready" ? back.response?.submittedAt?.toISOString() : null).toBe(now.toISOString());
    const other = await loadRespondent(link.token, {}, now);
    expect(other.kind === "ready" ? other.response : "not ready").toBeNull();
    const row = async () => (await responses.get(a.ws, rid))!;
    // A Start with the same details (an empty optional field is not a value) changes nothing.
    const same = await startResponse(link.token, device, { fields: { name: "Di Moss" } }, new Date("2026-10-06T00:00:00Z"));
    if ("status" in same) throw new Error(same.error);
    expect([changedSinceSubmit(same.response), changedAfterSubmit(await row())]).toEqual([false, false]);
    // New details: the sign-off taken back, the last save moved; the route says so.
    const later = new Date("2026-10-06T00:00:00Z");
    const renamed = await startResponse(link.token, device, { fields: { name: "Di Moss-Hale" } }, later);
    if ("status" in renamed) throw new Error(renamed.error);
    expect([changedSinceSubmit(renamed.response), changedAfterSubmit(await row())]).toEqual([true, true]);
    const post = (body: unknown) => startRoute(new Request(`${BASE}/r/${link.token}/start`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", cookie: `${DEVICE_COOKIE}=${started.device}` } }), { params: Promise.resolve({ token: link.token }) });
    expect(await (await post({ fields: { name: "Di Moss-Hale" } })).json()).toEqual({ ok: true, response: rid, submittedAt: now.toISOString(), changedSince: true });
    // Submitted again, then new picks: taken back again. The last save never moves back.
    await submitResponse(link.token, device, { response: rid, confidence: 3, signedOff: true, ...v() }, BASE, later, async () => {});
    expect(changedSinceSubmit(await row())).toBe(false);
    const picked = await startResponse(link.token, device, { fields: { name: "Di Moss-Hale" }, perspectives: ["Finance"] }, now);
    if ("status" in picked) throw new Error(picked.error);
    expect([changedSinceSubmit(picked.response), picked.response.updatedAt.toISOString()]).toEqual([true, later.toISOString()]);
    // A write that changes nothing on a response already changed still says so.
    expect(await save(link.token, device, rid, { itemId: one.id, picked: "M" }, later)).toMatchObject({ changedSince: true, submittedAt: later.toISOString() });
    const held = (await loadRespondent(link.token, device, later));
    if (held.kind !== "ready") throw new Error(held.kind);
    expect(await saveWrap(link.token, device, { response: rid, confidence: 3, ...v() }, later)).toMatchObject({ saved: true, changedSince: true, submittedAt: later.toISOString() });
    // A stale write says it too: the Wrap up's, an answer's on the route, a Submit's.
    expect(await saveWrap(link.token, device, { response: rid, confidence: 1, base: 0, page: "page-other-0003", seq: 1 }, later)).toMatchObject({ stale: { changedSince: true, submittedAt: later.toISOString() } });
    const answerPut = (body: unknown) => answersRoute(new Request(`${BASE}/r/${link.token}/answers`, { method: "PUT", body: JSON.stringify(body), headers: { "content-type": "application/json", cookie: `${DEVICE_COOKIE}=${started.device}` } }), { params: Promise.resolve({ token: link.token }) });
    const staleAnswer = await answerPut({ itemId: one.id, picked: "C", base: 0, page: "page-other-0004", seq: 1, response: rid });
    const staleBody = (await staleAnswer.json()) as { changedSince: unknown; submittedAt: unknown };
    expect([staleAnswer.status, staleBody.changedSince, staleBody.submittedAt]).toEqual([409, true, later.toISOString()]);
    expect(await submitResponse(link.token, device, { response: rid, confidence: 3, signedOff: true, base: 0, page: "page-other-0005", seq: 1 }, BASE, later, async () => {})).toMatchObject({ stale: { changedSince: true, submittedAt: later.toISOString() } });
  }, 60_000);

  it("shows a revoked personal link that was started and not submitted as closed, not as the respondent's own", async () => {
    const { project, instrument, one } = await publishedProject("After submit revoked");
    const result = await sendInvites(a.ws, project.id, instrument.id, "eve@x.example, Eve Ng", { name: "Dana", email: "dana@x.example" }, BASE, new Date("2026-10-03T12:00:00Z"), async () => {});
    if (!("outcomes" in result)) throw new Error(result.error);
    const [eve] = await listInvitees(a.ws, instrument.id);
    const started = await startResponse(eve.token, {}, { fields: {} }, now);
    if ("status" in started) throw new Error(started.error);
    await save(eve.token, {}, started.response.id, { itemId: one.id, picked: "M" });
    expect((await loadRespondent(eve.token, {}, new Date("2027-02-01T00:00:00Z"))).kind).toBe("closedOwn");
    await invites.update(a.ws, eve.id, { revokedAt: now });
    await projects.setArchived(a.ws, project.id, true);
    expect((await loadRespondent(eve.token, {}, new Date("2027-02-01T00:00:00Z"))).kind).toBe("closed");
  }, 60_000);
});
