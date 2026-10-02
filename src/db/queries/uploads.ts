// Workspace-scoped helpers for the upload table (stories/E3-2). latestForProject() is the draft
// the Import step shows: the newest upload of the project, one row.
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { upload } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { scoped } from "./scoped";

export type Upload = typeof upload.$inferSelect;

export const uploads = {
  ...scoped(upload),
  latestForProject: async (workspaceId: WorkspaceId, projectId: string): Promise<Upload | null> => {
    const rows = await db.select().from(upload)
      .where(and(eq(upload.workspaceId, workspaceId), eq(upload.projectId, projectId)))
      .orderBy(desc(upload.createdAt)).limit(1);
    return rows[0] ?? null;
  },
};
