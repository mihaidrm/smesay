// The one door to the model (stories/E4-1). This file alone reads ANTHROPIC_API_KEY and
// imports the SDK: eslint's no-restricted-imports refuses the package anywhere outside
// src/lib/ai/ (eslint.config.mjs), and scripts/check-ai-bundle.mjs greps the client bundles
// after the build for the key name and the package name (acceptance 1). Nothing here is
// reachable from a browser: the module is imported by server code only.
//
// SDK: @anthropic-ai/sdk 0.131.0 (MIT, released 2026-10-01; open issue count unverified, the
// GitHub access of this session is scoped to the product's repository). Client options from
// node_modules/@anthropic-ai/sdk/client.d.ts: apiKey, fetch, timeout (milliseconds),
// maxRetries. messages.create and output_config.format from resources/messages/messages.d.ts;
// zodOutputFormat from helpers/zod.d.ts; the error classes from core/error.d.ts. The
// claude-api skill of the session was read before this was written (the story's notes).
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { aiRuns, projects, workspaces } from "@/db/queries";
import { usage } from "@/db/queries/usage";
import type { WorkspaceId } from "@/db/types";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { isWithin, limitFor } from "@/lib/plans";
import { AI_COPY } from "./copy";
import { costEurCents, DEFAULT_MODEL, estimateTokensIn } from "./prices";

// The same list as AI_PURPOSES in src/db/schema.ts (the check constraint on ai_run.purpose).
export type AiPurpose = "shape" | "insights";

export const TIMEOUT_MS = 60_000;
// Room for a shaped list of 2,000 items (E3-2's row limit) without streaming.
export const OUTPUT_TOKENS_MAX = 16_000;

export type RunInput<T> = {
  ws: WorkspaceId;
  projectId: string;
  purpose: AiPurpose;
  // The instructions go in the system prompt; the uploaded text goes in its own content block
  // of the user message and nowhere else (SECURITY.md, AI).
  instructions: string;
  data: string;
  // The output shape. Pass z.strictObject so an extra field fails (acceptance 5).
  schema: z.ZodType<T>;
  // The caller's rule over the content, for example "every ref exists in the input". A
  // string is the reason the output is refused; null accepts it.
  check?: (output: T) => string | null;
  maxOutputTokens?: number;
};

// Swapped in by tests: a fetch that answers instead of the network, a short timeout, a fixed
// clock. The app passes nothing.
export type RunDeps = { fetch?: typeof fetch; timeoutMs?: number; now?: Date; model?: string };

export type Run = { id: string; model: string; tokensIn: number; tokensOut: number; costEurCents: number; durationMs: number };

export type RunResult<T> =
  | { ok: true; output: T; run: Run }
  // budget: refused before the call. rateLimited: the provider answered 429. failed: timeout,
  // provider error, refusal or a cut-off answer. invalid: the answer failed the schema or the
  // caller's check (acceptance 5). The message is what the screen shows; detail is for the
  // server log only and never names the uploaded text.
  | { ok: false; reason: "budget" | "rateLimited" | "failed" | "invalid"; message: string; detail: string };

const refused = <T>(reason: "budget" | "rateLimited" | "failed" | "invalid", detail: string): RunResult<T> => ({
  ok: false,
  reason,
  message: reason === "budget" ? AI_COPY.budget : reason === "rateLimited" ? AI_COPY.rateLimited : AI_COPY.failed,
  detail,
});

export async function runModel<T>(input: RunInput<T>, deps: RunDeps = {}): Promise<RunResult<T>> {
  const workspace = await workspaces.getById(input.ws);
  if (!workspace) throw new NotFoundError();
  const project = await projects.get(input.ws, input.projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) throw new ForbiddenError(AI_COPY.sample);

  const model = deps.model ?? DEFAULT_MODEL;
  const maxOutputTokens = input.maxOutputTokens ?? OUTPUT_TOKENS_MAX;
  const now = deps.now ?? new Date();

  // The budget check (acceptance 3): the month's spend from usage(), the same rows E2-6 shows
  // on Settings, plus the call's estimate, against the workspace's euro cap; and the plan's
  // run cap through the same numbers, so the two cannot disagree.
  const used = await usage(input.ws, now);
  const estimate = costEurCents(model, estimateTokensIn(input.instructions + input.data), maxOutputTokens);
  if (used.aiCostCentsThisMonth + estimate > workspace.aiBudgetEur * 100) return refused("budget", `spent ${used.aiCostCentsThisMonth} + estimate ${estimate} cents over ${workspace.aiBudgetEur} euro`);
  if (!isWithin(limitFor(workspace.plan, "aiRuns"), used.aiRunsThisMonth)) return refused("budget", `${used.aiRunsThisMonth} runs this month on plan ${workspace.plan}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set. The AI call was not made.");
    return refused("failed", "ANTHROPIC_API_KEY is not set");
  }

  // maxRetries 0: a 429 reaches the caller at once with its own message, and a timeout is one
  // timeout, not three (the SDK retries 429 and 5xx by default).
  const client = new Anthropic({ apiKey, fetch: deps.fetch, timeout: deps.timeoutMs ?? TIMEOUT_MS, maxRetries: 0 });
  const started = Date.now();
  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model,
      max_tokens: maxOutputTokens,
      system: [{ type: "text", text: input.instructions }],
      messages: [{ role: "user", content: [{ type: "text", text: input.data }] }],
      output_config: { format: zodOutputFormat(input.schema) },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return refused("rateLimited", "429 from the provider");
    const name = error instanceof Error ? error.name : "unknown";
    const status = error instanceof Anthropic.APIError ? ` ${error.status}` : "";
    console.error(`The AI call failed: ${name}${status}.`);
    return refused("failed", `${name}${status}`);
  }
  const durationMs = Date.now() - started;

  // Every answered call is a row (acceptance 2), whatever the answer was worth: the tokens
  // were billed. Cache tokens are counted as input in case a later story turns caching on.
  const tokensIn = message.usage.input_tokens + (message.usage.cache_creation_input_tokens ?? 0) + (message.usage.cache_read_input_tokens ?? 0);
  const tokensOut = message.usage.output_tokens;
  const row = await aiRuns.create(input.ws, { projectId: input.projectId, purpose: input.purpose, model, tokensIn, tokensOut, costEurCents: costEurCents(model, tokensIn, tokensOut), durationMs });
  const run: Run = { id: row.id, model, tokensIn, tokensOut, costEurCents: row.costEurCents, durationMs };

  if (message.stop_reason !== "end_turn") return refused("failed", `stop_reason ${message.stop_reason}`);
  const text = message.content.filter((block) => block.type === "text").map((block) => block.text).join("");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return refused("invalid", "the answer was not JSON");
  }
  const result = input.schema.safeParse(parsed);
  if (!result.success) return refused("invalid", `schema: ${result.error.issues.map((issue) => issue.path.join(".") + " " + issue.message).join("; ")}`);
  const problem = input.check?.(result.data) ?? null;
  if (problem) return refused("invalid", `check: ${problem}`);
  return { ok: true, output: result.data, run };
}
