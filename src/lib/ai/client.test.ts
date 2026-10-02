// runModel() (stories/E4-1, acceptance 2 to 6) against a fetch that answers in place of the
// network: no test reaches the real API. The key here is a made-up string for the fake
// transport; it is no secret. A workspace with its sample and one project of its own, as
// onboarding creates it.
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { aiRuns, projects, workspaces } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";
import { memoryOutbox } from "@/lib/mail";
import { requireWorkspace } from "@/lib/workspace";
import { AI_COPY } from "./copy";
import { OUTPUT_TOKENS_MAX, runModel } from "./client";
import { costEurCents, DEFAULT_MODEL } from "./prices";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const KEY = "test-key-for-the-fake-transport";
let ws: WorkspaceId;
let wsB: WorkspaceId;
let projectId: string;
let sampleId: string;

async function signIn(label: string): Promise<{ headers: Headers; userId: string }> {
  const email = `${label}-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  const userId = (await auth.api.getSession({ headers }))!.user.id;
  return { headers, userId };
}

beforeAll(async () => {
  await prepareTestDatabase();
  process.env.ANTHROPIC_API_KEY = KEY;
  const a = await signIn("ai-a");
  ws = await requireWorkspace(a.headers, (await createWorkspaceWithSample({ name: "AI A", slug: "ai-a-" + randomUUID() }, a.userId)).id);
  sampleId = (await projects.list(ws)).find((p) => p.isSample)!.id;
  projectId = (await projects.create(ws, { name: "Own" })).id;
  const b = await signIn("ai-b");
  wsB = await requireWorkspace(b.headers, (await workspaces.create({ name: "AI B", slug: "ai-b-" + randomUUID() }, b.userId)).id);
}, 60_000);

afterEach(async () => {
  await workspaces.update(ws, { aiBudgetEur: 50 });
  process.env.ANTHROPIC_API_KEY = KEY;
});

const Shape = z.strictObject({ areas: z.array(z.strictObject({ name: z.string(), items: z.array(z.string()) })) });
type Shape = z.infer<typeof Shape>;
const refs = ["CL-01", "CL-02"];
const onlyKnownRefs = (out: Shape) => {
  const unknown = out.areas.flatMap((a) => a.items).filter((ref) => !refs.includes(ref));
  return unknown.length ? `unknown refs ${unknown.join(", ")}` : null;
};
const input = (over: Partial<Parameters<typeof runModel<Shape>>[0]> = {}) => ({ ws, projectId, purpose: "shape" as const, instructions: "Group the items.", data: "CL-01 Receipts\nCL-02 Limits", schema: Shape, check: onlyKnownRefs, ...over });

type Captured = { body: Record<string, unknown>; headers: Headers };
// A message as the API returns it, with the output as its one text block.
function answer(output: unknown, over: { stop?: string; tokensIn?: number; tokensOut?: number; status?: number } = {}) {
  const calls: Captured[] = [];
  const message = { id: "msg_test", type: "message", role: "assistant", model: DEFAULT_MODEL, content: [{ type: "text", text: typeof output === "string" ? output : JSON.stringify(output) }], stop_reason: over.stop ?? "end_turn", stop_sequence: null, usage: { input_tokens: over.tokensIn ?? 1200, output_tokens: over.tokensOut ?? 300, cache_creation_input_tokens: null, cache_read_input_tokens: null } };
  const body = over.status && over.status >= 400 ? { type: "error", error: { type: "rate_limit_error", message: "slow down" } } : message;
  const transport = (async (_url: string | URL | Request, init?: RequestInit) => {
    calls.push({ body: JSON.parse(String(init?.body)), headers: new Headers(init?.headers) });
    return new Response(JSON.stringify(body), { status: over.status ?? 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof globalThis.fetch;
  return { fetch: transport, calls };
}
const good: Shape = { areas: [{ name: "Claiming", items: ["CL-01", "CL-02"] }] };

describe("runModel", () => {
  it("sends the instructions as the system prompt, the data as its own block, the key as a header, and logs the run", async () => {
    const { fetch, calls } = answer(good);
    const before = await aiRuns.count(ws);
    const result = await runModel(input(), { fetch });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.output).toEqual(good);
    expect(calls).toHaveLength(1);
    const body = calls[0].body as { model: string; max_tokens: number; system: { text: string }[]; messages: { role: string; content: { type: string; text: string }[] }[]; output_config: { format: { type: string } } };
    expect(body.model).toBe(DEFAULT_MODEL);
    expect(body.max_tokens).toBe(OUTPUT_TOKENS_MAX);
    expect(body.system).toEqual([{ type: "text", text: "Group the items." }]);
    expect(body.messages).toEqual([{ role: "user", content: [{ type: "text", text: "CL-01 Receipts\nCL-02 Limits" }] }]);
    expect(body.output_config.format.type).toBe("json_schema");
    expect(calls[0].headers.get("x-api-key")).toBe(KEY);
    expect(await aiRuns.count(ws)).toBe(before + 1);
    const row = await aiRuns.get(ws, result.run.id);
    expect(row).toMatchObject({ projectId, purpose: "shape", model: DEFAULT_MODEL, tokensIn: 1200, tokensOut: 300, costEurCents: costEurCents(DEFAULT_MODEL, 1200, 300) });
    expect(row!.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.run.costEurCents).toBe(1);
    expect(await aiRuns.get(wsB, result.run.id)).toBeNull();
  });

  it("refuses an answer with an extra field, and logs the run", async () => {
    const { fetch } = answer({ ...good, note: "added by the model" });
    const before = await aiRuns.count(ws);
    const result = await runModel(input(), { fetch });
    expect(result).toMatchObject({ ok: false, reason: "invalid", message: AI_COPY.failed });
    expect(await aiRuns.count(ws)).toBe(before + 1);
  });

  it("refuses an answer that invents an item", async () => {
    const { fetch } = answer({ areas: [{ name: "Claiming", items: ["CL-01", "CL-02", "CL-99"] }] });
    const result = await runModel(input(), { fetch });
    expect(result).toMatchObject({ ok: false, reason: "invalid", detail: "check: unknown refs CL-99" });
  });

  it("refuses an answer that is not JSON", async () => {
    const { fetch } = answer("Here are the areas: Claiming.");
    const result = await runModel(input(), { fetch });
    expect(result).toMatchObject({ ok: false, reason: "invalid", detail: "the answer was not JSON" });
  });

  it("refuses over budget before any call, counting the month's spend", async () => {
    const { fetch, calls } = answer(good);
    await workspaces.update(ws, { aiBudgetEur: 1 });
    await aiRuns.create(ws, { projectId, purpose: "shape", model: DEFAULT_MODEL, tokensIn: 10, tokensOut: 10, costEurCents: 90, durationMs: 1 });
    const before = await aiRuns.count(ws);
    // The estimate for this call is 15 cents (the whole output allowance at 10 dollars per
    // million tokens, converted); 90 + 15 is over 100.
    const result = await runModel(input(), { fetch });
    expect(result).toMatchObject({ ok: false, reason: "budget", message: AI_COPY.budget });
    expect(calls).toHaveLength(0);
    expect(await aiRuns.count(ws)).toBe(before);
    // Under the cap by a smaller allowance, the call goes through.
    const again = await runModel(input({ maxOutputTokens: 1000 }), { fetch });
    expect(again.ok).toBe(true);
  });

  it("turns a 429 into the rate limit message without a row", async () => {
    const { fetch } = answer(good, { status: 429 });
    const before = await aiRuns.count(ws);
    const result = await runModel(input(), { fetch });
    expect(result).toMatchObject({ ok: false, reason: "rateLimited", message: AI_COPY.rateLimited });
    expect(await aiRuns.count(ws)).toBe(before);
  });

  it("gives up after the timeout with the failed message and no row", async () => {
    const hang = ((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason ?? new Error("aborted"))))) as unknown as typeof globalThis.fetch;
    const before = await aiRuns.count(ws);
    const started = Date.now();
    const result = await runModel(input(), { fetch: hang, timeoutMs: 100 });
    expect(Date.now() - started).toBeLessThan(5000);
    expect(result).toMatchObject({ ok: false, reason: "failed", message: AI_COPY.failed });
    expect(await aiRuns.count(ws)).toBe(before);
  });

  it("treats a refusal or a cut-off answer as failed, and still logs the tokens", async () => {
    const before = await aiRuns.count(ws);
    expect(await runModel(input(), { fetch: answer(good, { stop: "refusal" }).fetch })).toMatchObject({ ok: false, reason: "failed", detail: "stop_reason refusal" });
    expect(await runModel(input(), { fetch: answer(good, { stop: "max_tokens" }).fetch })).toMatchObject({ ok: false, reason: "failed", detail: "stop_reason max_tokens" });
    expect(await aiRuns.count(ws)).toBe(before + 2);
  });

  it("makes no call without the key", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { fetch, calls } = answer(good);
    const result = await runModel(input(), { fetch });
    expect(result).toMatchObject({ ok: false, reason: "failed", detail: "ANTHROPIC_API_KEY is not set" });
    expect(calls).toHaveLength(0);
  });

  it("refuses the sample project and a project of another workspace", async () => {
    const { fetch, calls } = answer(good);
    await expect(runModel(input({ projectId: sampleId }), { fetch })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(runModel(input({ ws: wsB }), { fetch })).rejects.toMatchObject({ status: 404 });
    expect(calls).toHaveLength(0);
  });
});
