// Workspace-scoped helpers for the answer table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. countForResponse (E6-3): how many items a response has answered completely
// (E7-2 stores an incomplete answer too, a Change with no reason yet; complete is the rule of
// isComplete in src/lib/respondent-rules.ts: agree and pick, or any other kind with a reason).
// forResponse (E7-1): a response's answers, for the respondent page and its counts.
// upsert (E7-2): one answer per response and item (the unique index
// answer_response_item_idx; onConflictDoUpdate: orm.drizzle.team/docs/insert#upserts-and-conflicts),
// written under a shared lock on the invite row after re-reading the link (`stillOpen`), as
// responses.createPublic does, so an answer that races a Revoke writes nothing once the
// revoke is committed (E6-4; Drizzle's .for(): node_modules/drizzle-orm/pg-core/
// query-builders/select.d.ts), and the response's last save moves in the same transaction.
// The response row is then locked FOR UPDATE, so two writes for one response run one after
// the other in the order they reach the database, and an answer's write never moves the
// response's last save back (greatest: postgresql.org/docs/current/functions-conditional.html).
// From E7-3 every write carries the version it was made on (base), the page that sends it and
// that page's number for it (seq): an existing answer is replaced only when its version is
// still the base, or when the same page wrote it last with a lower number, or when a page the
// change was made on top of (after) wrote it last with that save or an earlier one (the conflict
// update's WHERE: postgresql.org/docs/current/sql-insert.html, ON CONFLICT DO UPDATE ...
// WHERE); the version then counts up. Anything else, a late request, another window or a
// device's old queue, returns { stale } with the stored answer and changes nothing. No clock
// decides (src/lib/answer-queue.ts).
import { and, count, eq, inArray, isNotNull, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { answer, invite, response } from "@/db/schema";
import type { InviteDates } from "./responses";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type Answer = typeof answer.$inferSelect;
// E7-6: whether the response has changes not submitted again, and its latest Submit.
type Since = { changedSince: boolean; submittedAt: Date | null };
export const answers = {
  ...scoped(answer),
  countForResponse: async (workspaceId: WorkspaceId, responseId: string): Promise<number> => {
    if (!isUuid(responseId)) return 0;
    return (await db.select({ n: count() }).from(answer).where(and(eq(answer.workspaceId, workspaceId), eq(answer.responseId, responseId), or(inArray(answer.kind, ["agree", "pick"]), isNotNull(answer.reason)))))[0].n;
  },
  upsert: async (workspaceId: WorkspaceId, inviteId: string, data: { responseId: string; itemSetId: string; itemId: string; kind: Answer["kind"]; value: string | null; reason: string | null; comment: string | null; base: number; page: string; seq: number; after: { page: string; seq: number }[] }, stillOpen: (dates: InviteDates) => boolean, now: Date): Promise<(Answer & Since) | { refused: InviteDates } | ({ stale: Answer } & Since) | null> => {
    if (!isUuid(inviteId) || !isUuid(data.responseId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select({ token: invite.token, opensAt: invite.opensAt, closesAt: invite.closesAt, revokedAt: invite.revokedAt }).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.id, inviteId))).for("share");
      if (!locked) return null;
      if (!stillOpen(locked)) return { refused: locked };
      const [own] = await tx.select({ id: response.id, submittedAt: response.submittedAt, signedOff: response.signedOff }).from(response).where(and(eq(response.workspaceId, workspaceId), eq(response.id, data.responseId))).for("update");
      if (!own) return null;
      const [before] = await tx.select({ kind: answer.kind, value: answer.value, reason: answer.reason, comment: answer.comment }).from(answer).where(and(eq(answer.workspaceId, workspaceId), eq(answer.responseId, data.responseId), eq(answer.itemId, data.itemId)));
      const { base, page, seq, after, ...fields } = data;
      const set = { kind: fields.kind, value: fields.value, reason: fields.reason, comment: fields.comment, version: sql`${answer.version} + 1`, writer: page, writerSeq: seq, updatedAt: now };
      const takes = or(eq(answer.version, base), and(eq(answer.writer, page), lt(answer.writerSeq, seq)), ...after.map((a) => and(eq(answer.writer, a.page), lte(answer.writerSeq, a.seq))));
      const [row] = await tx.insert(answer).values({ ...fields, workspaceId, version: 1, writer: page, writerSeq: seq, updatedAt: now }).onConflictDoUpdate({ target: [answer.responseId, answer.itemId], set, setWhere: and(eq(answer.workspaceId, workspaceId), takes) }).returning();
      if (!row) {
        const [stored] = await tx.select().from(answer).where(and(eq(answer.workspaceId, workspaceId), eq(answer.responseId, data.responseId), eq(answer.itemId, data.itemId)));
        return stored ? { stale: stored, changedSince: own.submittedAt !== null && !own.signedOff, submittedAt: own.submittedAt } : null;
      }
      // E7-6: a change after a Submit takes the sign-off back until the next Submit; a write
      // that says what is stored moves neither that nor the response's last save.
      // changedSince: the response is submitted and has changes not submitted again, after
      // its Submit at submittedAt.
      const changed = !before || before.kind !== row.kind || before.value !== row.value || before.reason !== row.reason || before.comment !== row.comment;
      if (changed) await tx.update(response).set({ updatedAt: sql`greatest(${response.updatedAt}, ${now.toISOString()}::timestamptz)`, signedOff: false }).where(and(eq(response.workspaceId, workspaceId), eq(response.id, data.responseId)));
      return { ...row, changedSince: own.submittedAt !== null && !(own.signedOff && !changed), submittedAt: own.submittedAt };
    });
  },
  forResponse: async (workspaceId: WorkspaceId, responseId: string): Promise<Answer[]> => {
    if (!isUuid(responseId)) return [];
    return db.select().from(answer).where(and(eq(answer.workspaceId, workspaceId), eq(answer.responseId, responseId)));
  },
};
