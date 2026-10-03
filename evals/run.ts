// The golden set runner (stories/E4-6): `npm run evals`. Feeds each spec's rows (decision 0037)
// through the shaping prompt and the E4-1 client, asks the judge about every reader version
// that differs from its row (evals/judge.md), scores with evals/score.ts, prints one line per
// spec and the cost, writes evals/results/latest.json and exits 1 when fewer than PASS_BAR
// specs pass (decision 0038). Runs
// against a throwaway workspace "evals" so every call is an ai_run row like any other. The
// script runs outside src/, so it may read the database directly.
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { project } from "@/db/schema";
import { projects } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import type { WorkspaceId } from "@/db/types";
import { usage } from "@/db/queries/usage";
import { runModel, type RunDeps } from "@/lib/ai/client";
import { contextOf } from "@/lib/ai/context";
import { buildShapePrompt } from "@/lib/ai/prompts/shape";
import { ShapeOutput } from "@/lib/ai/shape-schema";
import { checkShape } from "@/lib/shaping";
import { line, needsJudge, score, type Expected, type SpecScore, type Verdict } from "./score";

const HERE = fileURLToPath(new URL(".", import.meta.url));
// A fixed id, as the sample workspace has (src/db/seed/sample.ts), so no workspace a person
// named "Evals" is ever taken for the throwaway one.
export const EVALS_WORKSPACE_ID = "00000002-0000-4000-8000-000000000002";
export const EVALS_SLUG = "evals-golden-set";

export const JudgeOutput = z.strictObject({
  verdicts: z.array(z.strictObject({
    ref: z.string().describe("The ref as given"),
    sameMeaning: z.boolean(),
    added: z.boolean(),
    note: z.string().max(200),
  })).min(1),
});

export function loadExpected(dir = HERE + "expected"): Expected[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as Expected);
}

export type SpecRun = { score: SpecScore; costCents: number; model: string; tokensIn: number; tokensOut: number; error?: string };

// The bar (decision 0038, point 3): the run is green when at least this many specs pass.
// The model is not deterministic, so one spec near a line can fail in one run and pass in
// the next; a run under the bar is a real change.
export const PASS_BAR = 7;
export const exitCode = (passed: number): number => (passed >= PASS_BAR ? 0 : 1);

// One spec: the shaping call, the judge call, the score. deps.fetch answers in place of the
// network in the test; the real run passes none.
export async function runSpec(expected: Expected, ws: WorkspaceId, projectId: string, deps: RunDeps = {}): Promise<SpecRun> {
  // The cost is read from the workspace's ai_run rows (E2-6 usage), so a call the provider
  // billed and the app refused counts as well (acceptance 4).
  const now = deps.now ?? new Date();
  const spentBefore = (await usage(ws, now)).aiCostCentsThisMonth;
  const spent = async () => (await usage(ws, now)).aiCostCentsThisMonth - spentBefore;
  const items = expected.items.map((it, i) => ({ ref: String(i + 1), text: it.row, area: null }));
  const context = contextOf(expected.context ? { goal: `${expected.context.goal} ${expected.context.audience}`, terms: expected.context.glossary.join(", ") } : { goal: null, terms: null });
  const prompt = buildShapePrompt(items, context);
  const refs = items.map((it) => it.ref);
  const shaped = await runModel({ ws, projectId, purpose: "shape", instructions: prompt.instructions, data: prompt.data, schema: ShapeOutput, check: (out) => checkShape(out, refs, null) }, deps);
  if (!shaped.ok) {
    const empty = score(expected, { areas: [], items: [] }, new Map());
    return { score: { ...empty, pass: false, failures: [`shaping refused: ${shaped.reason}`] }, costCents: await spent(), model: "", tokensIn: 0, tokensOut: 0, error: `${shaped.reason}: ${shaped.detail}` };
  }
  let tokensIn = shaped.run.tokensIn;
  let tokensOut = shaped.run.tokensOut;
  const verdicts = new Map<string, Verdict>();
  const toJudge = needsJudge(expected, shaped.output);
  if (toJudge.length > 0) {
    // The judge sees the project context the shaping call saw, so a party the context makes
    // plain (the technicians of spec 06) is not read as an addition.
    const contextLine = expected.context ? `CONTEXT: ${expected.context.goal} ${expected.context.audience}\n\n` : "";
    const data = contextLine + toJudge.map((j) => `[${j.ref}]\nORIGINAL: ${j.row}\nMEANING: ${j.meaning}\nREADER: ${j.reader}`).join("\n\n");
    const wanted = toJudge.map((j) => j.ref);
    const judged = await runModel({
      ws, projectId, purpose: "shape", instructions: readFileSync(HERE + "judge.md", "utf8"), data, schema: JudgeOutput,
      check: (out) => {
        const got = out.verdicts.map((v) => v.ref);
        const missing = wanted.filter((r) => !got.includes(r)).length;
        const extra = got.filter((r) => !wanted.includes(r)).length;
        const twice = got.filter((r, i) => got.indexOf(r) !== i).length;
        return missing + extra + twice > 0 ? `${missing} ref(s) unanswered, ${extra} unknown, ${twice} answered twice` : null;
      },
    }, deps);
    if (!judged.ok) {
      // Without verdicts every differing reader version reads as unjudged; the one failure
      // named is the refusal.
      const partial = score(expected, shaped.output, verdicts);
      return { score: { ...partial, pass: false, failures: [`judge refused: ${judged.reason}`] }, costCents: await spent(), model: shaped.run.model, tokensIn, tokensOut, error: `${judged.reason}: ${judged.detail}` };
    }
    for (const v of judged.output.verdicts) verdicts.set(v.ref, { sameMeaning: v.sameMeaning, added: v.added, note: v.note });
    tokensIn += judged.run.tokensIn;
    tokensOut += judged.run.tokensOut;
  }
  return { score: score(expected, shaped.output, verdicts), costCents: await spent(), model: shaped.run.model, tokensIn, tokensOut };
}

// The throwaway workspace and its project, created on the first run and reused after, found
// by the fixed id and never by name or slug.
export async function evalsWorkspace(): Promise<{ ws: WorkspaceId; projectId: string }> {
  const existing = await internal.getWorkspaceById(EVALS_WORKSPACE_ID);
  const row = existing ?? (await internal.createEmptyWorkspace({ id: EVALS_WORKSPACE_ID, name: "Evals", slug: EVALS_SLUG }));
  const ws = unsafeWorkspaceId(row.id);
  const [own] = await db.select().from(project).where(and(eq(project.workspaceId, row.id), eq(project.name, "Golden set"))).limit(1);
  const projectId = own?.id ?? (await projects.create(ws, { name: "Golden set" })).id;
  return { ws, projectId };
}

export async function main(): Promise<number> {
  const specs = loadExpected();
  const { ws, projectId } = await evalsWorkspace();
  const runs: SpecRun[] = [];
  for (const expected of specs) {
    const run = await runSpec(expected, ws, projectId);
    runs.push(run);
    console.log(line(run.score, run.costCents));
    if (run.error) console.error(`  ${run.error}`);
  }
  const cost = runs.reduce((n, r) => n + r.costCents, 0);
  const failed = runs.filter((r) => !r.score.pass).length;
  const model = runs.find((r) => r.model)?.model ?? "";
  mkdirSync(HERE + "results", { recursive: true });
  writeFileSync(HERE + "results/latest.json", JSON.stringify({ ranAt: new Date().toISOString(), model, costCents: cost, passed: runs.length - failed, failed, runs }, null, 2) + "\n");
  const passed = runs.length - failed;
  console.log(`${passed} of ${runs.length} specs pass (the bar is ${PASS_BAR}), ${cost} euro cent(s) on ${model || "no model"}. Results in evals/results/latest.json.`);
  return exitCode(passed);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().then((code) => process.exit(code)).catch((error: unknown) => {
    const cause = error instanceof Error && error.cause instanceof Error ? ` Cause: ${error.cause.message}` : "";
    console.error("The evals did not run. " + (error instanceof Error ? error.message : String(error)) + cause);
    console.error("Check that Docker is up (docker compose up -d), the database is migrated (npm run db:migrate), and ANTHROPIC_API_KEY and ANTHROPIC_MONTHLY_BUDGET_EUR are in .env.local.");
    process.exit(1);
  });
}
