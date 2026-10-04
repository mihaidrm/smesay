// Workspace-scoped helpers for the answer table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. countForResponse (E6-3): how many items a response has answered completely
// (E7-2 stores an incomplete answer too, a Change with no reason yet; complete is the rule of
// isComplete in src/lib/respondent-rules.ts: agree and pick, or any other kind with a reason).
// forResponse (E7-1): a response's answers, for the respondent page and its counts.
// upsert (E7-2): one answer per response and item, the last write wins (the unique index
// answer_response_item_idx; onConflictDoUpdate: orm.drizzle.team/docs/insert#upserts-and-conflicts),
// written under a shared lock on the invite row after re-reading the link (`stillOpen`), as
// responses.createPublic does, so an answer that races a Revoke writes nothing once the
// revoke is committed (E6-4; Drizzle's .for(): node_modules/drizzle-orm/pg-core/
// query-builders/select.d.ts), and the response's last save moves in the same transaction.
// The response row is then locked FOR UPDATE, so two writes for one response run one after
// the other in the order they reach the database, and an answer's write never moves the
// response's last save back (greatest: postgresql.org/docs/current/functions-conditional.html). The page sends
// one request per item at a time (src/app/r/[token]/answer-saver.ts), so the order they reach
// the database is the order they were made.
import { and, count, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { answer, invite, response } from "@/db/schema";
import type { InviteDates } from "./responses";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type Answer = typeof answer.$inferSelect;
export const answers = {
  ...scoped(answer),
  countForResponse: async (workspaceId: WorkspaceId, responseId: string): Promise<number> => {
    if (!isUuid(responseId)) return 0;
    return (await db.select({ n: count() }).from(answer).where(and(eq(answer.workspaceId, workspaceId), eq(answer.responseId, responseId), or(inArray(answer.kind, ["agree", "pick"]), isNotNull(answer.reason)))))[0].n;
  },
  upsert: async (workspaceId: WorkspaceId, inviteId: string, data: { responseId: string; itemSetId: string; itemId: string; kind: Answer["kind"]; value: string | null; reason: string | null; comment: string | null }, stillOpen: (dates: InviteDates) => boolean, now: Date): Promise<Answer | { refused: InviteDates } | null> => {
    if (!isUuid(inviteId) || !isUuid(data.responseId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select({ token: invite.token, opensAt: invite.opensAt, closesAt: invite.closesAt, revokedAt: invite.revokedAt }).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.id, inviteId))).for("share");
      if (!locked) return null;
      if (!stillOpen(locked)) return { refused: locked };
      const [own] = await tx.select({ id: response.id }).from(response).where(and(eq(response.workspaceId, workspaceId), eq(response.id, data.responseId))).for("update");
      if (!own) return null;
      const set = { kind: data.kind, value: data.value, reason: data.reason, comment: data.comment, updatedAt: now };
      const [row] = await tx.insert(answer).values({ ...data, workspaceId, updatedAt: now }).onConflictDoUpdate({ target: [answer.responseId, answer.itemId], set, setWhere: eq(answer.workspaceId, workspaceId) }).returning();
      await tx.update(response).set({ updatedAt: sql`greatest(${response.updatedAt}, ${now.toISOString()}::timestamptz)` }).where(and(eq(response.workspaceId, workspaceId), eq(response.id, data.responseId)));
      return row;
    });
  },
  forResponse: async (workspaceId: WorkspaceId, responseId: string): Promise<Answer[]> => {
    if (!isUuid(responseId)) return [];
    return db.select().from(answer).where(and(eq(answer.workspaceId, workspaceId), eq(answer.responseId, responseId)));
  },
};
