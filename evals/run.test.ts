// The golden set runner against a fetch that answers in place of the network (stories/E4-6,
// acceptance 1, 2 and 4): the answer is built from the expectation, so a correct run passes;
// then a dropped negative, an addition and a renamed glossary term are caught. No test calls
// the real API.
import { beforeAll, describe, expect, it } from "vitest";
import { aiRuns } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { DEFAULT_MODEL } from "@/lib/ai/prices";
import type { ShapeOutput } from "@/lib/ai/shape-schema";
import { evalsWorkspace, loadExpected, runSpec } from "./run";
import { line, refOfPosition, score, type Expected } from "./score";

let ws: WorkspaceId;
let projectId: string;
const specs = loadExpected();
const spec = (id: string) => specs.find((s) => s.id === id)!;

beforeAll(async () => {
  await prepareTestDatabase();
  process.env.ANTHROPIC_API_KEY = "test-key-for-the-fake-transport";
  process.env.ANTHROPIC_MONTHLY_BUDGET_EUR = "100000";
  ({ ws, projectId } = await evalsWorkspace());
}, 60_000);

// The model's answer a correct run would give, from the expectation: the expected areas with
// their items by position, the row in plainer words, the expected flags.
function perfect(expected: Expected, tweak: (ref: string, reader: string) => string = (_r, s) => s): ShapeOutput {
  const position = (ref: string) => String(expected.items.findIndex((i) => i.ref === ref) + 1);
  return {
    areas: expected.areas.map((a, i) => ({ name: a.name, rationale: i === 0 ? "First, because it starts here." : "Then this.", items: a.items.map(position) })),
    items: expected.items.map((it) => ({ ref: position(it.ref), reader: tweak(it.ref, `${it.row} (in plain words)`), flags: { ambiguity: it.ambiguous ? "What the item does not say." : null, duplicateOf: it.duplicate_of ? position(it.duplicate_of) : null } })),
  };
}

// Answers the shaping call with `shape` and the judge call with one verdict per ref given,
// false for the refs in `wrong` and added for the refs in `added`.
function transport(shape: ShapeOutput, wrong: string[] = [], added: string[] = []) {
  const calls: { system: string; data: string }[] = [];
  const fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { system: { text: string }[]; messages: { content: { text: string }[] }[] };
    const system = body.system[0].text;
    const data = body.messages[0].content[0].text;
    calls.push({ system, data });
    let output: unknown = shape;
    if (system.startsWith("You compare a requirement")) {
      const refs = [...data.matchAll(/^\[([^\]]+)\]$/gm)].map((m) => m[1]);
      output = { verdicts: refs.map((ref) => ({ ref, sameMeaning: !wrong.includes(ref), added: added.includes(ref), note: "Same." })) };
    }
    const message = { id: "msg_test", type: "message", role: "assistant", model: DEFAULT_MODEL, content: [{ type: "text", text: JSON.stringify(output) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 1000, output_tokens: 500, cache_creation_input_tokens: null, cache_read_input_tokens: null } };
    return new Response(JSON.stringify(message), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof globalThis.fetch;
  return { fetch, calls };
}

describe("the golden set runner", () => {
  it("loads the ten specs with rows for every item, refs by position", () => {
    expect(specs.map((s) => s.id)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
    for (const s of specs) {
      expect(s.items.length).toBe(s.item_count);
      for (const it of s.items) expect(it.row.length).toBeGreaterThan(10);
    }
    expect(refOfPosition(spec("01"), "1")).toBe("G01-01");
    expect(refOfPosition(spec("01"), "18")).toBe("G01-18");
    expect(refOfPosition(spec("01"), "19")).toBeNull();
    expect(refOfPosition(spec("01"), "x")).toBeNull();
  });

  it("passes a run whose answer matches the expectation, in two logged calls, and prints the line", async () => {
    const expected = spec("01");
    const { fetch, calls } = transport(perfect(expected));
    const before = await aiRuns.count(ws);
    const run = await runSpec(expected, ws, projectId, { fetch });
    expect(calls).toHaveLength(2);
    expect(calls[0].data).toContain("[1] Every shop can place the next-day order");
    expect(calls[0].data).not.toContain("area:");
    expect(calls[1].data).toContain("[G01-01]\nORIGINAL: Every shop");
    expect(run.score).toMatchObject({ pass: true, found: 18, missed: 0, invented: 0, meaningChanged: 0, areasNamed: 4, areasGiven: 4, placedRight: 18, placedJudged: 18, ambiguityExpected: 2, ambiguityRaised: 2, ambiguityMatched: 2, duplicatesExpected: 1, duplicatesRaised: 1, duplicatesMatched: 1, glossaryTerms: 0, failures: [] });
    expect(run.costCents).toBeGreaterThan(0);
    expect(run.model).toBe(DEFAULT_MODEL);
    expect(await aiRuns.count(ws)).toBe(before + 2);
    expect(line(run.score, run.costCents)).toBe(`PASS 01 Bakery chain ordering: found 18/18, missed 0, invented 0, meaning changed 0, tokens missing 0, areas 4/4 named (4 given), placed 18/18, ambiguity 2 expected, 2 raised, 2 matched, duplicates 1 expected, 1 raised, 1 matched, ${run.costCents} cent(s)`);
  });

  it("fails on a changed meaning or an addition the judge reports, and counts a missing token", async () => {
    const expected = spec("01");
    // G01-03 loses "not hidden"; G01-10 gets a sentence the row does not have.
    const shape = perfect(expected, (ref, reader) => (ref === "G01-03" ? "Products out of production are greyed out." : ref === "G01-10" ? reader + " Shops get a weekly price list by email." : reader));
    const { fetch } = transport(shape, ["G01-03"], ["G01-10"]);
    const run = await runSpec(expected, ws, projectId, { fetch });
    expect(run.score).toMatchObject({ pass: false, found: 17, meaningChanged: 1, invented: 1, tokensMissing: 1 });
    expect(run.score.failures).toEqual(["1 invented", "1 meaning changed"]);
    expect(run.score.items.find((i) => i.ref === "G01-03")).toMatchObject({ tokensMissing: ["not hidden"], meaningChanged: true, found: false });
    expect(line(run.score, run.costCents)).toContain("FAIL 01");
  });

  it("fails a context spec whose reader version renames a glossary term, and accepts an alias and a reversed duplicate", async () => {
    const ski = spec("04");
    const shape = perfect(ski, (ref, reader) => (ref === "G04-02" ? reader.replace("SkiPass+", "the premium season pass") : reader));
    shape.areas[0].name = "Tickets";
    const run = await runSpec(ski, ws, projectId, { fetch: transport(shape).fetch });
    expect(run.score).toMatchObject({ pass: false, glossaryTerms: 5, glossaryMissing: 1, areasNamed: 4 });
    expect(run.score.failures).toEqual(["1 glossary term(s) not kept"]);
    // Spec 08: the model flags the earlier item as the duplicate; the pair still matches.
    const wash = spec("08");
    const reversed = perfect(wash);
    const pos = (ref: string) => String(wash.items.findIndex((i) => i.ref === ref) + 1);
    reversed.items.find((i) => i.ref === pos("G08-13"))!.flags.duplicateOf = null;
    reversed.items.find((i) => i.ref === pos("G08-05"))!.flags.duplicateOf = pos("G08-13");
    expect(score(wash, reversed, new Map())).toMatchObject({ duplicatesExpected: 1, duplicatesRaised: 1, duplicatesMatched: 1 });
  });

  it("reports a refused shaping call as a failed spec with no judge call", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const run = await runSpec(spec("02"), ws, projectId, { fetch: transport(perfect(spec("02"))).fetch });
    process.env.ANTHROPIC_API_KEY = "test-key-for-the-fake-transport";
    expect(run.score.pass).toBe(false);
    expect(run.score.failures).toEqual(["shaping refused: failed"]);
    expect(run.error).toContain("ANTHROPIC_API_KEY is not set");
    expect(run.costCents).toBe(0);
  });
});
