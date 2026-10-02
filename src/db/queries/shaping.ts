// Applying a shaping answer (stories/E4-2, acceptance 2 to 4) in one transaction: every item
// of the set gets its area and the area's rationale, the reader version as suggested (E4-3
// shows it; an accepted or rejected one is left alone), the model's flags (a dismissed flag
// stays dismissed, E4-4), and areaBy "ai" where the model chose the area. An item the PM
// moved (areaBy "pm") keeps its area; its rationale follows that area's new wording when the
// area is still there. The set records the areas with their rationale, the run count and
// the time. The set row and the item rows are read under a lock, and moveItem reads its row
// under one too, so a run and a move never write over each other's read. moveItem is the
// PM's move: area and rationale set, areaBy "pm", nothing else touched. db.transaction and `.for("update")` as in importCommit.ts.
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { item, itemSet } from "@/db/schema";
import type { ItemFlags, ShapeArea, WorkspaceId } from "@/db/types";
import type { ItemSet } from "./itemSets";
import type { Item } from "./items";

export type Placement = { itemId: string; area: string; byAi: boolean; importedArea: string | null; reader: string; ambiguity: string | null; duplicateOf: string | null };

export async function applyShaping(workspaceId: WorkspaceId, itemSetId: string, areas: ShapeArea[], placements: Placement[]): Promise<ItemSet | null> {
  return db.transaction(async (tx) => {
    const [locked] = await tx.select().from(itemSet).where(and(eq(itemSet.workspaceId, workspaceId), eq(itemSet.id, itemSetId))).for("update");
    if (!locked) return null;
    const rows = await tx.select().from(item).where(and(eq(item.workspaceId, workspaceId), eq(item.itemSetId, itemSetId))).for("update");
    const byId = new Map(rows.map((r) => [r.id, r]));
    const rationaleOf = new Map(areas.map((a) => [a.name, a.rationale]));
    for (const p of placements) {
      const row = byId.get(p.itemId);
      if (!row) continue;
      const flags = row.flags ?? {};
      const moved = flags.areaBy === "pm" && row.area !== null;
      const area = moved ? row.area! : p.area;
      const next: ItemFlags = { ...flags };
      delete next.ambiguity;
      delete next.duplicateOf;
      if (p.ambiguity) next.ambiguity = p.ambiguity;
      if (p.duplicateOf) next.duplicateOf = p.duplicateOf;
      if (p.importedArea) next.importedArea = p.importedArea;
      if (!moved) {
        if (p.byAi) next.areaBy = "ai";
        else delete next.areaBy;
      }
      const keepReader = row.readerStatus === "accepted" || row.readerStatus === "rejected";
      await tx.update(item).set({
        area,
        areaRationale: rationaleOf.get(area) ?? row.areaRationale,
        readerText: keepReader ? row.readerText : p.reader,
        readerStatus: keepReader ? row.readerStatus : "suggested",
        flags: Object.keys(next).length > 0 ? next : null,
      }).where(and(eq(item.workspaceId, workspaceId), eq(item.id, row.id)));
    }
    const [updated] = await tx.update(itemSet).set({ areas, shapeRuns: sql`${itemSet.shapeRuns} + 1`, shapedAt: new Date() }).where(and(eq(itemSet.workspaceId, workspaceId), eq(itemSet.id, itemSetId))).returning();
    return updated ?? null;
  });
}

export async function moveItem(workspaceId: WorkspaceId, itemId: string, area: string, rationale: string | null): Promise<Item | null> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(item).where(and(eq(item.workspaceId, workspaceId), eq(item.id, itemId))).for("update");
    if (!row) return null;
    const flags: ItemFlags = { ...(row.flags ?? {}), areaBy: "pm" };
    const [updated] = await tx.update(item).set({ area, areaRationale: rationale, flags }).where(and(eq(item.workspaceId, workspaceId), eq(item.id, itemId))).returning();
    return updated ?? null;
  });
}
