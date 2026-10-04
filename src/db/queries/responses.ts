// Workspace-scoped helpers for the response table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. forInvite (E6-3): the newest response of an invite, by its last save
// then its id, the same order as the invite list and the reminder claim. forDevice and
// startPersonal (E7-1): a public link's response by the device token in its cookie, and a
// personal invite's one response, created under the invite row's lock so two Starts on two
// devices make one row (postgresql.org/docs/current/explicit-locking.html, row-level locks;
// Drizzle's .for(): node_modules/drizzle-orm/pg-core/query-builders/select.d.ts).
// createPublic (E7-1): a public link's new response, under a shared lock on the invite row.
// Both re-read the invite's token, dates and revocation under the lock (`stillOpen`), so a Start
// that races a Revoke or a date change writes nothing once the change is committed: the
// revoke's UPDATE waits for the lock or the Start waits for the revoke (E6-4).
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { answer, invite, missingItem, response } from "@/db/schema";
import type { Answer } from "./answers";
import type { Invite } from "./invites";
import type { WorkspaceId } from "@/db/types";
import { wrapTakes, type SaveRef, type WrapSync } from "@/lib/respondent-rules";
import { isUuid, scoped } from "./scoped";

export type Response = typeof response.$inferSelect;
type Missing = { text: string; area: string | null; value: string | null };
// A Wrap up write (E7-5): the values and the version rule's fields (src/lib/respondent-rules.ts).
export type WrapWrite = { confidence: number | null; closingAnswer: string | null; missing: Missing | null; base: number; page: string; seq: number; after: SaveRef[] };
// The Wrap up as stored, with its version: what a stale write gets back.
// changedSince (E7-6): the response is submitted and has changes not submitted again, after
// its latest Submit (submittedAt).
export type StoredWrap = { confidence: number | null; closingAnswer: string | null; missing: Missing | null; changedSince: boolean; submittedAt: Date | null } & WrapSync;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// The response row locked for update, its Wrap up and its missing item (the first, the
// one the respondent writes).
async function lockedWrap(tx: Tx, workspaceId: WorkspaceId, inviteId: string, responseId: string) {
  const [row] = await tx.select().from(response).where(and(eq(response.workspaceId, workspaceId), eq(response.id, responseId), eq(response.inviteId, inviteId))).for("update");
  if (!row) return null;
  const kept = await tx.select().from(missingItem).where(and(eq(missingItem.workspaceId, workspaceId), eq(missingItem.responseId, responseId))).orderBy(asc(missingItem.createdAt), asc(missingItem.id));
  const missing = kept[0] ? { text: kept[0].text, area: kept[0].suggestedArea, value: kept[0].suggestedValue } : null;
  const sync: WrapSync = { version: row.wrapVersion, writer: row.wrapWriter, writerSeq: row.wrapWriterSeq };
  return { perspectives: row.perspectives, missing: kept, sync, stored: { confidence: row.confidence, closingAnswer: row.closingAnswer, missing, changedSince: row.submittedAt !== null && !row.signedOff, submittedAt: row.submittedAt, ...sync } satisfies StoredWrap };
}
const sameStored = (stored: StoredWrap, data: Pick<WrapWrite, "confidence" | "closingAnswer" | "missing">): boolean =>
  stored.confidence === data.confidence && stored.closingAnswer === data.closingAnswer && (stored.missing === null ? data.missing === null : data.missing !== null && stored.missing.text === data.missing.text && stored.missing.area === data.missing.area && stored.missing.value === data.missing.value);
// The response's one missing item: the first row updated in place, any other removed; none
// when the text is empty.
async function writeMissing(tx: Tx, workspaceId: WorkspaceId, responseId: string, kept: { id: string }[], missing: Missing | null) {
  const [first, ...rest] = kept;
  const extra = missing && first ? rest : kept;
  if (extra.length > 0) await tx.delete(missingItem).where(and(eq(missingItem.workspaceId, workspaceId), inArray(missingItem.id, extra.map((m) => m.id))));
  if (!missing) return;
  if (first) await tx.update(missingItem).set({ text: missing.text, suggestedArea: missing.area, suggestedValue: missing.value }).where(and(eq(missingItem.workspaceId, workspaceId), eq(missingItem.id, first.id)));
  else await tx.insert(missingItem).values({ workspaceId, responseId, text: missing.text, suggestedArea: missing.area, suggestedValue: missing.value });
}
export type NewResponse = Pick<typeof response.$inferInsert, "instrumentId" | "itemSetId" | "inviteId" | "deviceToken" | "fields" | "perspectives">;
export type InviteDates = Pick<Invite, "token" | "opensAt" | "closesAt" | "revokedAt">;
// The link's dates as the writes re-read them under the invite row's lock; a deleted workspace's
// deletion time counts as the revocation (stories/E11-2, as links.byToken reads it), so a
// deletion committed before the re-read wins as a revoke does.
// Every column named with its table, so the subquery's meaning cannot shift.
export const DATES = { token: invite.token, opensAt: invite.opensAt, closesAt: invite.closesAt, revokedAt: sql`coalesce("invite"."revoked_at", (select "w"."deleted_at" from "workspace" "w" where "w"."id" = "invite"."workspace_id"))`.mapWith(invite.revokedAt) };

export const responses = {
  ...scoped(response),
  forInvite: async (workspaceId: WorkspaceId, inviteId: string): Promise<Response | null> => {
    if (!isUuid(inviteId)) return null;
    const rows = await db.select().from(response).where(and(eq(response.workspaceId, workspaceId), eq(response.inviteId, inviteId))).orderBy(desc(response.updatedAt), desc(response.id)).limit(1);
    return rows[0] ?? null;
  },
  // A public link's response on this device: the device token from the cookie, on this
  // link's invite only (a token from another link's cookie finds nothing).
  forDevice: async (workspaceId: WorkspaceId, inviteId: string, deviceToken: string): Promise<Response | null> => {
    if (!isUuid(inviteId) || typeof deviceToken !== "string" || deviceToken.length < 32) return null;
    const rows = await db.select().from(response).where(and(eq(response.workspaceId, workspaceId), eq(response.inviteId, inviteId), eq(response.deviceToken, deviceToken))).limit(1);
    return rows[0] ?? null;
  },
  // A personal invite's one response: the existing one, or a new one created with `data`,
  // both under the invite row's lock. created tells which.
  startPersonal: async (workspaceId: WorkspaceId, data: NewResponse, stillOpen: (dates: InviteDates) => boolean): Promise<{ response: Response; created: boolean } | { refused: InviteDates } | null> => {
    if (!isUuid(data.inviteId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select(DATES).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.id, data.inviteId), eq(invite.kind, "personal"))).for("update");
      if (!locked) return null;
      if (!stillOpen(locked)) return { refused: locked };
      const [existing] = await tx.select().from(response).where(and(eq(response.workspaceId, workspaceId), eq(response.inviteId, data.inviteId))).orderBy(desc(response.updatedAt), desc(response.id)).limit(1);
      if (existing) return { response: existing, created: false };
      const [created] = await tx.insert(response).values({ ...data, workspaceId }).returning();
      return { response: created, created: true };
    });
  },
  // The Wrap up's answers as the respondent writes them (E7-5): under the same locks as an
  // answer's write, a write made on the stored Wrap up (wrapTakes: its version, or a later
  // write of the same page, or one it names) stores the response's confidence and closing
  // answer and its one missing item (updated in place, so it keeps its id; none when the text
  // is empty), and counts the version up; any other write is stale and gets the stored Wrap
  // up. A write that says what is stored changes nothing but the version and its writer, and
  // the response's last save moves forward only when something changed. Submit stores them
  // again with the sign-off.
  saveWrap: async (workspaceId: WorkspaceId, inviteId: string, responseId: string, data: WrapWrite, stillOpen: (dates: InviteDates) => boolean, now: Date): Promise<{ saved: Response; changed: boolean } | { stale: StoredWrap } | { refused: InviteDates } | null> => {
    if (!isUuid(inviteId) || !isUuid(responseId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select(DATES).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.id, inviteId))).for("share");
      if (!locked) return null;
      if (!stillOpen(locked)) return { refused: locked };
      const own = await lockedWrap(tx, workspaceId, inviteId, responseId);
      if (!own) return null;
      if (!wrapTakes(own.sync, data)) return { stale: own.stored };
      const changed = !sameStored(own.stored, data);
      const set = changed ? { confidence: data.confidence, closingAnswer: data.closingAnswer, signedOff: false, updatedAt: sql`greatest(${response.updatedAt}, ${now.toISOString()}::timestamptz)` } : {};
      const [row] = await tx.update(response).set({ ...set, wrapVersion: sql`${response.wrapVersion} + 1`, wrapWriter: data.page, wrapWriterSeq: data.seq }).where(and(eq(response.workspaceId, workspaceId), eq(response.id, responseId))).returning();
      if (changed) await writeMissing(tx, workspaceId, responseId, own.missing, data.missing);
      return { saved: row, changed };
    });
  },
  // Submit (E7-5): under a shared lock on the invite after re-reading the link, and an update
  // lock on the response (the one every answer's write takes, src/db/queries/answers.ts), the
  // Wrap up write is checked as saveWrap's (stale: the stored Wrap up), then the response's
  // answers are read and checked against the items its perspectives show as locked (`check`:
  // a sentence when one is still to finish), so no answer changes between the check and the
  // mark; then the response is marked submitted (the first Submit kept), its confidence,
  // closing answer, missing item and sign-off sentence stored as saveWrap stores them. The
  // Submit's time only moves forward (E7-6): two Submits at once can reach the lock in the
  // other order from their clocks, so the later one stored is at least a millisecond after
  // the one before (greatest ignores a null: postgresql.org/docs/current/
  // functions-conditional.html), and pages that compare Submits by time see them in the
  // order they were stored.
  submit: async (workspaceId: WorkspaceId, inviteId: string, responseId: string, data: WrapWrite & { confidence: number; signOffText: string }, stillOpen: (dates: InviteDates) => boolean, check: (rows: Answer[], perspectives: string[]) => string | null, now: Date): Promise<Response | { refused: InviteDates } | { invalid: string } | { stale: StoredWrap } | null> => {
    if (!isUuid(inviteId) || !isUuid(responseId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select(DATES).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.id, inviteId))).for("share");
      if (!locked) return null;
      if (!stillOpen(locked)) return { refused: locked };
      const own = await lockedWrap(tx, workspaceId, inviteId, responseId);
      if (!own) return null;
      if (!wrapTakes(own.sync, data)) return { stale: own.stored };
      const rows = await tx.select().from(answer).where(and(eq(answer.workspaceId, workspaceId), eq(answer.responseId, responseId)));
      const problem = check(rows, own.perspectives);
      if (problem) return { invalid: problem };
      const changed = !sameStored(own.stored, data);
      const [row] = await tx.update(response).set({ submittedAt: sql`greatest(${now.toISOString()}::timestamptz, ${response.submittedAt} + interval '1 millisecond')`, firstSubmittedAt: sql`coalesce(${response.firstSubmittedAt}, ${now.toISOString()}::timestamptz)`, signedOff: true, confidence: data.confidence, closingAnswer: data.closingAnswer, signOffText: data.signOffText, wrapVersion: sql`${response.wrapVersion} + 1`, wrapWriter: data.page, wrapWriterSeq: data.seq, ...(changed ? { updatedAt: sql`greatest(${response.updatedAt}, ${now.toISOString()}::timestamptz)` } : {}) }).where(and(eq(response.workspaceId, workspaceId), eq(response.id, responseId))).returning();
      if (changed) await writeMissing(tx, workspaceId, responseId, own.missing, data.missing);
      return row;
    });
  },
  // A Start again that changes the details or the picks (E7-6): stored, the sign-off taken
  // back, and the last save moved forward only (a Start that waited for a lock behind a
  // later write never moves it back).
  restart: async (workspaceId: WorkspaceId, responseId: string, data: Pick<NewResponse, "fields" | "perspectives">, now: Date): Promise<Response | null> => {
    if (!isUuid(responseId)) return null;
    const [row] = await db.update(response).set({ fields: data.fields, perspectives: data.perspectives, signedOff: false, updatedAt: sql`greatest(${response.updatedAt}, ${now.toISOString()}::timestamptz)` }).where(and(eq(response.workspaceId, workspaceId), eq(response.id, responseId))).returning();
    return row ?? null;
  },
  createPublic: async (workspaceId: WorkspaceId, data: NewResponse, stillOpen: (dates: InviteDates) => boolean): Promise<Response | { refused: InviteDates } | null> => {
    if (!isUuid(data.inviteId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select(DATES).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.id, data.inviteId), eq(invite.kind, "public"))).for("share");
      if (!locked) return null;
      if (!stillOpen(locked)) return { refused: locked };
      const [created] = await tx.insert(response).values({ ...data, workspaceId }).returning();
      return created;
    });
  },
};
