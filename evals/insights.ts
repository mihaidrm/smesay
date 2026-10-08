// The actions eval set (stories/E9-1, acceptance 5): `npm run evals -- insights`. Each spec in
// evals/insights/ is an invented response set (items with their counts, respondents by their
// dropdown fields, the answers that carry a reason or a question, the missing items) and the
// action kinds a good run writes from it. The set goes through the same prompt and client as
// Write actions (src/lib/ai/prompts/insights.ts, src/lib/insights.ts keptActions); a spec
// passes when every expected kind appears among the kept actions and the model wrote no
// action that cites nothing or cites a ref it was not given. Runs in E4-6's throwaway
// workspace, so every call is an ai_run row.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { InsightKind, WorkspaceId } from "@/db/types";
import { usage } from "@/db/queries/usage";
import { runModel, type RunDeps } from "@/lib/ai/client";
import { InsightOutput } from "@/lib/ai/insights-schema";
import { buildActionsPrompt } from "@/lib/ai/prompts/insights";
import { ACTIONS_EXPECTED_OUTPUT, keptActions, supportedActions } from "@/lib/insights";

const HERE = fileURLToPath(new URL(".", import.meta.url));

export type InsightSpec = {
  id: string;
  domain: string;
  scale: string[];
  items: { ref: string; area: string | null; text: string; proposed: string | null; counts: { agree: number; change: number; disagree: number; unclear: number; couldSee: number } }[];
  respondents: { key: string; groups: Record<string, string> }[];
  answers: { item: string; respondent: string; kind: "change" | "disagree" | "unclear"; value: string | null; text: string | null }[];
  missing: { respondent: string; text: string; area: string | null; value: string | null }[];
  expectedKinds: InsightKind[];
  note: string;
};

export function loadInsightSpecs(dir = HERE + "insights"): InsightSpec[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as InsightSpec);
}

export type InsightRun = { id: string; pass: boolean; kinds: InsightKind[]; written: number; kept: number; failures: string[]; costCents: number; model: string; error?: string };

// The prompt for a spec: the item refs stand as ids, the answers and missing items get
// ids of their own, as the app's rows would.
export function promptFor(spec: InsightSpec) {
  return buildActionsPrompt({
    items: spec.items.map((it) => ({ id: it.ref, reference: it.ref, area: it.area, text: it.text, proposed: it.proposed, counts: { ...it.counts, rated: 0 } })),
    answers: spec.answers.map((a, i) => ({ id: `answer-${i + 1}`, itemId: a.item, respondent: a.respondent, kind: a.kind, value: a.value, text: a.text })),
    missing: spec.missing.map((m, i) => ({ id: `missing-${i + 1}`, respondent: m.respondent, text: m.text, area: m.area, value: m.value })),
    respondents: spec.respondents,
    scale: spec.scale,
    labelOf: (code) => code ?? "",
    submitted: spec.respondents.length,
  });
}

// The support line the app applies (design note 123), from the spec's counts: every
// respondent in the spec counts as submitted.
function supportFor(spec: InsightSpec) {
  return {
    answerRespondent: new Map(spec.answers.map((a, i) => [`answer-${i + 1}`, a.respondent])),
    answerItem: new Map(spec.answers.map((a, i) => [`answer-${i + 1}`, a.item])),
    missingRespondent: new Map(spec.missing.map((m, i) => [`missing-${i + 1}`, m.respondent])),
    answeredByItem: new Map(spec.items.map((it) => [it.ref, it.counts.agree + it.counts.change + it.counts.disagree + it.counts.unclear])),
    submitted: spec.respondents.length,
  };
}

export async function runInsightSpec(spec: InsightSpec, ws: WorkspaceId, projectId: string, deps: RunDeps = {}): Promise<InsightRun> {
  const now = deps.now ?? new Date();
  const spentBefore = (await usage(ws, now)).aiCostCentsThisMonth;
  const spent = async () => (await usage(ws, now)).aiCostCentsThisMonth - spentBefore;
  const prompt = promptFor(spec);
  const result = await runModel({ ws, projectId, purpose: "insights", instructions: prompt.instructions, data: prompt.data, schema: InsightOutput, check: () => null, maxOutputTokens: 4_000, expectedOutputTokens: ACTIONS_EXPECTED_OUTPUT }, deps);
  if (!result.ok) return { id: spec.id, pass: false, kinds: [], written: 0, kept: 0, failures: [`refused: ${result.reason}`], costCents: await spent(), model: "", error: `${result.reason}: ${result.detail}` };
  const kept = supportedActions(keptActions(result.output, prompt.answerRefs, prompt.missingRefs), supportFor(spec));
  const kinds = [...new Set(kept.map((a) => a.kind))];
  const failures = [
    ...spec.expectedKinds.filter((k) => !kinds.includes(k)).map((k) => `no ${k} action`),
    ...(kept.length < result.output.actions.length ? [`${result.output.actions.length - kept.length} action(s) uncited or citing an unknown ref`] : []),
  ];
  return { id: spec.id, pass: failures.length === 0, kinds, written: result.output.actions.length, kept: kept.length, failures, costCents: await spent(), model: result.run.model };
}

export const insightLine = (r: InsightRun): string =>
  `${r.id} ${r.pass ? "pass" : "FAIL"}: ${r.kept} of ${r.written} action(s) kept, kinds ${r.kinds.join(", ") || "none"}, ${r.costCents} euro cent(s)${r.failures.length ? `; ${r.failures.join("; ")}` : ""}`;
