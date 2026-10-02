// Writes evals/schema.json from the zod schema (INTERFACES.md, AI shaping output):
// `npm run evals:schema`. A test (src/lib/ai/shape-schema.test.ts) fails when the file is stale.
import { writeFileSync } from "node:fs";
import { shapeJsonSchema } from "@/lib/ai/shape-schema";

writeFileSync("evals/schema.json", JSON.stringify(shapeJsonSchema(), null, 2) + "\n");
console.log("Wrote evals/schema.json.");
