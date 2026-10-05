// The AI shaping output (INTERFACES.md, "AI shaping output"; stories/E4-2). Every object
// strict (E4-1). The length limits reach the API as description hints (the SDK moves
// keywords structured output does not take into the description,
// node_modules/@anthropic-ai/sdk/lib/transform-json-schema.js) and are enforced here on the
// answer. evals/schema.json is written from this schema by `npm run evals:schema`.
import { z } from "zod";

export const AREAS_MIN = 3;
export const AREAS_MAX = 8;

export const ShapeOutput = z.strictObject({
  areas: z.array(z.strictObject({
    name: z.string().min(1).max(60).describe("The area's name, two to four words, as a reader would see it"),
    rationale: z.string().min(1).max(200).describe("One sentence on why this area comes here, such as: This comes first, because every claim starts here."),
    items: z.array(z.string()).min(1).describe("The refs of the items in this area, in reading order"),
  })).min(1).max(12).describe("Every item in exactly one area, the areas in reading order"),
  items: z.array(z.strictObject({
    ref: z.string().describe("The item's ref as given"),
    reader: z.string().min(1).max(1000).describe("The item in plain words a non-expert reads in one go, keeping every number, name and negative"),
    flags: z.strictObject({
      ambiguity: z.string().max(300).nullable().describe("What the item does not say, when a respondent could not rate it without asking; else null"),
      duplicateOf: z.string().nullable().describe("The ref of an earlier item this one says the same as; else null"),
    }),
  })).min(1),
});

export type ShapeOutput = z.infer<typeof ShapeOutput>;

export function shapeJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(ShapeOutput) as Record<string, unknown>;
}
