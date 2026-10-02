// Shaping a set (stories/E4-2): the prompt from the set's items, the model through E4-1's
// route, the checks the schema cannot make, the one transaction that applies the answer;
// the PM's move of an item; and the groups the Shape page draws. Copy: SHAPE_COPY in
// src/lib/shaping-copy.ts (no database import, so the client components use it);
// docs/copy/app.md (Shape) and docs/copy/errors.md (Shaping).
import { items as itemQueries, projects } from "@/db/queries";
import { applyShaping, moveItem, type Placement } from "@/db/queries/shaping";
import type { Item } from "@/db/queries/items";
import type { ItemSet } from "@/db/queries/itemSets";
import { AI_COPY } from "@/lib/ai/copy";
import { runModel, type RunDeps } from "@/lib/ai/client";
import { buildShapePrompt } from "@/lib/ai/prompts/shape";
import { AREAS_MAX, AREAS_MIN, ShapeOutput } from "@/lib/ai/shape-schema";
import { NotFoundError } from "@/lib/errors";
import { latestSet } from "@/lib/imports";
import { requireRole, type Actor } from "@/lib/members";
import { SHAPE_COPY } from "@/lib/shaping-copy";

export { SHAPE_COPY };


export const ref = (it: Item) => String(it.position);

// The checks on top of the schema (INTERFACES.md, AI shaping output). The reason carries
// counts, never item text (E4-1: the detail goes to the server log).
export function checkShape(out: ShapeOutput, refs: string[], importedAreas: string[] | null): string | null {
  const known = new Set(refs);
  const seen = new Map<string, number>();
  for (const a of out.areas) for (const r of a.items) seen.set(r, (seen.get(r) ?? 0) + 1);
  const unknown = [...seen.keys()].filter((r) => !known.has(r)).length;
  if (unknown > 0) return `${unknown} unknown ref(s) in areas`;
  const twice = [...seen.values()].filter((n) => n > 1).length;
  if (twice > 0) return `${twice} ref(s) in more than one area`;
  const missing = refs.filter((r) => !seen.has(r)).length;
  if (missing > 0) return `${missing} item(s) in no area`;
  const itemRefs = out.items.map((i) => i.ref);
  const itemUnknown = itemRefs.filter((r) => !known.has(r)).length;
  if (itemUnknown > 0) return `${itemUnknown} unknown ref(s) in items`;
  if (new Set(itemRefs).size !== itemRefs.length) return "a ref appears twice in items";
  const itemMissing = refs.filter((r) => !itemRefs.includes(r)).length;
  if (itemMissing > 0) return `${itemMissing} item(s) without a reader version`;
  const badDuplicate = out.items.filter((i) => i.flags.duplicateOf !== null && !known.has(i.flags.duplicateOf)).length;
  if (badDuplicate > 0) return `${badDuplicate} duplicateOf ref(s) unknown`;
  const names = out.areas.map((a) => a.name);
  if (new Set(names).size !== names.length) return "an area name appears twice";
  if (importedAreas) {
    const wrong = names.filter((n) => !importedAreas.includes(n)).length;
    const lost = importedAreas.filter((n) => !names.includes(n)).length;
    if (wrong > 0 || lost > 0) return `imported areas not kept: ${wrong} renamed, ${lost} missing`;
  } else if (out.areas.length < AREAS_MIN || out.areas.length > AREAS_MAX) {
    return `${out.areas.length} areas, expected ${AREAS_MIN} to ${AREAS_MAX}`;
  }
  return null;
}

export type ShapeResult = { error: string } | { set: ItemSet; items: number; areas: number };

export async function shapeSet(actor: Actor, projectId: string, deps?: RunDeps): Promise<ShapeResult> {
  await requireRole(actor, "projects.shape");
  const project = await projects.get(actor.ws, projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) return { error: AI_COPY.sample };
  const set = await latestSet(actor.ws, project.id);
  if (!set) return { error: SHAPE_COPY.noSet };
  const rows = await itemQueries.forSet(actor.ws, set.id);
  if (rows.length === 0) return { error: SHAPE_COPY.noSet };
  // An area the model gave on an earlier run is not an imported one: the re-run places the
  // item again. An area the PM chose stays (acceptance 4).
  const given = (it: Item) => (it.flags?.placedByAi && !it.flags?.areaMoved ? null : it.area);
  const prompt = buildShapePrompt(rows.map((it) => ({ ref: ref(it), text: it.originalText, area: given(it) })));
  const refs = rows.map(ref);
  const result = await runModel({ ws: actor.ws, projectId: project.id, purpose: "shape", instructions: prompt.instructions, data: prompt.data, schema: ShapeOutput, check: (out) => checkShape(out, refs, prompt.importedAreas) }, deps);
  if (!result.ok) return { error: result.message };
  const byRef = new Map(rows.map((it) => [ref(it), it]));
  const readers = new Map(result.output.items.map((i) => [i.ref, i]));
  const placements: Placement[] = [];
  for (const area of result.output.areas) {
    for (const r of area.items) {
      const it = byRef.get(r)!;
      const answer = readers.get(r)!;
      placements.push({
        itemId: it.id, area: area.name, rationale: area.rationale,
        placedByAi: prompt.importedAreas !== null && given(it) === null,
        reader: answer.reader, ambiguity: answer.flags.ambiguity, duplicateOf: answer.flags.duplicateOf,
      });
    }
  }
  const updated = await applyShaping(actor.ws, set.id, result.output.areas.map((a) => a.name), placements);
  if (!updated) throw new NotFoundError();
  return { set: updated, items: rows.length, areas: result.output.areas.length };
}

export async function moveItemTo(actor: Actor, projectId: string, itemId: string, rawArea: unknown): Promise<{ error: string } | { item: Item }> {
  await requireRole(actor, "projects.shape");
  const project = await projects.get(actor.ws, projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) return { error: AI_COPY.sample };
  const set = await latestSet(actor.ws, project.id);
  if (!set) throw new NotFoundError();
  const rows = await itemQueries.forSet(actor.ws, set.id);
  const target = rows.find((it) => it.id === itemId);
  if (!target) throw new NotFoundError();
  const area = typeof rawArea === "string" ? rawArea.trim() : "";
  const areas = areaNames(set, rows);
  if (!areas.includes(area)) return { error: SHAPE_COPY.unknownArea };
  const rationale = rows.find((it) => it.area === area && it.areaRationale)?.areaRationale ?? null;
  const item = await moveItem(actor.ws, target.id, area, rationale);
  if (!item) throw new NotFoundError();
  return { item };
}

// The areas in order: the model's order first (E4-2), then any area an item carries that the
// order does not name (an imported area before shaping, a name typed in a later story).
export function areaNames(set: Pick<ItemSet, "areaOrder">, rows: Item[]): string[] {
  const names = [...(set.areaOrder ?? [])];
  for (const it of rows) if (it.area && !names.includes(it.area)) names.push(it.area);
  return names;
}

export type AreaGroup = { name: string; rationale: string | null; items: Item[] };

export function groupByArea(set: Pick<ItemSet, "areaOrder">, rows: Item[]): AreaGroup[] {
  const groups: AreaGroup[] = areaNames(set, rows).map((name) => ({ name, rationale: rows.find((it) => it.area === name && it.areaRationale)?.areaRationale ?? null, items: rows.filter((it) => it.area === name) }));
  const loose = rows.filter((it) => !it.area);
  if (loose.length > 0) groups.push({ name: SHAPE_COPY.notShaped, rationale: null, items: loose });
  return groups;
}
