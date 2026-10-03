// The golden set runner (stories/E4-6): `npm run evals`. Feeds each spec's rows (decision 0037)
// through the shaping prompt and the E4-1 client, asks the judge about every reader version
// that differs from its row (evals/judge.md), scores with evals/score.ts, prints one line per
// spec and the cost, writes evals/results/latest.json and exits 1 when a spec fails. Runs
// against a throwaway workspace "evals" so every call is an ai_run row like any other. The
// script runs outside src/, so it may read the database directly.
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { project, workspace } from "@/db/schema";
import { projects } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import type { WorkspaceId } from "@/db/types";
import { runModel, type RunDeps } from "@/lib/ai/client";
import { contextOf } from "@/lib/ai/context";
import { buildShapePrompt } from "@/lib/ai/prompts/shape";
import { ShapeOutput } from "@/lib/ai/shape-schema";
import { checkShape } from "@/lib/shaping";
import { line, needsJudge, score, type Expected, type SpecScore, type Verdict } from "./score";

const HERE = fileURLToPath(new URL(".", import.meta.url));
export const EVALS_SLUG = "evals";

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

// One spec: the shaping call, the judge call, the score. deps.fetch answers in place of the
// network in the test; the real run passes none.
export async function runSpec(expected: Expected, ws: WorkspaceId, projectId: string, deps: RunDeps = {}): Promise<SpecRun> {
  const items = expected.items.map((it, i) => ({ ref: String(i + 1), text: it.row, area: null }));
  const context = contextOf(expected.context ? { goal: `${expected.context.goal} ${expected.context.audience}`, terms: expected.context.glossary.join(", ") } : { goal: null, terms: null });
  const prompt = buildShapePrompt(items, context);
  const refs = items.map((it) => it.ref);
  const shaped = await runModel({ ws, projectId, purpose: "shape", instructions: prompt.instructions, data: prompt.data, schema: ShapeOutput, check: (out) => checkShape(out, refs, null) }, deps);
  if (!shaped.ok) {
    const empty = score(expected, { areas: [], items: [] }, new Map());
    return { score: { ...empty, pass: false, failures: [`shaping refused: ${shaped.reason}`] }, costCents: 0, model: "", tokensIn: 0, tokensOut: 0, error: `${shaped.reason}: ${shaped.detail}` };
  }
  let cost = shaped.run.costEurCents;
  let tokensIn = shaped.run.tokensIn;
  let tokensOut = shaped.run.tokensOut;
  const verdicts = new Map<string, Verdict>();
  const toJudge = needsJudge(expected, shaped.output);
  if (toJudge.length > 0) {
    const data = toJudge.map((j) => `[${j.ref}]\nORIGINAL: ${j.row}\nMEANING: ${j.meaning}\nREADER: ${j.reader}`).join("\n\n");
    const wanted = toJudge.map((j) => j.ref);
    const judged = await runModel({
      ws, projectId, purpose: "shape", instructions: readFileSync(HERE + "judge.md", "utf8"), data, schema: JudgeOutput,
      check: (out) => {
        const got = out.verdicts.map((v) => v.ref);
        const missing = wanted.filter((r) => !got.includes(r)).length;
        const extra = got.filter((r) => !wanted.includes(r)).length;
        return missing + extra > 0 ? `${missing} ref(s) unanswered, ${extra} unknown` : null;
      },
    }, deps);
    if (!judged.ok) {
      const partial = score(expected, shaped.output, verdicts);
      return { score: { ...partial, pass: false, failures: [...partial.failures, `judge refused: ${judged.reason}`] }, costCents: cost, model: shaped.run.model, tokensIn, tokensOut, error: `${judged.reason}: ${judged.detail}` };
    }
    for (const v of judged.output.verdicts) verdicts.set(v.ref, { sameMeaning: v.sameMeaning, added: v.added, note: v.note });
    cost += judged.run.costEurCents;
    tokensIn += judged.run.tokensIn;
    tokensOut += judged.run.tokensOut;
  }
  return { score: score(expected, shaped.output, verdicts), costCents: cost, model: shaped.run.model, tokensIn, tokensOut };
}

// The throwaway workspace and its project, created on the first run and reused after.
export async function evalsWorkspace(): Promise<{ ws: WorkspaceId; projectId: string }> {
  const [existing] = await db.select().from(workspace).where(eq(workspace.slug, EVALS_SLUG)).limit(1);
  const row = existing ?? (await internal.createEmptyWorkspace({ name: "Evals", slug: EVALS_SLUG }));
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
  console.log(`${runs.length - failed} of ${runs.length} specs pass, ${cost} euro cent(s) on ${model || "no model"}. Results in evals/results/latest.json.`);
  return failed > 0 ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().then((code) => process.exit(code)).catch((error: unknown) => {
    const cause = error instanceof Error && error.cause instanceof Error ? ` Cause: ${error.cause.message}` : "";
    console.error("The evals did not run. " + (error instanceof Error ? error.message : String(error)) + cause);
    console.error("Check that Docker is up (docker compose up -d), the database is migrated (npm run db:migrate), and ANTHROPIC_API_KEY and ANTHROPIC_MONTHLY_BUDGET_EUR are in .env.local.");
    process.exit(1);
  });
}
