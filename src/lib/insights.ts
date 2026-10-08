// Write actions (stories/E9-1): the model reads the project's items with their counts, the
// answers that carry a reason or a question and the missing items (src/lib/ai/prompts/
// insights.ts), and returns actions that cite them by ref. An action is kept only when every
// ref it cites was in the data and it cites at least one (acceptance 2 and 3); the kept ones
// replace the project's open actions, the done and dismissed ones stay (acceptance 4, E9-2).
// An action also needs enough people behind it (design note 123; Mihai, 2026-10-08: "If 100
// ppl answer and just 1 doesnt agree with something doesnt mean we make it as an action
// item"): at least one in ten of those who answered the item it cites, one person when ten
// or fewer answered, a missing item weighed against everyone who submitted (peopleNeeded,
// supportedActions). The prompt tells the model the same rule with the number per item.
// runModel logs the ai_run with purpose "insights" and refuses the sample (E8-8, E9-1
// acceptance 7). The run's tokens and cost are shared out over the actions it wrote (the
// rest on the first), so the actions of a run add up to the run.
import { instruments, items as itemRows, projects } from "@/db/queries";
import { agreement, results } from "@/db/queries/results";
import { insights, type Insight } from "@/db/queries/insights";
import { INSIGHT_STATES, type InsightKind, type InsightState } from "@/db/types";
import { INPUT_CHARS_MAX, runModel, type RunDeps } from "@/lib/ai/client";
import { contextOf } from "@/lib/ai/context";
import { InsightOutput } from "@/lib/ai/insights-schema";
import { formatEur } from "@/lib/ai/prices";
import { buildActionsPrompt, type ActionsAnswer } from "@/lib/ai/prompts/insights";
import { NotFoundError } from "@/lib/errors";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { requireRole, type Actor } from "@/lib/members";
import { itemsFor } from "@/lib/respondent";
import type { ResultsFilter } from "@/lib/results-filter";
import { labelFor, scaleFor } from "@/lib/scoring";
import { track } from "@/lib/analytics";
import { log } from "@/lib/log";


// Every counted answer under the default view: submitted responses only (decision 0030).
export const COUNTED: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null, split: null, gaps: null };

export type ActionRow = { kind: InsightKind; title: string; why: string; citedAnswerIds: string[]; citedMissingItemIds: string[] };

// The actions worth keeping: every cited ref known, at least one cited (acceptance 2 and 3).
export function keptActions(output: InsightOutput, answerRefs: Map<string, string>, missingRefs: Map<string, string>): ActionRow[] {
  const kept: ActionRow[] = [];
  for (const a of output.actions) {
    const answers = [...new Set(a.answers.map((r) => r.trim()))];
    const missing = [...new Set(a.missing.map((r) => r.trim()))];
    if (answers.length + missing.length === 0) continue;
    if (answers.some((r) => !answerRefs.has(r)) || missing.some((r) => !missingRefs.has(r))) continue;
    const title = a.title.replace(/\s+/g, " ").trim();
    const why = a.why.replace(/\s+/g, " ").trim();
    if (!title || !why) continue;
    kept.push({ kind: a.kind, title, why, citedAnswerIds: answers.map((r) => answerRefs.get(r)!), citedMissingItemIds: missing.map((r) => missingRefs.get(r)!) });
  }
  return kept;
}

// The support rule (design note 123): one in ten of those who answered, at least one.
export const SUPPORT_SHARE = 10;
export const peopleNeeded = (answered: number): number => Math.max(1, Math.ceil(answered / SUPPORT_SHARE));

// The order the Actions tab shows the kinds in (Mihai, 2026-10-08: "Follow up, Rewrite etc").
export const KIND_ORDER: InsightKind[] = ["followUp", "rewrite", "conflict", "coverage"];

// What supportedActions weighs an action against: who gave each cited answer and missing
// item, which item each answer is on, how many answered each item, how many submitted.
export type Support = {
  answerRespondent: Map<string, string>;
  answerItem: Map<string, string>;
  missingRespondent: Map<string, string>;
  answeredByItem: Map<string, number>;
  submitted: number;
};

// The people behind an action are the distinct respondents of what it cites; the line it
// must reach is one in ten of the most-answered item it cites (of everyone who submitted
// when it cites a missing item), one person when ten or fewer. An action citing an answer
// or missing item that supplies no respondent counts nobody for it.
export function supportedActions(actions: ActionRow[], s: Support): ActionRow[] {
  return actions.filter((a) => {
    const people = new Set([...a.citedAnswerIds.map((id) => s.answerRespondent.get(id)), ...a.citedMissingItemIds.map((id) => s.missingRespondent.get(id))].filter((r): r is string => r !== undefined));
    const answered = Math.max(0, ...a.citedAnswerIds.map((id) => s.answeredByItem.get(s.answerItem.get(id) ?? "") ?? 0), ...(a.citedMissingItemIds.length > 0 ? [s.submitted] : []));
    return people.size >= peopleNeeded(answered);
  });
}

// The run's tokens and cost over the actions: equal shares, the rest on the first.
export function share(total: number, n: number): number[] {
  if (n === 0) return [];
  const each = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => each + (i === 0 ? total - each * n : 0));
}

// The output a run is expected to write, for the estimate (E9-3): eight actions of about 150
// tokens each and the JSON around them; the allowance stays 4,000.
export const ACTIONS_EXPECTED_OUTPUT = 1_500;

export type WriteResult = { error: string; retry: boolean } | { written: Insight[] };

export async function writeActions(actor: Actor, projectId: string, deps?: RunDeps): Promise<WriteResult> {
  await requireRole(actor, "results.read");
  const project = await projects.get(actor.ws, projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) return { error: ACTIONS_COPY.sampleRefused, retry: false };
  const instrument = await instruments.latestForProject(actor.ws, project.id);
  if (!instrument) return { error: ACTIONS_COPY.emptyNoAnswers, retry: false };
  const { items } = await itemsFor(actor.ws, { ...instrument, showProposed: true });
  // The context column (E3-3, 2026-10-08) is read from the set's rows: itemsFor is the respondent's
  // shape, which never carries it.
  const contextOfItem = new Map((await itemRows.forSet(actor.ws, instrument.itemSetId)).map((r) => [r.id, r.aiContext]));
  const counts = new Map((await agreement.byItem(actor.ws, instrument.id, COUNTED)).map((c) => [c.itemId, c]));
  const input = await insights.inputFor(actor.ws, instrument.id);
  if (input.answers.length === 0) return { error: ACTIONS_COPY.emptyNoAnswers, retry: false };
  const submitted = (await results.numbers(actor.ws, instrument.id, COUNTED))?.submitted ?? 0;
  // The dropdown fields, except the name field even when the PM made it a dropdown of names:
  // the model sees groups, never a person (note 66).
  const groups = instrument.respondentFields.filter((f) => f.type === "dropdown" && f.key !== "name");
  const respondents = new Map<string, Record<string, string>>();
  for (const r of [...input.answers, ...input.missing]) if (!respondents.has(r.responseId)) respondents.set(r.responseId, Object.fromEntries(groups.map((g) => [g.label, r.fields[g.key] ?? ""])));
  const answers: ActionsAnswer[] = input.answers.flatMap((a) => (a.kind === "change" || a.kind === "disagree" || a.kind === "unclear" ? [{ id: a.id, itemId: a.itemId, respondent: a.responseId, kind: a.kind, value: a.value, text: a.reason ?? a.comment }] : []));
  const prompt = buildActionsPrompt({
    items: items.map((it) => { const c = counts.get(it.id); return { id: it.id, reference: it.reference, area: it.area, text: it.title, proposed: it.proposed, context: contextOfItem.get(it.id) ?? null, counts: { agree: c?.agree ?? 0, change: c?.change ?? 0, disagree: c?.disagree ?? 0, unclear: c?.unclear ?? 0, rated: c?.pick ?? 0, couldSee: c?.couldSee ?? 0 } }; }),
    answers,
    missing: input.missing.map((m) => ({ id: m.id, respondent: m.responseId, text: m.text })),
    respondents: [...respondents].map(([key, g]) => ({ key, groups: g })),
    scale: scaleFor(instrument.method, instrument.scaleLabels).map((v) => v.label),
    labelOf: (code) => labelFor(instrument.method, instrument.scaleLabels, code) ?? code ?? "",
    submitted,
  }, contextOf({ goal: project.contextGoal, terms: project.contextTerms }));
  if (prompt.instructions.length + prompt.data.length > INPUT_CHARS_MAX) return { error: ACTIONS_COPY.tooLong, retry: false };
  // The check refuses nothing: an action citing an unknown ref is dropped, not the run.
  const result = await runModel({ ws: actor.ws, projectId: project.id, purpose: "insights", instructions: prompt.instructions, data: prompt.data, schema: InsightOutput, check: () => null, maxOutputTokens: 4_000, expectedOutputTokens: ACTIONS_EXPECTED_OUTPUT }, deps);
  if (!result.ok) {
    log("error", "Actions did not run.", { project: project.id, reason: result.reason, detail: result.detail });
    // A run refused for the cap or the budget says what it would have cost (E9-3, acceptance 2).
    const cost = result.estimateCents !== undefined ? `${ACTIONS_COPY.estimate(formatEur(result.estimateCents))} ` : "";
    return { error: cost + ACTIONS_COPY.refusals[result.reason], retry: result.reason === "failed" || result.reason === "invalid" };
  }
  const cited = keptActions(result.output, prompt.answerRefs, prompt.missingRefs);
  const kept = supportedActions(cited, {
    answerRespondent: new Map(answers.map((a) => [a.id, a.respondent])),
    answerItem: new Map(answers.map((a) => [a.id, a.itemId])),
    missingRespondent: new Map(input.missing.map((m) => [m.id, m.responseId])),
    answeredByItem: new Map([...counts].map(([id, c]) => [id, c.agree + c.change + c.disagree + c.unclear + c.pick])),
    submitted,
  });
  if (kept.length < cited.length) log("info", "Actions below the support line were dropped.", { project: project.id, count: cited.length - kept.length });
  const ran = () => track("insight_run", { actions: kept.length, costCents: result.run.costEurCents }, { workspaceId: actor.ws, userId: actor.userId });
  // A run that keeps nothing leaves the open actions as they are (the tab says so).
  if (kept.length === 0) { await ran(); return { written: [] }; }
  const tokensIn = share(result.run.tokensIn, kept.length);
  const tokensOut = share(result.run.tokensOut, kept.length);
  const cost = share(result.run.costEurCents, kept.length);
  const written = await insights.replaceOpen(actor.ws, project.id, kept.map((a, i) => ({ ...a, model: result.run.model, tokensIn: tokensIn[i], tokensOut: tokensOut[i], costEurCents: cost[i] })));
  await ran();
  return { written };
}

// Mark done, Dismiss and Reopen (stories/E9-2, acceptance 1 and 2): one of the project's
// actions from the state the page showed to the state asked for, with the date and the person;
// the sample is read-only. An action that is not the project's in this workspace, or no longer
// in the state shown (another tab, a new run), is refused, as is a state that is not one.
const isState = (v: unknown): v is InsightState => typeof v === "string" && (INSIGHT_STATES as readonly string[]).includes(v);
export async function setActionState(actor: Actor, projectId: string, insightId: string, from: unknown, state: unknown, now = new Date()): Promise<{ error: string } | { insight: Insight }> {
  await requireRole(actor, "results.read");
  const project = await projects.get(actor.ws, projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) return { error: ACTIONS_COPY.sampleState };
  if (!isState(from) || !isState(state) || from === state) return { error: ACTIONS_COPY.badState };
  const row = await insights.setState(actor.ws, project.id, insightId, from, state, actor.userId, now);
  return row ? { insight: row } : { error: ACTIONS_COPY.gone };
}

// The citations as the tab shows them (acceptance 1): the answers grouped by item, "[Name] and
// [Name] on [REF]" (three or more: "A, B and C on REF"), each linking to the item's detail
// (E8-5); a missing item as "[Name], missing item". Names as on Results; an item with no
// reference is named by its text in quotes, cut at 40 characters.
export type CitationLine = { text: string; itemId: string | null };
const CITED_TEXT_MAX = 40;
const itemName = (reference: string | null, title: string) => reference ?? `"${title.length > CITED_TEXT_MAX ? `${title.slice(0, CITED_TEXT_MAX).trimEnd()}...` : title}"`;
export function citationLines(answers: { itemId: string; reference: string | null; title: string; who: string | null; anon: number | null }[], missing: { who: string | null; anon: number | null }[], anonymous: (n: number) => string): CitationLine[] {
  const name = (p: { who: string | null; anon: number | null }) => p.who ?? anonymous(p.anon ?? 0);
  const list = (names: string[]) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} ${ACTIONS_COPY.and} ${names.at(-1)}`);
  const byItem = new Map<string, { name: string; names: string[] }>();
  for (const a of answers) {
    const entry = byItem.get(a.itemId) ?? { name: itemName(a.reference, a.title), names: [] };
    if (!entry.names.includes(name(a))) entry.names.push(name(a));
    byItem.set(a.itemId, entry);
  }
  return [
    ...[...byItem].map(([itemId, e]) => ({ text: `${list(e.names)} ${ACTIONS_COPY.on} ${e.name}`, itemId })),
    ...missing.map((m) => ({ text: `${name(m)}, ${ACTIONS_COPY.missingItem}`, itemId: null })),
  ];
}
