// assertStrict() (stories/E4-1, acceptance 5): a loose object anywhere in the schema is
// refused at the call, through every container zod 4 has.
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { assertStrict } from "./strict";

const loose = z.object({ a: z.string() });
const strict = z.strictObject({ a: z.string() });

describe("assertStrict", () => {
  it("accepts strict objects through every container", () => {
    const Node: z.ZodType = z.lazy(() => z.strictObject({ children: z.array(Node) }));
    const schema = z.strictObject({
      arr: z.array(strict), rec: z.record(z.string(), strict), map: z.map(z.string(), strict), set: z.set(strict),
      tup: z.tuple([strict], strict), inter: z.intersection(strict, z.strictObject({ b: z.number() })), pipe: strict.pipe(strict),
      opt: strict.optional(), nul: strict.nullable(), def: strict.default({ a: "x" }), uni: z.union([strict, z.string()]), tree: Node,
    });
    expect(() => assertStrict(schema)).not.toThrow();
  });
  it("names the loose object by its path", () => {
    const cases: [z.ZodType, string][] = [
      [loose, "root"],
      [z.strictObject({ arr: z.array(loose) }), "root.arr[]"],
      [z.strictObject({ rec: z.record(z.string(), loose) }), "root.rec[]"],
      [z.strictObject({ tup: z.tuple([z.string(), loose]) }), "root.tup[1]"],
      [z.strictObject({ tup: z.tuple([z.string()], loose) }), "root.tup[]"],
      [z.strictObject({ inter: z.intersection(strict, loose) }), "root.inter"],
      [z.strictObject({ pipe: strict.pipe(loose) }), "root.pipe"],
      [z.strictObject({ lazy: z.lazy(() => loose) }), "root.lazy"],
      [z.strictObject({ opt: loose.optional() }), "root.opt"],
      [z.strictObject({ uni: z.union([z.string(), loose]) }), "root.uni"],
    ];
    for (const [schema, at] of cases) expect(() => assertStrict(schema)).toThrow(`not strict at ${at}.`);
  });
});
