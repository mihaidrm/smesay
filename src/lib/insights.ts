// Write actions (stories/E9-1): the model reads the project's items with their counts, the
// answers that carry a reason or a question and the missing items (src/lib/ai/prompts/
// insights.ts), and returns actions that cite them by ref. An action is kept only when every
// ref it cites was in the data and it cites at least one (acceptance 2 and 3); the kept ones
// replace the project's open actions, the done and dismissed ones stay (acceptance 4, E9-2).
// runModel logs the ai_run with purpose "insights" and refuses the sample (E8-8, E9-1
// acceptance 7). The run's tokens and cost are shared out over the actions it wrote (the
// rest on the first), so the actions of a run add up to the run.
import { instruments, projects } from "@/db/queries";
import { agreement } from "@/db/queries/results";
import { insights, type Insight } from "@/db/queries/insights";
import { INSIGHT_STATES, type InsightKind, type InsightState } from "@/db/types";
import { INPUT_CHARS_MAX, runModel, type RunDeps } from "@/lib/ai/client";
import { contextOf } from "@/lib/ai/context";
import { InsightOutput } from "@/lib/ai/insights-schema";
import { formatEur } from "@/lib/ai/prices";
import { buildActionsPrompt, type ActionsAnswer } from "@/lib/ai/prompts/insights";
import { namesShown } from "@/lib/anonymity";
import { NotFoundError } from "@/lib/errors";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { requireRole, type Actor } from "@/lib/members";
import { itemsFor } from "@/lib/respondent";
import type { ResultsFilter } from "@/lib/results-filter";
import { labelFor, scaleFor } from "@/lib/scoring";
import { track } from "@/lib/analytics";
import { log } from "@/lib/log";


// Every counted answer under the default view: submitted responses only (decision 0030).
const COUNTED: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null, split: null, gaps: null };

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
  const counts = new Map((await agreement.byItem(actor.ws, instrument.id, COUNTED)).map((c) => [c.itemId, c]));
  const input = await insights.inputFor(actor.ws, instrument.id);
  if (input.answers.length === 0) return { error: ACTIONS_COPY.emptyNoAnswers, retry: false };
  // The dropdown fields, except the name field even when the PM made it a dropdown of names:
  // the model sees groups, never a person (note 66). Under Names hidden and Anonymous
  // (stories/E5-7, acceptance 6) no field at all: each respondent is a bare R ref, and the
  // prompt's text and shape stay as they are.
  const groups = namesShown(instrument.anonymity) ? instrument.respondentFields.filter((f) => f.type === "dropdown" && f.key !== "name") : [];
  const respondents = new Map<string, Record<string, string>>();
  for (const r of [...input.answers, ...input.missing]) if (!respondents.has(r.responseId)) respondents.set(r.responseId, Object.fromEntries(groups.map((g) => [g.label, r.fields[g.key] ?? ""])));
  // E5-7 (amended 2026-10-06): under the two levels an item fewer than 3 counted people could
  // see is read as "Fewer than 3 answers" everywhere (agreement.byItem few), so the model reads
  // none of its answers and no action can cite them.
  const few = new Set([...counts.values()].filter((c) => c.few).map((c) => c.itemId));
  const answers: ActionsAnswer[] = input.answers.flatMap((a) => (!few.has(a.itemId) && (a.kind === "change" || a.kind === "disagree" || a.kind === "unclear") ? [{ id: a.id, itemId: a.itemId, respondent: a.responseId, kind: a.kind, value: a.value, text: a.reason ?? a.comment }] : []));
  const prompt = buildActionsPrompt({
    items: items.map((it) => { const c = counts.get(it.id); return { id: it.id, reference: it.reference, area: it.area, text: it.title, proposed: it.proposed, counts: { agree: c?.agree ?? 0, change: c?.change ?? 0, disagree: c?.disagree ?? 0, unclear: c?.unclear ?? 0, rated: c?.pick ?? 0, couldSee: c?.couldSee ?? 0 } }; }),
    answers,
    missing: input.missing.map((m) => ({ id: m.id, respondent: m.responseId, text: m.text, area: m.area, value: m.value })),
    respondents: [...respondents].map(([key, g]) => ({ key, groups: g })),
    scale: scaleFor(instrument.method, instrument.scaleLabels).map((v) => v.label),
    labelOf: (code) => labelFor(instrument.method, instrument.scaleLabels, code) ?? code ?? "",
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
  const kept = keptActions(result.output, prompt.answerRefs, prompt.missingRefs);
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
