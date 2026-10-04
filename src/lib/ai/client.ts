// The one door to the model (stories/E4-1). This file alone reads ANTHROPIC_API_KEY and
// imports the SDK: the lint rule smesay/ai-sdk refuses the package anywhere outside
// src/lib/ai/ by any import spelling, and refuses this module from a "use client" file
// (eslint-rules/db-access.mjs); scripts/check-ai-bundle.mjs greps the client bundles after
// the build for the key name and the package name (acceptance 1).
//
// SDK: @anthropic-ai/sdk 0.131.0 (MIT, released 2026-10-01; 22 open issues, read from the
// public page github.com/anthropics/anthropic-sdk-typescript the same day). Client options from
// node_modules/@anthropic-ai/sdk/client.d.ts: apiKey, fetch, timeout (milliseconds),
// maxRetries; per-request `signal` from internal/request-options.d.ts. messages.create and
// output_config.format from resources/messages/messages.d.ts; zodOutputFormat from
// helpers/zod.d.ts; the error classes from core/error.d.ts. The claude-api skill of the
// session was read before this was written (the story's notes).
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { aiRuns, projects, workspaces } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { usage } from "@/db/queries/usage";
import type { WorkspaceId } from "@/db/types";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { isWithin, limitFor } from "@/lib/plans";
import { AI_COPY } from "./copy";
import { costEurCents, DEFAULT_MODEL, estimateCents } from "./prices";
import { assertStrict } from "./strict";

// The same list as AI_PURPOSES in src/db/schema.ts (the check constraint on ai_run.purpose).
export type AiPurpose = "shape" | "insights";

export const TIMEOUT_MS = 60_000;
// The per-request ceilings (SECURITY.md, AI): the output allowance, room for a shaped list of
// 2,000 items (E3-2's row limit), and the input, about 125,000 tokens at four characters
// each, more than a 2,000 row list with long cells. A caller over either gets an Error, not a
// clipped call: it is the caller's bug.
export const OUTPUT_TOKENS_MAX = 16_000;
export const INPUT_CHARS_MAX = 500_000;

export type RunInput<T> = {
  ws: WorkspaceId;
  projectId: string;
  purpose: AiPurpose;
  // The instructions go in the system prompt; the uploaded text goes in its own content block
  // of the user message and nowhere else (SECURITY.md, AI).
  instructions: string;
  data: string;
  // The output shape: every object in it strict (z.strictObject), checked at the call
  // (src/lib/ai/strict.ts), so an extra field anywhere fails (acceptance 5).
  schema: z.ZodType<T>;
  // The caller's rule over the content the schema cannot see, for example "every ref exists
  // in the input" (SECURITY.md: the model may not add items). A string is the reason the
  // output is refused; null accepts it. Required, so no caller forgets it.
  check: (output: T) => string | null;
  maxOutputTokens?: number;
  // The output the caller expects, for the estimate the budget checks use (E9-3); without it
  // the whole allowance is counted, so the estimate errs high (E4-1).
  expectedOutputTokens?: number;
};

// Swapped in by tests: a fetch that answers instead of the network, a short timeout, a fixed
// clock. The app passes nothing.
export type RunDeps = { fetch?: typeof fetch; timeoutMs?: number; now?: Date; model?: string };

export type Run = { id: string; model: string; tokensIn: number; tokensOut: number; costEurCents: number; durationMs: number };

export type Refusal = "paused" | "budget" | "plan" | "rateLimited" | "failed" | "invalid";
export type RunResult<T> =
  | { ok: true; output: T; run: Run }
  // paused: the product's monthly cap (ANTHROPIC_MONTHLY_BUDGET_EUR, decision 0036), refused
  // before the call. budget: the workspace's euro cap, the same. plan: the plan's run cap, the same. rateLimited:
  // the provider answered 429. failed: timeout or provider error, no answer. invalid: an answer
  // the app cannot use: a refusal, a cut-off, a schema or check failure (acceptance 5). The
  // message is what the screen shows; detail is for the server log: codes, counts and paths
  // from this file, plus the caller's check reason, which the caller keeps free of list text.
  // estimateCents: the call's estimate, on a paused or budget refusal (E9-3).
  | { ok: false; reason: Refusal; message: string; detail: string; estimateCents?: number };

const MESSAGE: Record<Refusal, string> = { paused: AI_COPY.paused, budget: AI_COPY.budget, plan: AI_COPY.plan, rateLimited: AI_COPY.rateLimited, failed: AI_COPY.failed, invalid: AI_COPY.invalid };
const refused = <T>(reason: Refusal, detail: string, estimateCents?: number): RunResult<T> => ({ ok: false, reason, message: MESSAGE[reason], detail, ...(estimateCents === undefined ? {} : { estimateCents }) });

// The text an estimate counts (E9-3): the prompt and the output schema the API sends with it.
export const estimateText = (instructions: string, data: string, outputFormat: unknown): string => instructions + data + JSON.stringify(outputFormat);
// The output format the request sends for a schema (the SDK's helper, which only this file imports).
export const outputFormatOf = (schema: z.ZodType<unknown>) => zodOutputFormat(schema);

// The product's cap for the month in whole euro, from the environment (decision 0036); null
// when the variable is missing or not a whole number, and the call is then refused, as for a
// missing key. Read at each call, so a test can set it.
export function productCapEur(): number | null {
  const raw = process.env.ANTHROPIC_MONTHLY_BUDGET_EUR;
  if (raw === undefined || !/^\d+$/.test(raw.trim())) return null;
  return Number(raw.trim());
}

export async function runModel<T>(input: RunInput<T>, deps: RunDeps = {}): Promise<RunResult<T>> {
  assertStrict(input.schema);
  if (input.instructions.length + input.data.length > INPUT_CHARS_MAX) throw new Error(`The AI input is over ${INPUT_CHARS_MAX} characters. Shorten it before calling runModel.`);
  if (input.maxOutputTokens !== undefined && input.maxOutputTokens > OUTPUT_TOKENS_MAX) throw new Error(`maxOutputTokens is over ${OUTPUT_TOKENS_MAX}.`);

  const workspace = await workspaces.getById(input.ws);
  if (!workspace) throw new NotFoundError();
  const project = await projects.get(input.ws, input.projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) throw new ForbiddenError(AI_COPY.sample);

  const model = deps.model ?? DEFAULT_MODEL;
  const maxOutputTokens = input.maxOutputTokens ?? OUTPUT_TOKENS_MAX;
  const now = deps.now ?? new Date();

  // The budget checks (acceptance 3; decision 0036): the product's spend this month across
  // every workspace plus the call's estimate against ANTHROPIC_MONTHLY_BUDGET_EUR, then the
  // workspace's spend from usage(), the same rows E2-6 counts, against the workspace's euro
  // cap, and the plan's run cap through the same numbers, so none of the three can disagree.
  const cap = productCapEur();
  if (cap === null) {
    console.error("ANTHROPIC_MONTHLY_BUDGET_EUR is not set or not a whole number of euro. The AI call was not made.");
    return refused("failed", "ANTHROPIC_MONTHLY_BUDGET_EUR is not set");
  }
  // The estimate counts the output schema too, which the API sends with the prompt (design
  // note 26 named it as the gap the whole allowance covered; E9-3 lets a caller expect less).
  const outputFormat = outputFormatOf(input.schema);
  const estimate = estimateCents(model, estimateText(input.instructions, input.data, outputFormat), Math.min(input.expectedOutputTokens ?? maxOutputTokens, maxOutputTokens));
  const productSpent = await internal.productAiCostCentsThisMonth(now);
  if (productSpent + estimate > cap * 100) return refused("paused", `product spent ${productSpent} + estimate ${estimate} cents over ${cap} euro`, estimate);
  const used = await usage(input.ws, now);
  if (used.aiCostCentsThisMonth + estimate > workspace.aiBudgetEur * 100) return refused("budget", `spent ${used.aiCostCentsThisMonth} + estimate ${estimate} cents over ${workspace.aiBudgetEur} euro`, estimate);
  if (!isWithin(limitFor(workspace.plan, "aiRuns"), used.aiRunsThisMonth)) return refused("plan", `${used.aiRunsThisMonth} runs this month on plan ${workspace.plan}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set. The AI call was not made.");
    return refused("failed", "ANTHROPIC_API_KEY is not set");
  }

  // Every call is a row (acceptance 2), answered or not: a call the provider did not answer
  // is logged with zero tokens and zero cost, so the log is the full list of attempts. The
  // row is written in one place after the call, whatever happened.
  const started = Date.now();
  let tokensIn = 0;
  let tokensOut = 0;
  let message: Anthropic.Message | null = null;
  let failure: RunResult<T> | null = null;

  // maxRetries 0: a 429 reaches the caller at once with its own message, and the 60 seconds are
  // one timeout, not three (the SDK retries 429 and 5xx by default). The SDK's own timeout
  // covers the wait for the headers only; the controller below cuts the body read too, so a
  // stalled answer ends at the same 60 seconds (acceptance 4).
  const timeoutMs = deps.timeoutMs ?? TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const client = new Anthropic({ apiKey, fetch: deps.fetch, timeout: timeoutMs, maxRetries: 0 });
    message = await client.messages.create({
      model,
      max_tokens: maxOutputTokens,
      system: [{ type: "text", text: input.instructions }],
      messages: [{ role: "user", content: [{ type: "text", text: input.data }] }],
      output_config: { format: outputFormat },
    }, { signal: controller.signal });
    // Cache tokens are counted as input in case a later story turns caching on; they are
    // priced at the base rate until the price table learns the cache rates.
    tokensIn = message.usage.input_tokens + (message.usage.cache_creation_input_tokens ?? 0) + (message.usage.cache_read_input_tokens ?? 0);
    tokensOut = message.usage.output_tokens;
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) failure = refused("rateLimited", "429 from the provider");
    else {
      // A stalled body read throws the abort itself, not an SDK error; the signal says why.
      const detail = controller.signal.aborted ? TIMEOUT_DETAIL : describe(error);
      console.error(`The AI call failed: ${detail}.`);
      failure = refused("failed", detail);
    }
  } finally {
    clearTimeout(timer);
  }
  const durationMs = Date.now() - started;

  let row;
  try {
    row = await aiRuns.create(input.ws, { projectId: input.projectId, purpose: input.purpose, model, tokensIn, tokensOut, costEurCents: costEurCents(model, tokensIn, tokensOut), durationMs });
  } catch (error) {
    console.error(`The AI run could not be logged: ${error instanceof Error ? error.constructor.name : "unknown error"}.`);
    return refused("failed", "the run could not be logged");
  }
  if (failure || !message) return failure ?? refused("failed", "no answer");
  const run: Run = { id: row.id, model, tokensIn, tokensOut, costEurCents: row.costEurCents, durationMs };
  // The estimate next to the actual, counts only, so a real run shows how close the estimate
  // came (E9-3, acceptance 3; the tests have no real usage to compare with).
  console.info(`AI run ${input.purpose}: estimate ${estimate} cents, actual ${row.costEurCents} cents (${tokensIn} in, ${tokensOut} out).`);

  // A refusal or a cut-off answer: the model answered, but not with something usable.
  if (message.stop_reason !== "end_turn") return refused("invalid", `stop_reason ${message.stop_reason}`);
  const text = message.content.filter((block): block is Anthropic.TextBlock => block.type === "text").map((block) => block.text).join("");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return refused("invalid", "the answer was not JSON");
  }
  const result = input.schema.safeParse(parsed);
  if (!result.success) return refused("invalid", `schema: ${result.error.issues.map((issue) => `${issue.code} at ${issue.path.join(".") || "root"}`).join("; ")}`);
  const problem = input.check(result.data);
  if (problem) return refused("invalid", `check: ${problem}`);
  return { ok: true, output: result.data, run };
}

// A short name for the log. The SDK's error classes do not set `name`, so the class is read
// from the constructor; the status and the provider's error type say what to do.
const TIMEOUT_DETAIL = `timeout after ${TIMEOUT_MS / 1000} seconds or less`;
function describe(error: unknown): string {
  if (error instanceof Anthropic.APIUserAbortError || error instanceof Anthropic.APIConnectionTimeoutError) return TIMEOUT_DETAIL;
  if (error instanceof Anthropic.AuthenticationError) return "401 from the provider: the key was refused. Check ANTHROPIC_API_KEY in .env.local";
  if (error instanceof Anthropic.APIError) return `${error.constructor.name} ${error.status ?? ""}`.trim();
  if (error instanceof Error) return error.constructor.name;
  return "unknown";
}
