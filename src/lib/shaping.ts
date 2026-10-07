// Shaping a set (stories/E4-2): the prompt from the set's items, the model through E4-1's
// route, the checks the schema cannot make, the one transaction that applies the answer;
// the PM's move of an item; and the groups the Shape page draws. Copy: SHAPE_COPY in
// src/lib/shaping-copy.ts (no database import, so the client components use it);
// docs/copy/app.md (Shape) and docs/copy/errors.md (Shaping).
import { items as itemQueries, projects } from "@/db/queries";
import { applyShaping, dismissItemFlags, moveItem, setReaderStatus, setReaderStatusForItems, type Placement } from "@/db/queries/shaping";
import type { Item } from "@/db/queries/items";
import type { ItemSet } from "@/db/queries/itemSets";
import type { ProjectContext, ShapeArea } from "@/db/types";
import { contextOf } from "@/lib/ai/context";
import { AI_COPY } from "@/lib/ai/copy";
import { INPUT_CHARS_MAX, runModel, type RunDeps } from "@/lib/ai/client";
import { buildShapePrompt } from "@/lib/ai/prompts/shape";
import { AREAS_MAX, AREAS_MIN, ShapeOutput } from "@/lib/ai/shape-schema";
import { NotFoundError } from "@/lib/errors";
import { latestSet } from "@/lib/imports";
import { hasReaderVersion, READER_MAX, readerIsOriginal } from "@/lib/item-text";
import { requireRole, type Actor } from "@/lib/members";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { SHAPE_COPY } from "@/lib/shaping-copy";
import { track } from "@/lib/analytics";
import { log } from "@/lib/log";

export { SHAPE_COPY };

// The ceilings before a call (INTERFACES.md, AI shaping output): the schema's limits on the
// imported names, and the items one answer can carry inside E4-1's 16,000 output tokens at
// about 40 tokens per item (an estimate; the golden set runner, E4-6, will show real
// numbers). A longer list is refused with its own message; chunking is a decision for Mihai.
export const ITEMS_MAX = 400;
export const AREA_NAME_MAX = 60;
export const IMPORTED_AREAS_MAX = 12;

export const ref = (it: Item) => String(it.position);
const fold = (s: string) => s.replace(/\s+/g, " ").trim();

// The checks on top of the schema (INTERFACES.md, AI shaping output). The reason carries
// counts, never item text (E4-1: the detail goes to the server log). importedOf maps a ref
// to the area it came with, when the import had an area column; kept lists the areas the PM
// moved items into, which the answer must name.
export function checkShape(out: ShapeOutput, refs: string[], importedAreas: string[] | null, importedOf: Map<string, string> = new Map(), kept: string[] = []): string | null {
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
  const blankReaders = out.items.filter((i) => fold(i.reader) === "").length;
  if (blankReaders > 0) return `${blankReaders} blank reader version(s)`;
  const names = out.areas.map((a) => fold(a.name));
  if (names.some((n) => n === "")) return "a blank area name";
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return "an area name appears twice";
  if (importedAreas) {
    const wrong = names.filter((n) => !importedAreas.includes(n)).length;
    const lost = importedAreas.filter((n) => !names.includes(n)).length;
    if (wrong > 0 || lost > 0) return `imported areas not kept: ${wrong} renamed, ${lost} missing`;
    let strayed = 0;
    for (const a of out.areas) for (const r of a.items) { const came = importedOf.get(r); if (came && came !== fold(a.name)) strayed += 1; }
    if (strayed > 0) return `${strayed} item(s) moved out of the area they came with`;
  } else {
    if (out.areas.length < AREAS_MIN || out.areas.length > AREAS_MAX) return `${out.areas.length} areas, expected ${AREAS_MIN} to ${AREAS_MAX}`;
    const lost = kept.filter((k) => !names.includes(k)).length;
    if (lost > 0) return `${lost} area(s) the PM moved items into missing`;
  }
  return null;
}

// A duplicateOf that names an unknown ref, the item itself or a later item is dropped, not
// refused (E4-4, acceptance 4).
export function cleanDuplicateOf(ref: string, duplicateOf: string | null, refs: string[]): string | null {
  if (duplicateOf === null) return null;
  const at = refs.indexOf(duplicateOf);
  return at >= 0 && at < refs.indexOf(ref) ? duplicateOf : null;
}

// retry: the refusal is worth a second try (the AI did not answer, or answered badly);
// a budget, plan, size or sample refusal is not.
export type ShapeResult = { error: string; retry: boolean } | { set: ItemSet; items: number; areas: number };

export async function shapeSet(actor: Actor, projectId: string, deps?: RunDeps): Promise<ShapeResult> {
  await requireRole(actor, "projects.shape");
  const project = await projects.get(actor.ws, projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) return { error: AI_COPY.sample, retry: false };
  const set = await latestSet(actor.ws, project.id);
  if (!set) return { error: SHAPE_COPY.noSet, retry: false };
  const rows = await itemQueries.forSet(actor.ws, set.id);
  if (rows.length === 0) return { error: SHAPE_COPY.noSet, retry: false };
  if (rows.length > ITEMS_MAX) return { error: SHAPE_COPY.tooManyItems(rows.length), retry: false };
  // What the model is told about each item's area: the one it came with (kept from the
  // first run on as flags.importedArea), or the one the PM moved it to (sent as "keep in").
  // An area the model gave on an earlier run is sent as none, so the re-run places the item
  // again (acceptance 4).
  const imported = (it: Item) => it.flags?.importedArea ?? (it.flags?.areaBy === undefined ? it.area : null);
  const kept = (it: Item) => (it.flags?.areaBy === "pm" ? it.area : null);
  const context = contextOf({ goal: project.contextGoal, terms: project.contextTerms });
  const prompt = buildShapePrompt(rows.map((it) => ({ ref: ref(it), text: it.originalText, area: imported(it), keep: kept(it) })), context);
  if (prompt.importedAreas) {
    if (prompt.importedAreas.length > IMPORTED_AREAS_MAX) return { error: SHAPE_COPY.tooManyAreas(prompt.importedAreas.length), retry: false };
    const long = prompt.importedAreas.find((a) => a.length > AREA_NAME_MAX);
    if (long) return { error: SHAPE_COPY.longArea(long.length), retry: false };
  }
  if (prompt.instructions.length + prompt.data.length > INPUT_CHARS_MAX) return { error: SHAPE_COPY.tooLong(prompt.instructions.length + prompt.data.length), retry: false };
  const refs = rows.map(ref);
  const importedOf = new Map(rows.filter((it) => imported(it) && !kept(it)).map((it) => [ref(it), fold(imported(it)!)]));
  const keptAreas = [...new Set(rows.map(kept).filter((k): k is string => k !== null).map(fold))];
  const result = await runModel({ ws: actor.ws, projectId: project.id, purpose: "shape", instructions: prompt.instructions, data: prompt.data, schema: ShapeOutput, check: (out) => checkShape(out, refs, prompt.importedAreas, importedOf, keptAreas) }, deps);
  if (!result.ok) {
    // Every refusal leaves a line, so a paused product or a spent budget is in the log.
    log("error", "Shaping did not run.", { set: set.id, reason: result.reason, detail: result.detail });
    // The developer menu's "Off" (E4-8) is a developer's own switch, not a run that failed:
    // no event, so the rescue tip (E15-4) does not fire.
    if (result.reason !== "off") await track("shape_failed", { reason: result.reason, project: project.id }, { workspaceId: actor.ws, userId: actor.userId });
    return { error: result.message, retry: result.reason === "failed" || result.reason === "invalid" };
  }
  const byRef = new Map(rows.map((it) => [ref(it), it]));
  const readers = new Map(result.output.items.map((i) => [i.ref, i]));
  const areas: ShapeArea[] = result.output.areas.map((a) => ({ name: fold(a.name), rationale: fold(a.rationale) }));
  const placements: Placement[] = [];
  for (const area of result.output.areas) {
    for (const r of area.items) {
      const it = byRef.get(r)!;
      const answer = readers.get(r)!;
      placements.push({
        itemId: it.id, area: fold(area.name),
        byAi: imported(it) === null,
        importedArea: imported(it) ? fold(imported(it)!) : null,
        reader: fold(answer.reader), ambiguity: answer.flags.ambiguity && SHAPE_COPY.sentence(answer.flags.ambiguity) !== "" ? fold(answer.flags.ambiguity) : null, duplicateOf: cleanDuplicateOf(r, answer.flags.duplicateOf, refs),
      });
    }
  }
  const updated = await applyShaping(actor.ws, set.id, areas, placements, context);
  if (!updated) throw new NotFoundError();
  await track("shape_run", { items: rows.length, costCents: result.run.costEurCents }, { workspaceId: actor.ws, userId: actor.userId });
  return { set: updated, items: rows.length, areas: areas.length };
}

export async function moveItemTo(actor: Actor, projectId: string, itemId: string, rawArea: unknown): Promise<{ error: string } | { item: Item }> {
  await requireRole(actor, "projects.shape");
  const project = await projects.get(actor.ws, projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) return { error: PROJECTS_COPY.sample };
  const set = await latestSet(actor.ws, project.id);
  if (!set) throw new NotFoundError();
  if (!set.shapedAt) return { error: SHAPE_COPY.notShapedYet };
  const rows = await itemQueries.forSet(actor.ws, set.id);
  const target = rows.find((it) => it.id === itemId);
  if (!target) throw new NotFoundError();
  const area = typeof rawArea === "string" ? fold(rawArea) : "";
  const known = areaNames(set, rows).find((a) => a === area);
  if (!known) return { error: SHAPE_COPY.unknownArea };
  if (target.area === area) return { item: target };
  const rationale = (set.areas ?? []).find((a) => a.name === area)?.rationale ?? rows.find((it) => it.area === area && it.areaRationale)?.areaRationale ?? null;
  const item = await moveItem(actor.ws, target.id, area, rationale);
  if (!item) throw new NotFoundError();
  return { item };
}

// The areas in order: the model's (E4-2), then any area an item carries that the set does
// not name (an imported area before shaping, a name typed in a later story).
export function areaNames(set: Pick<ItemSet, "areas">, rows: Item[]): string[] {
  const names = (set.areas ?? []).map((a) => a.name);
  for (const it of rows) if (it.area && !names.includes(it.area)) names.push(it.area);
  return names;
}

export type AreaGroup = { name: string; rationale: string | null; items: Item[] };

export function groupByArea(set: Pick<ItemSet, "areas">, rows: Item[]): AreaGroup[] {
  const groups: AreaGroup[] = areaNames(set, rows).map((name) => ({ name, rationale: (set.areas ?? []).find((a) => a.name === name)?.rationale ?? rows.find((it) => it.area === name && it.areaRationale)?.areaRationale ?? null, items: rows.filter((it) => it.area === name) }));
  const loose = rows.filter((it) => !it.area);
  if (loose.length > 0) groups.push({ name: SHAPE_COPY.notShaped, rationale: null, items: loose });
  return groups;
}

// "Placed by AI" is shown only when the import had an area column: an item the model placed
// among areas the PM gave (acceptance 2). Before the first run the imported area is item.area
// of an item nobody has placed; from then on it is flags.importedArea, moves included.
export function hadImportedAreas(rows: Item[]): boolean {
  return rows.some((it) => it.flags?.importedArea !== undefined || (it.area !== null && it.flags?.areaBy === undefined));
}

// Reader versions (stories/E4-3): Accept, Reject, Undo per item (acceptance 1), the edit
// that accepts its own text (acceptance 7), and Accept all or Reject all over a set's
// suggested versions in one update (the count comes back for the line that confirms it).
// Nothing here touches original_text; the respondent side reads textFor() (src/lib/item-text.ts).
export type ReaderMove = "accept" | "reject" | "undo";

async function ownItem(actor: Actor, projectId: string, itemId: string): Promise<{ error: string } | { set: ItemSet; item: Item }> {
  await requireRole(actor, "projects.shape");
  const project = await projects.get(actor.ws, projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) return { error: PROJECTS_COPY.sample };
  const set = await latestSet(actor.ws, project.id);
  if (!set) throw new NotFoundError();
  const item = (await itemQueries.forSet(actor.ws, set.id)).find((it) => it.id === itemId);
  if (!item) throw new NotFoundError();
  return { set, item };
}

// Accept and Reject apply to a suggested version, Undo to a decided one; a decision made on
// a page that no longer matches the row changes nothing and the page shows the current state.
export async function decideReader(actor: Actor, projectId: string, itemId: string, move: ReaderMove): Promise<{ error: string } | { item: Item }> {
  const own = await ownItem(actor, projectId, itemId);
  if ("error" in own) return own;
  if (readerIsOriginal(own.item)) return { error: SHAPE_COPY.sameAsOriginal };
  if (!hasReaderVersion(own.item)) return { error: SHAPE_COPY.noReader };
  const item = await setReaderStatus(actor.ws, own.item.id, move === "accept" ? "accepted" : move === "reject" ? "rejected" : "suggested", move === "undo" ? ["accepted", "rejected"] : ["suggested"]);
  return { item: item ?? own.item };
}

// An edit that writes the original back is a rejection: the original is kept, the model's
// wording stays as the suggestion for Undo.
export async function editReader(actor: Actor, projectId: string, itemId: string, rawText: unknown): Promise<{ error: string } | { item: Item }> {
  const own = await ownItem(actor, projectId, itemId);
  if ("error" in own) return own;
  if (!hasReaderVersion(own.item)) return { error: SHAPE_COPY.noReader };
  const text = typeof rawText === "string" ? fold(rawText) : "";
  if (text === "") return { error: SHAPE_COPY.blankEdit };
  if (text.length > READER_MAX) return { error: SHAPE_COPY.longEdit(text.length) };
  const same = text === fold(own.item.originalText);
  const item = same
    ? await setReaderStatus(actor.ws, own.item.id, "rejected", ["suggested", "accepted", "rejected"])
    : await setReaderStatus(actor.ws, own.item.id, "accepted", ["suggested", "accepted", "rejected"], text);
  if (!item) throw new NotFoundError();
  return { item };
}

export async function decideAllReaders(actor: Actor, projectId: string, move: "accept" | "reject"): Promise<{ error: string } | { count: number }> {
  await requireRole(actor, "projects.shape");
  const project = await projects.get(actor.ws, projectId);
  if (!project) throw new NotFoundError();
  if (project.isSample) return { error: PROJECTS_COPY.sample };
  const set = await latestSet(actor.ws, project.id);
  if (!set) throw new NotFoundError();
  const ids = (await itemQueries.forSet(actor.ws, set.id)).filter((it) => it.readerStatus === "suggested" && hasReaderVersion(it)).map((it) => it.id);
  return { count: await setReaderStatusForItems(actor.ws, set.id, ids, move === "accept" ? "accepted" : "rejected") };
}

// Flags (stories/E4-4): what the Shape page shows for the model's ambiguity and duplicate
// flags. One entry per flag, in item order (an item with both has two), dismissed items
// left out; a duplicateOf whose target is not in the set is dropped here too (acceptance
// 4). Refs are the source reference when there is one, else the position; two items with
// the same source reference read the same, and only the links tell them apart.
export type ItemFlag =
  | { kind: "ambiguity"; itemId: string; ref: string; what: string }
  | { kind: "duplicate"; itemId: string; ref: string; otherId: string; otherRef: string };

export const displayRef = (it: Item) => it.sourceRef ?? String(it.position);

export function flagsFor(rows: Item[]): ItemFlag[] {
  const byPosition = new Map(rows.map((it) => [String(it.position), it]));
  const out: ItemFlag[] = [];
  for (const it of rows) {
    const flags = it.flags;
    if (!flags || flags.dismissed) continue;
    if (flags.ambiguity) out.push({ kind: "ambiguity", itemId: it.id, ref: displayRef(it), what: flags.ambiguity });
    const other = flags.duplicateOf ? byPosition.get(flags.duplicateOf) : undefined;
    if (other && other.id !== it.id) out.push({ kind: "duplicate", itemId: it.id, ref: displayRef(it), otherId: other.id, otherRef: displayRef(other) });
  }
  return out;
}

export async function dismissFlag(actor: Actor, projectId: string, itemId: string): Promise<{ error: string } | { item: Item }> {
  const own = await ownItem(actor, projectId, itemId);
  if ("error" in own) return own;
  if (!own.item.flags?.ambiguity && !own.item.flags?.duplicateOf) return { error: SHAPE_COPY.noFlag };
  const item = await dismissItemFlags(actor.ws, own.item.id);
  if (!item) throw new NotFoundError();
  return { item };
}

// The context line (stories/E4-5, acceptance 2): after a run, what that run was given; before
// one, what the next run will be given; and a note when the project's context changed since
// the last run. Copy: docs/copy/app.md (Shape).
export type ContextLine = { kind: "none" } | { kind: "used" | "next"; goal: string; terms: string | null; changed: boolean };

export function contextLine(set: Pick<ItemSet, "shapedAt" | "contextUsed">, project: ProjectContext): ContextLine {
  const now = contextOf(project);
  if (set.shapedAt && set.contextUsed) {
    const used = contextOf(set.contextUsed);
    const changed = used.goal !== now.goal || used.terms !== now.terms;
    if (!used.goal && !used.terms) return changed ? { kind: "next", goal: now.goal ?? SHAPE_COPY.noGoal, terms: now.terms, changed: true } : { kind: "none" };
    return { kind: "used", goal: used.goal ?? SHAPE_COPY.noGoal, terms: used.terms, changed };
  }
  if (!now.goal && !now.terms) return { kind: "none" };
  return { kind: "next", goal: now.goal ?? SHAPE_COPY.noGoal, terms: now.terms, changed: false };
}
