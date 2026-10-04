// Workspace-scoped helpers for the response table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. forInvite (E6-3): the newest response of an invite, by its last save
// then its id, the same order as the invite list and the reminder claim. forDevice and
// startPersonal (E7-1): a public link's response by the device token in its cookie, and a
// personal invite's one response, created under the invite row's lock so two Starts on two
// devices make one row (postgresql.org/docs/current/explicit-locking.html, row-level locks).
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { invite, response } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type Response = typeof response.$inferSelect;
export type NewResponse = Pick<typeof response.$inferInsert, "instrumentId" | "itemSetId" | "inviteId" | "deviceToken" | "fields" | "perspectives">;

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
  startPersonal: async (workspaceId: WorkspaceId, data: NewResponse): Promise<{ response: Response; created: boolean } | null> => {
    if (!isUuid(data.inviteId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select({ id: invite.id }).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.id, data.inviteId), eq(invite.kind, "personal"))).for("update");
      if (!locked) return null;
      const [existing] = await tx.select().from(response).where(and(eq(response.workspaceId, workspaceId), eq(response.inviteId, data.inviteId))).orderBy(desc(response.updatedAt), desc(response.id)).limit(1);
      if (existing) return { response: existing, created: false };
      const [created] = await tx.insert(response).values({ ...data, workspaceId }).returning();
      return { response: created, created: true };
    });
  },
};
