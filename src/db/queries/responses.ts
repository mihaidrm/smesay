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
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { answer, invite, missingItem, response } from "@/db/schema";
import type { Answer } from "./answers";
import type { Invite } from "./invites";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type Response = typeof response.$inferSelect;
export type NewResponse = Pick<typeof response.$inferInsert, "instrumentId" | "itemSetId" | "inviteId" | "deviceToken" | "fields" | "perspectives">;
export type InviteDates = Pick<Invite, "token" | "opensAt" | "closesAt" | "revokedAt">;
const DATES = { token: invite.token, opensAt: invite.opensAt, closesAt: invite.closesAt, revokedAt: invite.revokedAt };

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
  // answer's write, the response's confidence and closing answer stored and its one missing
  // item replaced (none when the text is empty); the response's last save moves forward only.
  // Submit stores them again with the sign-off.
  saveWrap: async (workspaceId: WorkspaceId, inviteId: string, responseId: string, data: { confidence: number | null; closingAnswer: string | null; missing: { text: string; area: string | null; value: string | null } | null }, stillOpen: (dates: InviteDates) => boolean, now: Date): Promise<Response | { refused: InviteDates } | null> => {
    if (!isUuid(inviteId) || !isUuid(responseId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select(DATES).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.id, inviteId))).for("share");
      if (!locked) return null;
      if (!stillOpen(locked)) return { refused: locked };
      const [row] = await tx.update(response).set({ confidence: data.confidence, closingAnswer: data.closingAnswer, updatedAt: sql`greatest(${response.updatedAt}, ${now.toISOString()}::timestamptz)` }).where(and(eq(response.workspaceId, workspaceId), eq(response.id, responseId), eq(response.inviteId, inviteId))).returning();
      if (!row) return null;
      await tx.delete(missingItem).where(and(eq(missingItem.workspaceId, workspaceId), eq(missingItem.responseId, responseId)));
      if (data.missing) await tx.insert(missingItem).values({ workspaceId, responseId, text: data.missing.text, suggestedArea: data.missing.area, suggestedValue: data.missing.value });
      return row;
    });
  },
  // Submit (E7-5): under a shared lock on the invite after re-reading the link, and an update
  // lock on the response (the one every answer's write takes, src/db/queries/answers.ts), the
  // response's answers are read and checked (`check`: a sentence when one is still to finish),
  // so no answer changes between the check and the mark; then the response is marked
  // submitted (the first Submit kept), its confidence, closing answer and sign-off sentence
  // stored, and its one missing item replaced.
  submit: async (workspaceId: WorkspaceId, inviteId: string, responseId: string, data: { confidence: number; closingAnswer: string | null; signOffText: string; missing: { text: string; area: string | null; value: string | null } | null }, stillOpen: (dates: InviteDates) => boolean, check: (rows: Answer[]) => string | null, now: Date): Promise<Response | { refused: InviteDates } | { invalid: string } | null> => {
    if (!isUuid(inviteId) || !isUuid(responseId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select(DATES).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.id, inviteId))).for("share");
      if (!locked) return null;
      if (!stillOpen(locked)) return { refused: locked };
      const [own] = await tx.select({ id: response.id }).from(response).where(and(eq(response.workspaceId, workspaceId), eq(response.id, responseId), eq(response.inviteId, inviteId))).for("update");
      if (!own) return null;
      const rows = await tx.select().from(answer).where(and(eq(answer.workspaceId, workspaceId), eq(answer.responseId, responseId)));
      const problem = check(rows);
      if (problem) return { invalid: problem };
      const [row] = await tx.update(response).set({ submittedAt: now, firstSubmittedAt: sql`coalesce(${response.firstSubmittedAt}, ${now.toISOString()}::timestamptz)`, signedOff: true, confidence: data.confidence, closingAnswer: data.closingAnswer, signOffText: data.signOffText, updatedAt: now }).where(and(eq(response.workspaceId, workspaceId), eq(response.id, responseId), eq(response.inviteId, inviteId))).returning();
      if (!row) return null;
      await tx.delete(missingItem).where(and(eq(missingItem.workspaceId, workspaceId), eq(missingItem.responseId, responseId)));
      if (data.missing) await tx.insert(missingItem).values({ workspaceId, responseId, text: data.missing.text, suggestedArea: data.missing.area, suggestedValue: data.missing.value });
      return row;
    });
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
