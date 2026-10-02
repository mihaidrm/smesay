// Every object in an output schema must be strict (stories/E4-1, acceptance 5): an extra
// field anywhere in the answer fails validation instead of being stripped. zod 4 keeps a
// schema's definition at `_zod.def` (node_modules/zod/v4/core/schemas.d.ts): an object has
// `shape` and `catchall` (z.strictObject sets catchall to never); the children of the other
// kinds sit under element (array), valueType (record, map, set), items and rest (tuple),
// left and right (intersection), in and out (pipe), getter (lazy), innerType (optional,
// nullable, default), options (union). The walk throws at the call, so a caller with a loose
// schema fails in its own test. A lazy schema is followed once, so a recursive one ends.
import type { z } from "zod";

type Def = {
  type: string;
  shape?: Record<string, z.ZodType>;
  catchall?: z.ZodType;
  element?: z.ZodType;
  valueType?: z.ZodType;
  items?: z.ZodType[];
  rest?: z.ZodType | null;
  left?: z.ZodType;
  right?: z.ZodType;
  in?: z.ZodType;
  out?: z.ZodType;
  getter?: () => z.ZodType;
  innerType?: z.ZodType;
  options?: z.ZodType[];
};

const defOf = (schema: z.ZodType): Def => (schema as unknown as { _zod: { def: Def } })._zod.def;

export function assertStrict(schema: z.ZodType, path = "root", seen = new Set<z.ZodType>()): void {
  if (seen.has(schema)) return;
  seen.add(schema);
  const def = defOf(schema);
  const walk = (child: z.ZodType | null | undefined, at: string) => { if (child) assertStrict(child, at, seen); };
  if (def.type === "object") {
    if (!def.catchall || defOf(def.catchall).type !== "never") throw new Error(`The AI output schema is not strict at ${path}. Use z.strictObject so an extra field fails (stories/E4-1).`);
    for (const [key, child] of Object.entries(def.shape ?? {})) walk(child, `${path}.${key}`);
  }
  walk(def.element, `${path}[]`);
  walk(def.valueType, `${path}[]`);
  (def.items ?? []).forEach((item, i) => walk(item, `${path}[${i}]`));
  walk(def.rest, `${path}[]`);
  walk(def.left, path);
  walk(def.right, path);
  walk(def.in, path);
  walk(def.out, path);
  if (def.getter) walk(def.getter(), path);
  walk(def.innerType, path);
  for (const option of def.options ?? []) walk(option, path);
}
