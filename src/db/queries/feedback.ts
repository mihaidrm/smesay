// Feedback reports (stories/E17-1, decision 0069), scoped to the workspace: a member writes
// one, the workspace's members see theirs. The admin's reads across workspaces and the status
// changes are in queries/admin.ts, behind requireAdmin().
import { and, count, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { feedback, user } from "@/db/schema";
import type { FeedbackKind, FeedbackStatus, WorkspaceId } from "@/db/types";

export type FeedbackRow = { id: string; kind: FeedbackKind; text: string; page: string | null; status: FeedbackStatus; senderEmail: string | null; createdAt: Date; solvedAt: Date | null };

export const feedbackReports = {
  async create(ws: WorkspaceId, input: { userId: string; kind: FeedbackKind; text: string; page: string | null }): Promise<{ id: string; createdAt: Date }> {
    const [row] = await db.insert(feedback).values({ workspaceId: ws, userId: input.userId, kind: input.kind, text: input.text, page: input.page }).returning({ id: feedback.id, createdAt: feedback.createdAt });
    return row;
  },

  // Newest first; the sender's address from the user table, null once the account is gone.
  async list(ws: WorkspaceId): Promise<FeedbackRow[]> {
    const rows = await db.select({ id: feedback.id, kind: feedback.kind, text: feedback.text, page: feedback.page, status: feedback.status, senderEmail: user.email, createdAt: feedback.createdAt, solvedAt: feedback.solvedAt })
      .from(feedback).leftJoin(user, eq(user.id, feedback.userId)).where(eq(feedback.workspaceId, ws)).orderBy(desc(feedback.createdAt), desc(feedback.id));
    return rows.map((r) => ({ ...r, kind: r.kind as FeedbackKind, status: r.status as FeedbackStatus }));
  },

  // The cap's count (acceptance 3): the workspace's reports since the given time.
  async countSince(ws: WorkspaceId, since: Date): Promise<number> {
    const [row] = await db.select({ n: count() }).from(feedback).where(and(eq(feedback.workspaceId, ws), gt(feedback.createdAt, since)));
    return Number(row.n);
  },
};
