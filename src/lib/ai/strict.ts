// Every object in an output schema must be strict (stories/E4-1, acceptance 5): an extra
// field anywhere in the answer fails validation instead of being stripped. zod 4 keeps a
// schema's definition at `_zod.def` (node_modules/zod/v4/core/schemas.d.ts): an object has
// `shape` and `catchall` (z.strictObject sets catchall to never), an array has `element`,
// a wrapper (optional, nullable, default) has `innerType`, a union has `options`. The walk
// throws at the call, so a caller with a loose schema fails in its own test.
import type { z } from "zod";

type Def = { type: string; shape?: Record<string, z.ZodType>; catchall?: z.ZodType; element?: z.ZodType; innerType?: z.ZodType; options?: z.ZodType[] };

const defOf = (schema: z.ZodType): Def => (schema as unknown as { _zod: { def: Def } })._zod.def;

export function assertStrict(schema: z.ZodType, path = "root"): void {
  const def = defOf(schema);
  if (def.type === "object") {
    if (!def.catchall || defOf(def.catchall).type !== "never") throw new Error(`The AI output schema is not strict at ${path}. Use z.strictObject so an extra field fails (stories/E4-1).`);
    for (const [key, child] of Object.entries(def.shape ?? {})) assertStrict(child, `${path}.${key}`);
  }
  if (def.element) assertStrict(def.element, `${path}[]`);
  if (def.innerType) assertStrict(def.innerType, path);
  for (const option of def.options ?? []) assertStrict(option, path);
}
