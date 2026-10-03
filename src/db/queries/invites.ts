// Workspace-scoped helpers for the invite table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. anyForInstrument (stories/E5-2): whether the instrument has a link or an
// invite, which makes it published and locks its method; one row at most is read, never the
// tokens or emails of the rest. publish (stories/E6-1): the one public link of an instrument,
// created under the instrument row's lock (`.for("update")`, the same lock instruments.updateLocked,
// setPerspectives and tagItem take), so a save that was waiting on the lock reads the new
// invite and refuses; two Publish presses end with one row. Publishing sets
// instrument.published_at and closes the project's older public links at that instant, so
// one project has one open link (docs/review-list.md). publicForInstrument and
// updatePublic read and change one instrument's link; livePublic finds the project's link
// in force: the newest instrument that has one.
import { and, desc, eq, isNull, ne, or, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { instrument, invite } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type Invite = typeof invite.$inferSelect;
export type PublicLinkData = { token: string; opensAt: Date | null; closesAt: Date | null; passcodeHash: string | null };

export const invites = {
  ...scoped(invite),
  anyForInstrument: async (workspaceId: WorkspaceId, instrumentId: string): Promise<boolean> => {
    if (!isUuid(instrumentId)) return false;
    const rows = await db.select({ id: invite.id }).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId))).limit(1);
    return rows.length > 0;
  },
  publicForInstrument: async (workspaceId: WorkspaceId, instrumentId: string): Promise<Invite | null> => {
    if (!isUuid(instrumentId)) return null;
    const rows = await db.select().from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId), eq(invite.kind, "public"))).limit(1);
    return rows[0] ?? null;
  },
  // The public link, created once: an existing one is returned as it is (created: false).
  // Null when the instrument is not in the workspace.
  publish: async (workspaceId: WorkspaceId, instrumentId: string, data: PublicLinkData, now = new Date()): Promise<{ invite: Invite; created: boolean } | null> => {
    if (!isUuid(instrumentId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select({ id: instrument.id, projectId: instrument.projectId }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.id, instrumentId))).for("update");
      if (!locked) return null;
      const [existing] = await tx.select().from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId), eq(invite.kind, "public"))).limit(1);
      if (existing) return { invite: existing, created: false };
      const [created] = await tx.insert(invite).values({ ...data, workspaceId, instrumentId, kind: "public" }).returning();
      await tx.update(instrument).set({ publishedAt: now }).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.id, instrumentId), isNull(instrument.publishedAt)));
      const siblings = tx.select({ id: instrument.id }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.projectId, locked.projectId), ne(instrument.id, instrumentId)));
      await tx.update(invite).set({ closesAt: now }).where(and(eq(invite.workspaceId, workspaceId), eq(invite.kind, "public"), isNull(invite.revokedAt), or(isNull(invite.closesAt), gt(invite.closesAt, now)), sql`${invite.instrumentId} in ${siblings}`));
      return { invite: created, created: true };
    });
  },
  // The project's public link in force: the newest instrument's that has one, or null.
  livePublic: async (workspaceId: WorkspaceId, projectId: string): Promise<Invite | null> => {
    if (!isUuid(projectId)) return null;
    const rows = await db.select({ invite }).from(invite).innerJoin(instrument, eq(instrument.id, invite.instrumentId))
      .where(and(eq(invite.workspaceId, workspaceId), eq(invite.kind, "public"), eq(instrument.projectId, projectId)))
      .orderBy(desc(instrument.createdAt)).limit(1);
    return rows[0]?.invite ?? null;
  },
  updatePublic: async (workspaceId: WorkspaceId, instrumentId: string, patch: Partial<Omit<PublicLinkData, "token">>): Promise<Invite | null> => {
    if (!isUuid(instrumentId)) return null;
    const rows = await db.update(invite).set(patch).where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId), eq(invite.kind, "public"))).returning();
    return rows[0] ?? null;
  },
};
