// Submit (stories/E7-5) on the test database: the Wrap up's buckets, its areas, the submit
// input and the Wrap up kept on the device; then Submit refused while an item is open
// (checked under the response's lock), without confidence or the sign-off, or with a missing
// item outside the areas; stored with the sign-off sentence, the closing answer, the missing
// item and the first and latest times, and read back for the next visit; a second Submit
// updating the same response; the receipt only to a personal invite, on its first Submit,
// never to an address typed on a public link; a revoked link and another workspace writing
// nothing; the route taking JSON only.
import { beforeAll, describe, expect, it } from "vitest";
import { items, missingItems, projects, responses } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { DEFAULT_SIGN_OFF } from "@/lib/closing";
import { commitUpload } from "@/lib/imports";
import { openDraft, saveClosing, saveFields } from "@/lib/instruments";
import { listInvitees, sendInvites } from "@/lib/invitees";
import { memoryOutbox, type Mail } from "@/lib/mail";
import { receiptEmail } from "@/lib/mail/receipt-email";
import { DEVICE_COOKIE, loadRespondent, saveAnswer, saveWrap, startResponse, submitResponse, type RespondentCookies } from "@/lib/respondent";
import { areasOf, bucketOf, landingOf, parseScreen, EMPTY_WRAP, parseSubmitInput, RESPONDENT_ERRORS, tallyOf, wrapDraft, wrapDraftOf, type Chapter } from "@/lib/respondent-rules";
import { publishLink, revokeLink } from "@/lib/sharing";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";
import { POST as submitRoute } from "@/app/r/[token]/submit/route";

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
const save = (token: string, cookies: RespondentCookies, response: string, body: { itemId: string; picked: string; reason?: string }, at = now) => saveAnswer(token, cookies, { ...body, base: 0, page: PAGE, seq: ++seq, response }, at);

async function publishedProject(name: string, options: { question?: string; emailField?: boolean } = {}) {
  return publishedProjectIn(a, name, options);
}
async function publishedProjectIn(w: { ws: WorkspaceId; userId: string }, name: string, options: { question?: string; emailField?: boolean } = {}) {
  const project = await projects.create(w.ws, { name, createdBy: w.userId });
  const pasted = await savePaste({ ws: w.ws, userId: w.userId }, project.id, ["One | Submitting | Must", "Two | Paying | Should"].join("\n"));
  if (!("upload" in pasted)) throw new Error(pasted.error);
  await commitUpload(w.ws, pasted.upload.id, w.userId);
  const { instrument } = (await openDraft(w.ws, project))!;
  const fields = await saveFields(w.ws, project.id, instrument.id, JSON.stringify([{ label: "Name", type: "text", mandatory: true }, ...(options.emailField ? [{ label: "Email", type: "email", mandatory: false }] : [])]));
  if (!("instrument" in fields)) throw new Error(fields.error);
  if (options.question) {
    const closing = await saveClosing(w.ws, project.id, instrument.id, options.question, "1", DEFAULT_SIGN_OFF, "1");
    if (!("instrument" in closing)) throw new Error(closing.error);
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
    const tally = tallyOf("moscow", [{ id: "1", proposed: "S" }, { id: "2", proposed: "S" }, { id: "3", proposed: "M" }], { "1": at("change", "M"), "2": { kind: "change", value: "C", reason: null, comment: null }, "3": at("agree", "M") });
    expect([tally.higher, tally.lower, tally.agreed]).toEqual([["1"], [], ["3"]]);
  });
  it("reads the Wrap up as Submit posts it", () => {
    const ctx = { method: "moscow" as const, areas: ["Submitting", "Paying"], hasQuestion: true, missingForm: true };
    expect(parseSubmitInput({ response: "r", confidence: 4, signedOff: true, closingAnswer: " Fine ", missing: { text: " Mileage ", area: "Submitting", value: "S" } }, ctx)).toEqual({ input: { response: "r", confidence: 4, closingAnswer: "Fine", missing: { text: "Mileage", area: "Submitting", value: "S" } } });
    expect(parseSubmitInput({ response: "r", confidence: 4, signedOff: true, closingAnswer: "x", missing: { text: "", area: "", value: "" } }, { ...ctx, hasQuestion: false })).toEqual({ input: { response: "r", confidence: 4, closingAnswer: null, missing: null } });
    expect(parseSubmitInput({ response: "r", confidence: 4, signedOff: false }, ctx)).toEqual({ error: RESPONDENT_ERRORS.signOff });
    expect(parseSubmitInput({ response: "r", confidence: 0, signedOff: true }, ctx)).toEqual({ error: RESPONDENT_ERRORS.confidence });
    expect(parseSubmitInput({ response: "r", signedOff: true }, ctx)).toEqual({ error: RESPONDENT_ERRORS.confidence });
    expect(parseSubmitInput({ response: "r", confidence: 3, signedOff: true, missing: { text: "x", area: "Nowhere" } }, ctx)).toEqual({ error: RESPONDENT_ERRORS.badMissing });
    expect(parseSubmitInput({ response: "r", confidence: 3, signedOff: true, missing: { text: "x", value: "Z" } }, ctx)).toEqual({ error: RESPONDENT_ERRORS.badMissing });
    expect(parseSubmitInput({ response: "r", confidence: 3, signedOff: true, missing: { text: "x".repeat(501) } }, ctx)).toEqual({ error: RESPONDENT_ERRORS.missingTooLong });
    expect(parseSubmitInput({ response: "r", confidence: 3, signedOff: true, closingAnswer: "x".repeat(2001) }, ctx)).toEqual({ error: RESPONDENT_ERRORS.closingTooLong });
    expect(parseSubmitInput("nope", ctx)).toEqual({ error: RESPONDENT_ERRORS.badShape });
    // The response the page answers for is named.
    expect(parseSubmitInput({ confidence: 3, signedOff: true }, ctx)).toEqual({ error: RESPONDENT_ERRORS.badShape });
    // The sign-off sentence the page showed must still be the PM's.
    expect(parseSubmitInput({ response: "r", confidence: 3, signedOff: true, signOffText: "Old text." }, { ...ctx, signOff: "New text." })).toEqual({ error: RESPONDENT_ERRORS.signOffChanged });
    expect(parseSubmitInput({ response: "r", confidence: 3, signedOff: true, signOffText: "New text." }, { ...ctx, signOff: "New text." })).toMatchObject({ input: { response: "r", confidence: 3 } });
    // A list with no areas asks none: an area named anyway is refused, none is taken.
    expect(parseSubmitInput({ response: "r", confidence: 3, signedOff: true, missing: { text: "x", area: "Mileage" } }, { ...ctx, areas: [] })).toEqual({ error: RESPONDENT_ERRORS.badMissing });
    expect(parseSubmitInput({ response: "r", confidence: 3, signedOff: true, missing: { text: "x", area: "" } }, { ...ctx, areas: [] })).toEqual({ input: { response: "r", confidence: 3, closingAnswer: null, missing: { text: "x", area: null, value: null } } });
  });
  it("lands a submitted response on Done, and reads ?at=done", () => {
    const it_ = (id: string) => ({ id, reference: null, title: id, details: null, area: null, proposed: null, perspectives: [] });
    const chapters = [{ name: null, intro: null, items: [it_("1"), it_("2")] }];
    expect(landingOf(chapters, {}, "chapters", null, true, true)).toEqual({ screen: { kind: "done" }, item: 0, welcome: null });
    expect(landingOf(chapters, {}, "chapters", null, true, false).screen).toEqual({ kind: "chapter", index: 0 });
    expect(parseScreen("done", true, 1)).toEqual({ kind: "done" });
  });
  it("words the receipt for a rate-blind list and a link with no close date", () => {
    const base = { respondentName: "Ana", projectName: "Expense tool", workspaceName: "Marlow", submittedAt: new Date("2026-10-05T12:00:00Z"), closesAt: null, url: "https://smesay.test/r/abc", counts: { items: 3, changed: 0, rated: 2, notNeeded: 1, unclear: 0, missing: 0, confidence: 4 } };
    const blind = receiptEmail({ ...base, rateBlind: true });
    expect(blind.text).toContain("3 items answered. 2 rated, 1 not needed, 0 marked unclear, 0 missing items suggested. Confidence 4 of 5.");
    expect(blind.text).toContain("You can change your answers while the link is open. Open the same link and press Change my answers.");
    expect(receiptEmail({ ...base, rateBlind: false }).text).toContain("0 with a different priority");
  });
  it("offers only the list's areas for a missing item", () => {
    const ch = (name: string | null, loose?: true): Chapter => ({ name, intro: null, items: [], ...(loose ? { loose } : {}) });
    expect(areasOf([ch("Submitting"), ch("Paying"), ch("Other items", true)])).toEqual(["Submitting", "Paying"]);
    expect(areasOf([ch(null)])).toEqual([]);
  });
  it("keeps the Wrap up on the device for its response, never the sign-off", () => {
    const value = { confidence: 4, signed: true, closingAnswer: "Fine", missing: { text: "Mileage", area: "Submitting", value: "S" } };
    const raw = wrapDraft("r1", value);
    expect(wrapDraftOf(raw, "r1")).toEqual({ ...value, signed: false });
    expect(wrapDraftOf(raw, "r2")).toBeNull();
    expect([wrapDraftOf(null, "r1"), wrapDraftOf("{", "r1"), wrapDraftOf("[]", "r1")]).toEqual([null, null, null]);
    expect(wrapDraftOf(JSON.stringify({ response: "r1", value: { confidence: 9, closingAnswer: 3, missing: { text: "x".repeat(600) } } }), "r1")).toEqual({ ...EMPTY_WRAP, missing: { text: "x".repeat(500), area: "", value: "" } });
  });
});

describe("Submit", () => {
  it("refuses until everything is in, stores the submission, and a second Submit updates it", async () => {
    const { project, instrument, link, one, two } = await publishedProject("Submit public", { question: "Anything else?", emailField: true });
    // An email typed on a public link: no receipt goes to it (anyone could type any address).
    const started = await startResponse(link.token, {}, { fields: { name: "Ana Pop", email: "someone@x.example" } }, now);
    if ("status" in started) throw new Error(started.error);
    const device = { device: started.device! };
    const rid = started.response.id;
    const sent: Mail[] = [];
    const send = async (m: Mail) => { sent.push(m); };
    const body = { response: rid, confidence: 4, signedOff: true, closingAnswer: " All good ", missing: { text: "Mileage from addresses", area: "Submitting", value: "S" } };
    expect(await submitResponse(link.token, device, body, BASE, now, send)).toEqual({ status: 422, error: RESPONDENT_ERRORS.itemsOpen(2) });
    await save(link.token, device, rid, { itemId: one.id, picked: "M" });
    await save(link.token, device, rid, { itemId: two.id, picked: "C" });
    expect(await submitResponse(link.token, device, body, BASE, now, send)).toEqual({ status: 422, error: RESPONDENT_ERRORS.itemsOpen(1) });
    await save(link.token, device, rid, { itemId: two.id, picked: "C", reason: "Nice to have" });
    expect(await submitResponse(link.token, device, { ...body, confidence: null }, BASE, now, send)).toEqual({ status: 422, error: RESPONDENT_ERRORS.confidence });
    expect(await submitResponse(link.token, device, { ...body, signedOff: false }, BASE, now, send)).toEqual({ status: 422, error: RESPONDENT_ERRORS.signOff });
    expect(await submitResponse(link.token, {}, body, BASE, now, send)).toEqual({ status: 409, error: RESPONDENT_ERRORS.notStarted });
    // A Submit for a response this device no longer answers for (a window whose cookie was
    // replaced) is "not started", and nothing is marked.
    expect(await submitResponse(link.token, device, { ...body, response: "00000000-0000-4000-8000-000000000000" }, BASE, now, send)).toEqual({ status: 409, error: RESPONDENT_ERRORS.notStarted });
    expect((await responses.get(a.ws, rid))?.submittedAt).toBeNull();
    // The Wrap up saves as it is written (not a Submit): stored, read back on the next visit,
    // the response not submitted.
    expect(await saveWrap(link.token, device, { response: rid, confidence: 3, closingAnswer: "Draft", missing: { text: "Mileage", area: "Submitting", value: "" } }, now)).toEqual({ saved: true });
    const drafted = await loadRespondent(link.token, device, now);
    expect(drafted.kind === "ready" ? [drafted.wrap, drafted.response?.submittedAt] : null).toEqual([{ confidence: 3, signed: false, closingAnswer: "Draft", missing: { text: "Mileage", area: "Submitting", value: "" } }, null]);
    expect(await saveWrap(link.token, device, { response: rid, confidence: null, closingAnswer: "", missing: null }, now)).toEqual({ saved: true });
    expect(await missingItems.forResponse(a.ws, rid)).toEqual([]);
    expect(await saveWrap(link.token, device, { response: rid, confidence: 9 }, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.confidence });
    expect(await saveWrap(link.token, device, { response: rid, missing: { text: "x", area: "Nowhere" } }, now)).toEqual({ status: 422, error: RESPONDENT_ERRORS.badMissing });
    expect(await saveWrap(link.token, device, { response: "00000000-0000-4000-8000-000000000000", confidence: 1 }, now)).toEqual({ status: 409, error: RESPONDENT_ERRORS.notStarted });
    expect(await saveWrap(link.token, {}, { response: rid, confidence: 1 }, now)).toEqual({ status: 409, error: RESPONDENT_ERRORS.notStarted });
    expect(await submitResponse(link.token, device, body, BASE, now, send)).toEqual({ submittedAt: now, name: "Ana", receipt: null });
    const row = (await responses.get(a.ws, rid))!;
    expect([row.submittedAt?.toISOString(), row.firstSubmittedAt?.toISOString(), row.signedOff, row.confidence, row.signOffText, row.closingAnswer]).toEqual([now.toISOString(), now.toISOString(), true, 4, DEFAULT_SIGN_OFF, "All good"]);
    const missing = await missingItems.forResponse(a.ws, row.id);
    expect(missing.map((m) => [m.text, m.suggestedArea, m.suggestedValue])).toEqual([["Mileage from addresses", "Submitting", "S"]]);
    expect(sent).toEqual([]);
    // Another workspace reads none of it while it exists.
    expect(await missingItems.forResponse(b.ws, row.id)).toEqual([]);
    // The next visit reads the Wrap up as stored, so a Submit again keeps what was not changed.
    const view = await loadRespondent(link.token, device, now);
    expect(view.kind === "ready" ? view.wrap : null).toEqual({ confidence: 4, signed: false, closingAnswer: "All good", missing: { text: "Mileage from addresses", area: "Submitting", value: "S" } });
    // Again, later, without the missing item: the same response, the first time kept.
    const later = new Date("2026-10-06T08:30:00Z");
    expect(await submitResponse(link.token, device, { response: rid, confidence: 5, signedOff: true, missing: null }, BASE, later, send)).toEqual({ submittedAt: later, name: "Ana", receipt: null });
    const again = (await responses.get(a.ws, rid))!;
    expect([again.submittedAt?.toISOString(), again.firstSubmittedAt?.toISOString(), again.confidence, again.closingAnswer]).toEqual([later.toISOString(), now.toISOString(), 5, null]);
    expect(await missingItems.forResponse(a.ws, row.id)).toEqual([]);
    expect((await responses.list(a.ws)).filter((r) => r.inviteId === link.id)).toHaveLength(1);
    // Another workspace reads and writes nothing of it: no missing item, no change to the row.
    expect(await missingItems.forResponse(b.ws, row.id)).toEqual([]);
    expect(await responses.submit(b.ws, link.id, row.id, { confidence: 1, closingAnswer: "x", signOffText: "x", missing: { text: "x", area: null, value: null } }, () => true, () => null, later)).toBeNull();
    // Through an invite of B's own, past the invite's lock: the response row of A is not found.
    const { link: bLink } = await publishedProjectIn(b, "Submit B");
    expect(await responses.submit(b.ws, bLink.id, row.id, { confidence: 1, closingAnswer: "x", signOffText: "x", missing: { text: "x", area: null, value: null } }, () => true, () => null, later)).toBeNull();
    expect(await responses.saveWrap(b.ws, bLink.id, row.id, { confidence: 1, closingAnswer: "x", missing: { text: "x", area: null, value: null } }, () => true, later)).toBeNull();
    expect((await responses.get(a.ws, row.id))?.confidence).toBe(5);
    expect(await responses.get(b.ws, row.id)).toBeNull();
    // Under the response's lock, the check sees the answers as stored; its sentence refuses.
    expect(await responses.submit(a.ws, link.id, row.id, { confidence: 1, closingAnswer: null, signOffText: "x", missing: null }, () => true, (rows) => (rows.length === 2 ? "seen" : null), later)).toEqual({ invalid: "seen" });
    expect((await responses.get(a.ws, row.id))?.confidence).toBe(5);
    // A revoked link takes nothing more.
    const revoked = await revokeLink(a.ws, project.id, instrument.id, link.id, later);
    if (!("invite" in revoked)) throw new Error(revoked.error);
    expect(await submitResponse(link.token, device, { response: rid, confidence: 2, signedOff: true }, BASE, later, send)).toEqual({ status: 410, error: "revoked" });
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
    const first = await submitResponse(ana.token, {}, { response: rid, confidence: 3, signedOff: true }, BASE, now, send);
    if ("status" in first) throw new Error(first.error);
    expect([first.submittedAt, first.name]).toEqual([now, "Ana"]);
    // The receipt goes after the reply (the route runs it with after()).
    expect(sent).toEqual([]);
    await first.receipt?.();
    expect(sent.map((m) => [m.to, m.subject])).toEqual([["ana@x.example", "Your answers on Submit personal were submitted"]]);
    expect(sent[0].text).toContain("2 items answered. 1 with a different priority, 0 not needed, 1 marked unclear, 0 missing items suggested. Confidence 3 of 5.");
    expect(sent[0].text).toContain(`${BASE}/r/${ana.token}`);
    expect(sent[0].text).not.toContain("Later");
    // A second Submit sends none; the Done page is its receipt.
    const second = await submitResponse(ana.token, {}, { response: rid, confidence: 4, signedOff: true }, BASE, new Date("2026-10-05T13:00:00Z"), send);
    expect("receipt" in second ? second.receipt : "refused").toBeNull();
  }, 60_000);

  it("takes JSON only on the route and reads the device cookie", async () => {
    const { link, one, two } = await publishedProject("Submit route");
    const started = await startResponse(link.token, {}, { fields: { name: "Bo" } }, now);
    if ("status" in started) throw new Error(started.error);
    const device = { device: started.device! };
    await save(link.token, device, started.response.id, { itemId: one.id, picked: "M" }, new Date());
    await save(link.token, device, started.response.id, { itemId: two.id, picked: "S" }, new Date());
    const post = (body: string, type = "application/json") => submitRoute(new Request(`${BASE}/r/${link.token}/submit`, { method: "POST", body, headers: { "content-type": type, cookie: `${DEVICE_COOKIE}=${started.device}` } }), { params: Promise.resolve({ token: link.token }) });
    expect((await post("confidence=3", "application/x-www-form-urlencoded")).status).toBe(415);
    const ok = await post(JSON.stringify({ response: started.response.id, confidence: 3, signedOff: true }));
    expect(ok.status).toBe(200);
    const reply = await ok.json();
    expect([typeof reply.submittedAt, reply.name]).toEqual(["string", "Bo"]);
  }, 60_000);
});
