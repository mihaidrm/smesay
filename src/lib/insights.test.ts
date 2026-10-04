// Write actions (stories/E9-1) on the test database, against a fetch that answers in place of
// the API (no real model call, decision 0039). The prompt: refs for items, respondents,
// answers and missing items, the dropdown fields and no name or email, only submitted
// responses (decision 0030). The run: an action citing an unknown ref is dropped, the kept ones
// replace the open actions while done and dismissed stay (acceptance 4), the tokens and cost
// add up to the run; the citations resolve to names as on Results; the sample is refused,
// another workspace cannot write or read them. Pure parts: keptActions, share, citationLines.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { aiRuns, answers, invites, items, missingItems, projects, responses, workspaces } from "@/db/queries";
import { results } from "@/db/queries/results";
import { insights } from "@/db/queries/insights";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { costEurCents, DEFAULT_MODEL, estimateCents, formatEur } from "@/lib/ai/prices";
import { internal } from "@/db/queries/internal";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { commitUpload } from "@/lib/imports";
import { ACTIONS_EXPECTED_OUTPUT, citationLines, keptActions, setActionState, share, writeActions } from "@/lib/insights";
import { sameAction } from "@/db/queries/insights";
import { openDraft, saveFields } from "@/lib/instruments";
import type { ResultsFilter } from "@/lib/results-filter";

const COUNTED_VIEW: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null, split: null, gaps: null };
import { memoryOutbox } from "@/lib/mail";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let a: { ws: WorkspaceId; userId: string }; let b: { ws: WorkspaceId; userId: string };

async function signIn(label: string) {
  const email = `${label}-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, headers };
}

beforeAll(async () => {
  await prepareTestDatabase();
  process.env.ANTHROPIC_API_KEY = "test-key-for-the-fake-transport";
  process.env.ANTHROPIC_MONTHLY_BUDGET_EUR = "100000";
  const sa = await signIn("actions-a");
  a = { ws: await requireWorkspace(sa.headers, (await createWorkspaceWithSample({ name: "Actions A", slug: `actions-a-${randomUUID()}` }, sa.id)).id), userId: sa.id };
  const sb = await signIn("actions-b");
  b = { ws: await requireWorkspace(sb.headers, (await createWorkspaceWithSample({ name: "Actions B", slug: `actions-b-${randomUUID()}` }, sb.id)).id), userId: sb.id };
}, 60_000);

// A PM's project with three items, a public link, two submitted responses (Ana in Sales,
// Bo in Finance) and one not submitted, a missing item from Bo.
async function answeredProject() {
  const project = await projects.create(a.ws, { name: "Expense tool", createdBy: a.userId });
  const pasted = await savePaste({ ws: a.ws, userId: a.userId }, project.id, ["Receipts by phone | Submitting | Must", "Policy flags | Submitting | Should", "Advances | Paying | Could"].join("\n"));
  if (!("upload" in pasted)) throw new Error(pasted.error);
  await commitUpload(a.ws, pasted.upload.id, a.userId);
  const { instrument } = (await openDraft(a.ws, project))!;
  const fields = await saveFields(a.ws, project.id, instrument.id, JSON.stringify([{ label: "Name", type: "text", mandatory: true }, { label: "Team", type: "dropdown", mandatory: true, options: "Sales\nFinance" }]));
  if (!("instrument" in fields)) throw new Error(fields.error);
  const rows = await items.forSet(a.ws, instrument.itemSetId);
  // A pasted list has no references; the second item gets one, the others stay without.
  await items.update(a.ws, rows[1].id, { sourceRef: "CL-02" });
  const link = await invites.create(a.ws, { instrumentId: instrument.id, kind: "public", token: randomUUID().replace(/-/g, "") });
  const respond = async (name: string, team: string, submitted: boolean) => responses.create(a.ws, { instrumentId: instrument.id, itemSetId: instrument.itemSetId, inviteId: link.id, deviceToken: randomUUID().replace(/-/g, ""), fields: { name, team }, signedOff: submitted, submittedAt: submitted ? new Date() : null, firstSubmittedAt: submitted ? new Date() : null });
  const ana = await respond("Ana Pop", "Sales", true);
  const bo = await respond("Bo Lind", "Finance", true);
  const cy = await respond("Cy Draft", "Sales", false);
  const answer = (responseId: string, itemId: string, kind: "agree" | "change" | "disagree" | "unclear", value: string | null, reason: string | null) => answers.create(a.ws, { responseId, itemSetId: instrument.itemSetId, itemId, kind, value, reason });
  const anaFlags = await answer(ana.id, rows[1].id, "change", "M", "Sales loses deals over late claims.");
  const boFlags = await answer(bo.id, rows[1].id, "disagree", null, "Finance checks this already.");
  await answer(ana.id, rows[0].id, "agree", "M", null);
  await answer(cy.id, rows[2].id, "unclear", null, "UNSUBMITTED QUESTION");
  const missing = await missingItems.create(a.ws, { responseId: bo.id, text: "Mileage from addresses.", suggestedArea: "Submitting" });
  return { project, instrument, rows, anaFlags, boFlags, missing };
}

type Out = { actions: { kind: string; title: string; why: string; answers: string[]; missing: string[] }[] };
function transport(build: (data: string) => Out) {
  const calls: { system: string; data: string; format: unknown }[] = [];
  const fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    const data = body.messages[0].content[0].text as string;
    calls.push({ system: body.system[0].text, data, format: body.output_config?.format });
    const message = { id: "msg_test", type: "message", role: "assistant", model: DEFAULT_MODEL, content: [{ type: "text", text: JSON.stringify(build(data)) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 1001, output_tokens: 301, cache_creation_input_tokens: null, cache_read_input_tokens: null } };
    return new Response(JSON.stringify(message), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof globalThis.fetch;
  return { fetch, calls };
}
const fourAndABadOne = (): Out => ({
  actions: [
    { kind: "conflict", title: "Settle CL-02 with Sales and Finance.", why: "Sales wants it higher; Finance says it is not needed.", answers: ["A1", "A2"], missing: [] },
    { kind: "rewrite", title: "Rewrite CL-02.", why: "Read two ways.", answers: ["A1"], missing: [] },
    { kind: "followUp", title: "Ask Finance how it checks.", why: "One answer says Finance checks already.", answers: ["A2"], missing: [] },
    { kind: "coverage", title: "Consider mileage from addresses.", why: "Suggested as missing.", answers: [], missing: ["M1"] },
    { kind: "rewrite", title: "Cites an answer never sent.", why: "Dropped.", answers: ["A9"], missing: [] },
    { kind: "rewrite", title: "Cites nothing.", why: "Dropped.", answers: [], missing: [] },
  ],
});

describe("writeActions", () => {
  it("sends refs and dropdown fields, no names, only submitted answers; keeps the actions that cite what was sent", async () => {
    const p = await answeredProject();
    const { fetch, calls } = transport(fourAndABadOne);
    const runsBefore = await aiRuns.count(a.ws);
    const result = await writeActions(a, p.project.id, { fetch });
    if (!("written" in result)) throw new Error(result.error);
    expect(calls).toHaveLength(1);
    const { data, system } = calls[0];
    expect(system).toContain("Write at most 8 actions");
    expect(system).not.toContain("Expense tool");
    expect(data).toContain("[I2] CL-02 (area: Submitting) Policy flags (proposed: Should). Answers: 0 agree, 1 different priority, 1 disagree, 0 unclear; 2 could see it.");
    expect(data).toContain("[A1] R1 on I2: different priority, Must: Sales loses deals over late claims.");
    expect(data).toContain("[A2] R2 on I2: not needed: Finance checks this already.");
    expect(data).toContain("[R1] Team: Sales");
    expect(data).toContain("[M1] R2: Mileage from addresses. (area: Submitting)");
    expect(data).not.toMatch(/Ana|Bo Lind|Cy Draft|UNSUBMITTED/);
    expect(result.written.map((w) => w.kind)).toEqual(["conflict", "rewrite", "followUp", "coverage"]);
    expect(result.written[0].citedAnswerIds.sort()).toEqual([p.anaFlags.id, p.boFlags.id].sort());
    expect(result.written[3].citedMissingItemIds).toEqual([p.missing.id]);
    expect(await aiRuns.count(a.ws)).toBe(runsBefore + 1);
    const run = (await aiRuns.list(a.ws)).sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())[0];
    expect(run.purpose).toBe("insights");
    const sum = (k: "tokensIn" | "tokensOut" | "costEurCents") => result.written.reduce((n, w) => n + (w[k] ?? 0), 0);
    expect([sum("tokensIn"), sum("tokensOut"), sum("costEurCents")]).toEqual([run.tokensIn, run.tokensOut, run.costEurCents]);

    // The tab's citations: names as on Results, grouped by item.
    const listed = await insights.listWithCitations(a.ws, p.project.id);
    expect(citationLines(listed[0].answers, listed[0].missing, (n) => `Anonymous ${n}`).map((c) => c.text)).toEqual(["Ana Pop and Bo Lind on CL-02"]);
    expect(citationLines(listed[3].answers, listed[3].missing, (n) => `Anonymous ${n}`)).toEqual([{ text: "Bo Lind, missing item", itemId: null }]);

    // Write again: the open ones are replaced, a done and a dismissed one stay.
    await insights.setState(a.ws, p.project.id, listed[0].id, "open", "done", a.userId);
    await insights.setState(a.ws, p.project.id, listed[1].id, "open", "dismissed", a.userId);
    const again = await writeActions(a, p.project.id, { fetch: transport(fourAndABadOne).fetch });
    // The done and the dismissed one are not written again (E9-2).
    expect("written" in again && again.written).toHaveLength(2);
    const after = await insights.listWithCitations(a.ws, p.project.id);
    expect(after.map((r) => r.state)).toEqual(["open", "open", "done", "dismissed"]);
    expect(after.slice(2).map((r) => r.id)).toEqual([listed[0].id, listed[1].id]);
  });

  it("refuses the sample and another workspace's project, and shows nothing across workspaces", async () => {
    const sample = (await projects.list(a.ws)).find((p) => p.isSample)!;
    const { fetch, calls } = transport(fourAndABadOne);
    expect(await writeActions(a, sample.id, { fetch })).toEqual({ error: ACTIONS_COPY.sampleRefused, retry: false });
    const p = await answeredProject();
    await expect(writeActions(b, p.project.id, { fetch })).rejects.toBeInstanceOf(NotFoundError);
    await expect(writeActions({ ws: a.ws, userId: b.userId }, p.project.id, { fetch })).rejects.toBeInstanceOf(NotFoundError);
    expect(calls).toHaveLength(0);
    await writeActions(a, p.project.id, { fetch });
    expect(await insights.listWithCitations(b.ws, p.project.id)).toEqual([]);
    expect((await insights.listWithCitations(a.ws, p.project.id)).length).toBe(4);
  });
});

describe("after the audit", () => {
  it("keeps the open actions when a run keeps none, and hides an action whose citations are gone", async () => {
    const p = await answeredProject();
    await writeActions(a, p.project.id, { fetch: transport(fourAndABadOne).fetch });
    const none = await writeActions(a, p.project.id, { fetch: transport(() => ({ actions: [{ kind: "rewrite", title: "Unknown.", why: "Unknown.", answers: ["A99"], missing: [] }] })).fetch });
    expect(none).toEqual({ written: [] });
    expect(await insights.listWithCitations(a.ws, p.project.id)).toHaveLength(4);
    // The missing item is cleared: the coverage action citing only it is no longer shown or counted.
    await missingItems.remove(a.ws, p.missing.id);
    const listed = await insights.listWithCitations(a.ws, p.project.id);
    expect(listed.map((r) => r.kind)).toEqual(["conflict", "rewrite", "followUp"]);
    const numbers = await results.numbers(a.ws, p.instrument.id, COUNTED_VIEW);
    expect(numbers?.actions).toBe(3);
  });

  it("never sends the name field, even as a dropdown of names", async () => {
    const p = await answeredProject();
    const named = await saveFields(a.ws, p.project.id, p.instrument.id, JSON.stringify([{ label: "Name", type: "dropdown", mandatory: true, options: "Ana Pop\nBo Lind" }, { label: "Team", type: "dropdown", mandatory: true, options: "Sales\nFinance" }]));
    if (!("instrument" in named)) throw new Error(named.error);
    const { fetch, calls } = transport(fourAndABadOne);
    await writeActions(a, p.project.id, { fetch });
    expect(calls[0].data).toContain("[R1] Team: Sales");
    expect(calls[0].data).not.toMatch(/Ana Pop|Bo Lind|Name:/);
  });

  it("reads and writes nothing across workspaces at the query layer", async () => {
    const p = await answeredProject();
    expect(await insights.inputFor(b.ws, p.instrument.id)).toEqual({ answers: [], missing: [] });
    await expect(insights.replaceOpen(b.ws, p.project.id, [{ kind: "rewrite", title: "T.", why: "W.", citedAnswerIds: [p.anaFlags.id], citedMissingItemIds: [], model: "m", tokensIn: 1, tokensOut: 1, costEurCents: 0 }])).rejects.toThrow();
  });
});

// E9-2: Mark done, Dismiss and Reopen; a new run never brings a dismissed action back.
describe("setActionState", () => {
  it("marks done and dismissed with the date and the person, reopens, and refuses what is not the project's", async () => {
    const p = await answeredProject();
    await writeActions(a, p.project.id, { fetch: transport(fourAndABadOne).fetch });
    const [first, second, third] = await insights.listWithCitations(a.ws, p.project.id);
    const at = new Date("2026-10-05T09:30:00Z");
    const done = await setActionState(a, p.project.id, first.id, "open", "done", at);
    expect("insight" in done && [done.insight.state, done.insight.closedAt?.toISOString(), done.insight.closedBy]).toEqual(["done", at.toISOString(), a.userId]);
    await setActionState(a, p.project.id, second.id, "open", "dismissed", at);
    // A stale tab: the page still shows it open, another member dismissed it.
    expect(await setActionState(a, p.project.id, second.id, "open", "done")).toEqual({ error: ACTIONS_COPY.gone });
    const reopened = await setActionState(a, p.project.id, second.id, "dismissed", "open");
    expect("insight" in reopened && [reopened.insight.state, reopened.insight.closedAt, reopened.insight.closedBy]).toEqual(["open", null, null]);
    expect(await setActionState(a, p.project.id, third.id, "open", "archived")).toEqual({ error: ACTIONS_COPY.badState });
    expect(await setActionState(a, p.project.id, third.id, "open", "open")).toEqual({ error: ACTIONS_COPY.badState });
    expect(await setActionState(a, p.project.id, randomUUID(), "open", "done")).toEqual({ error: ACTIONS_COPY.gone });
    // Another workspace cannot see the project; another project's action is not this one's.
    await expect(setActionState(b, p.project.id, third.id, "open", "done")).rejects.toBeInstanceOf(NotFoundError);
    const other = await answeredProject();
    expect(await setActionState(a, other.project.id, third.id, "open", "done")).toEqual({ error: ACTIONS_COPY.gone });
    // At the query layer: workspace B with A's ids, and B's own project with A's action.
    expect(await insights.setState(b.ws, p.project.id, third.id, "open", "done", b.userId)).toBeNull();
    const bProject = await projects.create(b.ws, { name: "B's own", createdBy: b.userId });
    expect(await insights.setState(b.ws, bProject.id, third.id, "open", "done", b.userId)).toBeNull();
    expect((await insights.get(a.ws, third.id))?.state).toBe("open");
    const sample = (await projects.list(a.ws)).find((x) => x.isSample)!;
    const seeded = (await insights.listWithCitations(a.ws, sample.id))[0];
    expect(await setActionState(a, sample.id, seeded.id, "open", "done")).toEqual({ error: ACTIONS_COPY.sampleState });
    // The tab counts the open ones only (E8-1 numbers).
    expect((await results.numbers(a.ws, p.instrument.id, COUNTED_VIEW))?.actions).toBe(3);
  });

  it("does not write again an action matching a done or a dismissed one", async () => {
    const p = await answeredProject();
    await writeActions(a, p.project.id, { fetch: transport(fourAndABadOne).fetch });
    const listed = await insights.listWithCitations(a.ws, p.project.id);
    await setActionState(a, p.project.id, listed[0].id, "open", "dismissed");
    await setActionState(a, p.project.id, listed[2].id, "open", "done");
    const again = await writeActions(a, p.project.id, { fetch: transport(fourAndABadOne).fetch });
    expect("written" in again && again.written.map((w) => w.kind)).toEqual(["rewrite", "coverage"]);
    const after = await insights.listWithCitations(a.ws, p.project.id);
    expect(after.map((r) => `${r.state}:${r.kind}`)).toEqual(["open:rewrite", "open:coverage", "done:followUp", "dismissed:conflict"]);
  });

  it("leaves the open actions when every new action matches a closed one", async () => {
    const p = await answeredProject();
    await writeActions(a, p.project.id, { fetch: transport(fourAndABadOne).fetch });
    const listed = await insights.listWithCitations(a.ws, p.project.id);
    await setActionState(a, p.project.id, listed[0].id, "open", "done");
    await setActionState(a, p.project.id, listed[1].id, "open", "dismissed");
    const onlyClosed = () => ({ actions: fourAndABadOne().actions.slice(0, 2) });
    expect(await writeActions(a, p.project.id, { fetch: transport(onlyClosed).fetch })).toEqual({ written: [] });
    const after = await insights.listWithCitations(a.ws, p.project.id);
    expect(after.map((r) => r.id)).toEqual([listed[2].id, listed[3].id, listed[0].id, listed[1].id]);
  });

  it("matches by kind and the sets of citations, in any order", () => {
    const base = { kind: "conflict" as const, citedAnswerIds: ["a", "b"], citedMissingItemIds: [] };
    expect(sameAction(base, { ...base, citedAnswerIds: ["b", "a", "a"] })).toBe(true);
    expect(sameAction(base, { ...base, kind: "rewrite" })).toBe(false);
    expect(sameAction(base, { ...base, citedAnswerIds: ["a"] })).toBe(false);
    expect(sameAction(base, { ...base, citedMissingItemIds: ["m"] })).toBe(false);
  });
});

describe("the pure parts", () => {
  const refs = new Map([["A1", "id-1"], ["A2", "id-2"]]);
  const missing = new Map([["M1", "m-1"]]);
  it("keeps an action only when it cites at least one known ref", () => {
    const kept = keptActions({ actions: [
      { kind: "rewrite", title: " Rewrite  CL-01. ", why: "Two  readings.", answers: ["A1", "A1", " A2"], missing: [] },
      { kind: "coverage", title: "Add mileage.", why: "Missing.", answers: [], missing: ["M1"] },
      { kind: "rewrite", title: "Bad.", why: "Unknown.", answers: ["A1", "A3"], missing: [] },
      { kind: "rewrite", title: "Bad.", why: "Unknown missing.", answers: [], missing: ["M2"] },
      { kind: "rewrite", title: "Empty.", why: "Nothing cited.", answers: [], missing: [] },
    ] }, refs, missing);
    expect(kept).toEqual([
      { kind: "rewrite", title: "Rewrite CL-01.", why: "Two readings.", citedAnswerIds: ["id-1", "id-2"], citedMissingItemIds: [] },
      { kind: "coverage", title: "Add mileage.", why: "Missing.", citedAnswerIds: [], citedMissingItemIds: ["m-1"] },
    ]);
  });
  it("shares a total so the parts add up, the rest on the first", () => {
    expect(share(10, 3)).toEqual([4, 3, 3]);
    expect(share(0, 2)).toEqual([0, 0]);
    expect(share(5, 0)).toEqual([]);
  });
  it("names the people by item, with and between the last two", () => {
    const lines = citationLines([
      { itemId: "i1", reference: "CL-01", title: "Receipts", who: "Ana", anon: null },
      { itemId: "i1", reference: "CL-01", title: "Receipts", who: null, anon: 2 },
      { itemId: "i1", reference: "CL-01", title: "Receipts", who: "Bo", anon: null },
      { itemId: "i2", reference: null, title: "Approval from the notification email on the phone", who: "Ana", anon: null },
      { itemId: "i3", reference: null, title: "Limits", who: "Bo", anon: null },
    ], [{ who: null, anon: 1 }], (n) => `Anonymous ${n}`);
    expect(lines).toEqual([
      { text: "Ana, Anonymous 2 and Bo on CL-01", itemId: "i1" },
      { text: "Ana on \"Approval from the notification email on...\"", itemId: "i2" },
      { text: "Bo on \"Limits\"", itemId: "i3" },
      { text: "Anonymous 1, missing item", itemId: null },
    ]);
  });
});

// E9-3: the estimate in front of a refusal for the budget or the product cap, no call made;
// the last run and the month's spend for the cost line, scoped to the workspace.
describe("the cost of a run", () => {
  it("prices the input at four characters a token and the expected output", () => {
    expect(estimateCents(DEFAULT_MODEL, "x".repeat(4_000), ACTIONS_EXPECTED_OUTPUT)).toBe(costEurCents(DEFAULT_MODEL, 1_000, 1_500));
    expect(formatEur(5)).toBe("EUR 0.05");
    expect(formatEur(1234)).toBe("EUR 12.34");
  });

  it("puts the estimate in front of a budget or a cap refusal and calls nothing", async () => {
    const p = await answeredProject();
    // A run first, to read the prompt and schema the refused runs would send: the estimate
    // shown is theirs at four characters a token plus the 1,500 output tokens expected.
    const first = transport(fourAndABadOne);
    await writeActions(a, p.project.id, { fetch: first.fetch });
    const sent = first.calls[0];
    const shown = formatEur(estimateCents(DEFAULT_MODEL, sent.system + sent.data + JSON.stringify(sent.format), ACTIONS_EXPECTED_OUTPUT));
    const { fetch, calls } = transport(fourAndABadOne);
    const budgetBefore = (await workspaces.getById(a.ws))!.aiBudgetEur;
    const capBefore = process.env.ANTHROPIC_MONTHLY_BUDGET_EUR;
    await internal.setAiBudgetEur(a.ws, 0);
    try {
      const budget = await writeActions(a, p.project.id, { fetch });
      expect("error" in budget && budget.error).toMatch(new RegExp(`^This run would cost about ${shown.replace(".", "\\.")}\\. This workspace has used its AI budget for the month\\.`));
    } finally {
      await internal.setAiBudgetEur(a.ws, budgetBefore);
    }
    process.env.ANTHROPIC_MONTHLY_BUDGET_EUR = "0";
    try {
      const paused = await writeActions(a, p.project.id, { fetch });
      expect("error" in paused && paused.error).toMatch(new RegExp(`^This run would cost about ${shown.replace(".", "\\.")}\\. AI is paused until next month\\.`));
    } finally {
      process.env.ANTHROPIC_MONTHLY_BUDGET_EUR = capBefore;
    }
    expect(calls).toHaveLength(0);
  });

  it("reads the project's last run of Write actions, and nothing across workspaces", async () => {
    const p = await answeredProject();
    expect(await aiRuns.lastFor(a.ws, p.project.id, "insights")).toBeNull();
    await writeActions(a, p.project.id, { fetch: transport(fourAndABadOne).fetch });
    const last = await aiRuns.lastFor(a.ws, p.project.id, "insights");
    expect(last && [last.tokensIn, last.tokensOut, last.costEurCents]).toEqual([1001, 301, costEurCents(DEFAULT_MODEL, 1001, 301)]);
    expect(await aiRuns.lastFor(b.ws, p.project.id, "insights")).toBeNull();
    expect(await aiRuns.lastFor(a.ws, p.project.id, "shape")).toBeNull();
    // A later call the provider did not answer (a row with no tokens) is not the run shown.
    await aiRuns.create(a.ws, { projectId: p.project.id, purpose: "insights", model: DEFAULT_MODEL, tokensIn: 0, tokensOut: 0, costEurCents: 0 });
    expect((await aiRuns.lastFor(a.ws, p.project.id, "insights"))?.id).toBe(last!.id);
  });
});
