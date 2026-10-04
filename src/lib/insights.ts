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
import type { InsightKind } from "@/db/types";
import { INPUT_CHARS_MAX, runModel, type RunDeps } from "@/lib/ai/client";
import { contextOf } from "@/lib/ai/context";
import { InsightOutput } from "@/lib/ai/insights-schema";
import { buildActionsPrompt, type ActionsAnswer } from "@/lib/ai/prompts/insights";
import { NotFoundError } from "@/lib/errors";
import { ACTIONS_COPY } from "@/lib/insights-copy";
import { requireRole, type Actor } from "@/lib/members";
import { itemsFor } from "@/lib/respondent";
import type { ResultsFilter } from "@/lib/results-filter";
import { labelFor, scaleFor } from "@/lib/scoring";


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
  const groups = instrument.respondentFields.filter((f) => f.type === "dropdown");
  const respondents = new Map<string, Record<string, string>>();
  for (const r of [...input.answers, ...input.missing]) if (!respondents.has(r.responseId)) respondents.set(r.responseId, Object.fromEntries(groups.map((g) => [g.label, r.fields[g.key] ?? ""])));
  const answers: ActionsAnswer[] = input.answers.flatMap((a) => (a.kind === "change" || a.kind === "disagree" || a.kind === "unclear" ? [{ id: a.id, itemId: a.itemId, respondent: a.responseId, kind: a.kind, value: a.value, text: a.reason ?? a.comment }] : []));
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
  const result = await runModel({ ws: actor.ws, projectId: project.id, purpose: "insights", instructions: prompt.instructions, data: prompt.data, schema: InsightOutput, check: () => null, maxOutputTokens: 4_000 }, deps);
  if (!result.ok) {
    console.error(`Actions did not run for project ${project.id} (${result.reason}): ${result.detail}.`);
    return { error: ACTIONS_COPY.refusals[result.reason], retry: result.reason === "failed" || result.reason === "invalid" };
  }
  const kept = keptActions(result.output, prompt.answerRefs, prompt.missingRefs);
  const tokensIn = share(result.run.tokensIn, kept.length);
  const tokensOut = share(result.run.tokensOut, kept.length);
  const cost = share(result.run.costEurCents, kept.length);
  const written = await insights.replaceOpen(actor.ws, project.id, kept.map((a, i) => ({ ...a, model: result.run.model, tokensIn: tokensIn[i], tokensOut: tokensOut[i], costEurCents: cost[i] })));
  return { written };
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
