// Applying a shaping answer (stories/E4-2, acceptance 2 to 4) in one transaction: every item
// of the set gets its area and the area's rationale, the reader version as suggested (E4-3
// shows it; an accepted or rejected one is left alone), the model's flags (a dismissed flag
// stays dismissed, E4-4), and placedByAi where the import had no area for it. An item the PM
// moved (flags.areaMoved) keeps its area; its rationale follows that area's new wording when
// the area is still there. The set records the area order, the run count and the time.
// moveItem is the PM's move: area and rationale set, areaMoved on, nothing else touched.
// db.transaction and `.for("update")` as in importCommit.ts.
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { item, itemSet } from "@/db/schema";
import type { ItemFlags, WorkspaceId } from "@/db/types";
import type { ItemSet } from "./itemSets";
import type { Item } from "./items";

export type Placement = { itemId: string; area: string; rationale: string; placedByAi: boolean; reader: string; ambiguity: string | null; duplicateOf: string | null };

export async function applyShaping(workspaceId: WorkspaceId, itemSetId: string, areaOrder: string[], placements: Placement[]): Promise<ItemSet | null> {
  return db.transaction(async (tx) => {
    const [locked] = await tx.select().from(itemSet).where(and(eq(itemSet.workspaceId, workspaceId), eq(itemSet.id, itemSetId))).for("update");
    if (!locked) return null;
    const rows = await tx.select().from(item).where(and(eq(item.workspaceId, workspaceId), eq(item.itemSetId, itemSetId)));
    const byId = new Map(rows.map((r) => [r.id, r]));
    const rationaleOf = new Map(placements.map((p) => [p.area, p.rationale]));
    for (const p of placements) {
      const row = byId.get(p.itemId);
      if (!row) continue;
      const flags = row.flags ?? {};
      const moved = flags.areaMoved === true && row.area !== null;
      const area = moved ? row.area! : p.area;
      const next: ItemFlags = {
        ...flags,
        placedByAi: moved ? flags.placedByAi : p.placedByAi,
        ...(p.ambiguity ? { ambiguity: p.ambiguity } : {}),
        ...(p.duplicateOf ? { duplicateOf: p.duplicateOf } : {}),
      };
      if (!p.ambiguity) delete next.ambiguity;
      if (!p.duplicateOf) delete next.duplicateOf;
      if (!next.placedByAi) delete next.placedByAi;
      const keepReader = row.readerStatus === "accepted" || row.readerStatus === "rejected";
      await tx.update(item).set({
        area,
        areaRationale: rationaleOf.get(area) ?? row.areaRationale,
        readerText: keepReader ? row.readerText : p.reader,
        readerStatus: keepReader ? row.readerStatus : "suggested",
        flags: Object.keys(next).length > 0 ? next : null,
      }).where(and(eq(item.workspaceId, workspaceId), eq(item.id, row.id)));
    }
    const [updated] = await tx.update(itemSet).set({ areaOrder, shapeRuns: sql`${itemSet.shapeRuns} + 1`, shapedAt: new Date() }).where(and(eq(itemSet.workspaceId, workspaceId), eq(itemSet.id, itemSetId))).returning();
    return updated ?? null;
  });
}

export async function moveItem(workspaceId: WorkspaceId, itemId: string, area: string, rationale: string | null): Promise<Item | null> {
  const [row] = await db.select().from(item).where(and(eq(item.workspaceId, workspaceId), eq(item.id, itemId)));
  if (!row) return null;
  const flags: ItemFlags = { ...(row.flags ?? {}), areaMoved: true };
  delete flags.placedByAi;
  const [updated] = await db.update(item).set({ area, areaRationale: rationale, flags }).where(and(eq(item.workspaceId, workspaceId), eq(item.id, itemId))).returning();
  return updated ?? null;
}
