// The import commit (stories/E3-5, acceptance 3): one transaction creates the item_set
// (version max + 1 for the project, never renumbered, E1-2; source, filename, the report,
// who imported, the upload it came from) and its items with position, source_ref,
// original_text, area, proposed value and custom fields. A failure anywhere rolls the whole
// set back, so nothing is imported. The version row of the project is read under a lock
// (`for update` on the project row: orm.drizzle.team/docs/rqb#select-for-update, and
// db.transaction: orm.drizzle.team/docs/transactions) so two commits at once get two numbers.
import { and, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { item, itemSet, project } from "@/db/schema";
import type { ImportReport, WorkspaceId } from "@/db/types";
import type { ItemSet } from "./itemSets";

export type CommitItem = { ref: string | null; text: string; area: string | null; value: string | null; custom: { [header: string]: string } | null };
export type CommitInput = { projectId: string; uploadId: string | null; source: "xlsx" | "csv" | "pasted"; filename: string | null; report: ImportReport; items: CommitItem[]; userId: string };

export async function commitImport(workspaceId: WorkspaceId, input: CommitInput): Promise<ItemSet | null> {
  return db.transaction(async (tx) => {
    const [locked] = await tx.select({ id: project.id }).from(project).where(and(eq(project.workspaceId, workspaceId), eq(project.id, input.projectId))).for("update");
    if (!locked) return null;
    const [{ latest }] = await tx.select({ latest: max(itemSet.version) }).from(itemSet).where(and(eq(itemSet.workspaceId, workspaceId), eq(itemSet.projectId, input.projectId)));
    const [set] = await tx.insert(itemSet).values({
      workspaceId, projectId: input.projectId, version: (latest ?? 0) + 1, source: input.source, sourceFilename: input.filename,
      importReport: input.report, importedBy: input.userId, uploadId: input.uploadId,
    }).returning();
    if (input.items.length > 0) {
      await tx.insert(item).values(input.items.map((it, i) => ({
        workspaceId, itemSetId: set.id, position: i + 1, sourceRef: it.ref, originalText: it.text,
        area: it.area, proposedValue: it.value, custom: it.custom,
      })));
    }
    return set;
  });
}
