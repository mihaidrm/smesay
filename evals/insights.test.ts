// The actions eval set (stories/E9-1, acceptance 5) against a fetch that answers in place of
// the network: an answer with every expected kind, each action citing what was sent, passes;
// one missing a kind fails with it named; one with an uncited action fails. No test calls the
// real API (decision 0039).
import { beforeAll, describe, expect, it } from "vitest";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { DEFAULT_MODEL } from "@/lib/ai/prices";
import { insightLine, loadInsightSpecs, promptFor, runInsightSpec, type InsightSpec } from "./insights";
import { evalsWorkspace } from "./run";

let ws: WorkspaceId;
let projectId: string;
const specs = loadInsightSpecs();

beforeAll(async () => {
  await prepareTestDatabase();
  process.env.ANTHROPIC_API_KEY = "test-key-for-the-fake-transport";
  process.env.ANTHROPIC_MONTHLY_BUDGET_EUR = "100000";
  ({ ws, projectId } = await evalsWorkspace());
}, 60_000);

type Action = { kind: string; title: string; why: string; answers: string[]; missing: string[] };
function answer(build: (spec: InsightSpec) => Action[], spec: InsightSpec) {
  return (async () => {
    const message = { id: "msg_test", type: "message", role: "assistant", model: DEFAULT_MODEL, content: [{ type: "text", text: JSON.stringify({ actions: build(spec) }) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 2000, output_tokens: 400, cache_creation_input_tokens: null, cache_read_input_tokens: null } };
    return new Response(JSON.stringify(message), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof globalThis.fetch;
}
// One action per expected kind, each citing the first answer (or the first missing item).
const good = (spec: InsightSpec): Action[] => spec.expectedKinds.map((kind) => ({ kind, title: `Do the ${kind} thing.`, why: "From the answers.", answers: ["A1"], missing: [] }));

describe("the actions eval set", () => {
  it("has two specs whose prompts carry every answer and missing item as a ref", () => {
    expect(specs.map((s) => s.id)).toEqual(["insights-01", "insights-02"]);
    for (const spec of specs) {
      const prompt = promptFor(spec);
      expect(prompt.answerRefs.size).toBe(spec.answers.length);
      expect(prompt.missingRefs.size).toBe(spec.missing.length);
      expect(spec.expectedKinds.length).toBeGreaterThan(0);
    }
  });
  it("passes a run with every expected kind, all cited", async () => {
    for (const spec of specs) {
      const run = await runInsightSpec(spec, ws, projectId, { fetch: answer(good, spec) });
      expect(run).toMatchObject({ pass: true, failures: [], kept: spec.expectedKinds.length, written: spec.expectedKinds.length });
      expect(insightLine(run)).toMatch(new RegExp(`^${spec.id} pass: \\d of \\d action\\(s\\) kept`));
    }
  });
  it("fails a run missing a kind, and one with an uncited action", async () => {
    const spec = specs[0];
    const noConflict = await runInsightSpec(spec, ws, projectId, { fetch: answer((s) => good(s).filter((a) => a.kind !== "conflict"), spec) });
    expect(noConflict).toMatchObject({ pass: false, failures: ["no conflict action"] });
    const uncited = await runInsightSpec(spec, ws, projectId, { fetch: answer((s) => [...good(s), { kind: "rewrite", title: "Cites nothing.", why: "None.", answers: [], missing: [] }], spec) });
    expect(uncited).toMatchObject({ pass: false, failures: ["1 action(s) uncited or citing an unknown ref"] });
  });
});
