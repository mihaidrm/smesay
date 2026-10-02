// The shaping output schema (INTERFACES.md, AI shaping output): strict everywhere, the
// limits enforced, and evals/schema.json in step with it (stories/E4-2).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { shapeJsonSchema, ShapeOutput } from "./shape-schema";
import { assertStrict } from "./strict";

const good = { areas: [{ name: "Ordering", rationale: "First, because every order starts here.", items: ["1", "2"] }], items: [{ ref: "1", reader: "Shops order by phone until 16:00.", flags: { ambiguity: null, duplicateOf: null } }, { ref: "2", reader: "The form shows last week's order.", flags: { ambiguity: "Which week counts as last week.", duplicateOf: null } }] };

describe("ShapeOutput", () => {
  it("is strict at every level", () => {
    expect(() => assertStrict(ShapeOutput)).not.toThrow();
    expect(ShapeOutput.safeParse(good).success).toBe(true);
    expect(ShapeOutput.safeParse({ ...good, extra: 1 }).success).toBe(false);
    expect(ShapeOutput.safeParse({ ...good, items: [{ ...good.items[0], flags: { ambiguity: null, duplicateOf: null, note: "x" } }] }).success).toBe(false);
  });
  it("refuses an empty area, a long name and more than twelve areas", () => {
    expect(ShapeOutput.safeParse({ ...good, areas: [{ ...good.areas[0], items: [] }] }).success).toBe(false);
    expect(ShapeOutput.safeParse({ ...good, areas: [{ ...good.areas[0], name: "x".repeat(61) }] }).success).toBe(false);
    expect(ShapeOutput.safeParse({ ...good, areas: Array.from({ length: 13 }, () => good.areas[0]) }).success).toBe(false);
  });
  it("matches evals/schema.json", () => {
    expect(JSON.parse(readFileSync("evals/schema.json", "utf8"))).toEqual(shapeJsonSchema());
  });
});
