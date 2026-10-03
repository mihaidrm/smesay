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
import { and, asc, count, desc, eq, inArray, isNull, ne, or, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { instrument, invite, project, response } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type Invite = typeof invite.$inferSelect;
export const RESEND_AFTER_MINUTES = 15;
export type PublicLinkData = { token: string; opensAt: Date | null; closesAt: Date | null; passcodeHash: string | null };
// A personal invite with where its person stands (stories/E6-2): no response, one in
// progress, or one submitted.
export type InviteeRow = Invite & { responseStatus: "none" | "inProgress" | "submitted"; answeredAt: Date | null };

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
      // The project row too, the lock updatePublic takes: a save of the older link and the
      // publish that replaces it cannot interleave (one project, one link in force). NO KEY
      // UPDATE, so a plain insert pointing at the project (its foreign-key check takes KEY
      // SHARE) is not held up; an import commit and a new draft lock the project row FOR
      // UPDATE themselves and do wait, briefly (postgresql.org/docs/current/explicit-locking.html,
      // row-level locks).
      await tx.select({ id: project.id }).from(project).where(and(eq(project.workspaceId, workspaceId), eq(project.id, locked.projectId))).for("no key update");
      const [existing] = await tx.select().from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId), eq(invite.kind, "public"))).limit(1);
      if (existing) return { invite: existing, created: false };
      const [created] = await tx.insert(invite).values({ ...data, workspaceId, instrumentId, kind: "public" }).returning();
      await tx.update(instrument).set({ publishedAt: now }).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.id, instrumentId), isNull(instrument.publishedAt)));
      const siblings = tx.select({ id: instrument.id }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.projectId, locked.projectId), ne(instrument.id, instrumentId)));
      // The older links close at `now`, the public one and its personal ones (E6-2: they
      // follow it); one that had not opened yet opens at `now` too, so it reads as closed,
      // not as opening later; a null open date (open since publish) stays (CASE:
      // postgresql.org/docs/current/functions-conditional.html).
      const at = sql.param(now, invite.opensAt);
      await tx.update(invite).set({ closesAt: now, opensAt: sql`case when ${invite.opensAt} > ${at} then ${at} else ${invite.opensAt} end` }).where(and(eq(invite.workspaceId, workspaceId), isNull(invite.revokedAt), or(isNull(invite.closesAt), gt(invite.closesAt, now)), sql`${invite.instrumentId} in ${siblings}`));
      return { invite: created, created: true };
    });
  },
  // The personal invites of an instrument, oldest first (one send's rows share an instant
  // and come by address), each with its response's state:
  // the newest response of the invite (one row per invite whatever the response table
  // holds). Addresses and tokens stay inside the workspace: the caller holds its id from
  // the session.
  personalWithStatus: async (workspaceId: WorkspaceId, instrumentId: string): Promise<InviteeRow[]> => {
    if (!isUuid(instrumentId)) return [];
    const rows = await db.select().from(invite)
      .where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId), eq(invite.kind, "personal")))
      .orderBy(asc(invite.createdAt), asc(invite.email));
    if (rows.length === 0) return [];
    const answers = await db.select({ inviteId: response.inviteId, submittedAt: response.submittedAt, updatedAt: response.updatedAt }).from(response)
      .where(and(eq(response.workspaceId, workspaceId), inArray(response.inviteId, rows.map((r) => r.id))))
      .orderBy(desc(response.updatedAt));
    const newest = new Map<string, { submittedAt: Date | null; updatedAt: Date }>();
    for (const a of answers) if (!newest.has(a.inviteId)) newest.set(a.inviteId, a);
    return rows.map((r) => {
      const a = newest.get(r.id);
      return { ...r, responseStatus: !a ? "none" : a.submittedAt ? "submitted" : "inProgress", answeredAt: a ? (a.submittedAt ?? a.updatedAt) : null };
    });
  },
  // The personal invites of a send (E6-2), inserted under the locks publish takes, in its
  // order (the instrument row FOR UPDATE, then the project row FOR NO KEY UPDATE, so the
  // two cannot deadlock; updatePublic takes the project row only), with the public link
  // read inside them: it must be the project's link in force (not replaced by a newer
  // version's), not revoked and not closed at `now`, and its dates go on the rows, so a
  // date change, a revoke or a newer version's publish cannot slip between the read and
  // the insert. An address that already has a personal invite on the instrument is skipped
  // by the partial unique index (ON CONFLICT DO NOTHING on its columns and predicate:
  // postgresql.org/docs/current/sql-insert.html, ON CONFLICT; drizzle `where` on
  // onConflictDoNothing, node_modules/drizzle-orm/pg-core/query-builders/insert.d.ts) and
  // is absent from the rows returned. Null when the instrument is not in the workspace.
  createPersonal: async (workspaceId: WorkspaceId, instrumentId: string, people: { email: string; name: string | null; role: string | null; token: string }[], now = new Date()): Promise<{ created: Invite[] } | { refused: "none" | "replaced" | "revoked" | "closed" } | null> => {
    if (!isUuid(instrumentId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select({ id: instrument.id, projectId: instrument.projectId }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.id, instrumentId))).for("update");
      if (!locked) return null;
      await tx.select({ id: project.id }).from(project).where(and(eq(project.workspaceId, workspaceId), eq(project.id, locked.projectId))).for("no key update");
      const [live] = await tx.select({ invite }).from(invite).innerJoin(instrument, eq(instrument.id, invite.instrumentId))
        .where(and(eq(invite.workspaceId, workspaceId), eq(invite.kind, "public"), eq(instrument.projectId, locked.projectId)))
        .orderBy(desc(instrument.createdAt)).limit(1);
      if (!live) return { refused: "none" as const };
      const link = live.invite;
      if (link.instrumentId !== instrumentId) return { refused: "replaced" as const };
      if (link.revokedAt) return { refused: "revoked" as const };
      if (link.closesAt && link.closesAt <= now) return { refused: "closed" as const };
      if (people.length === 0) return { created: [] };
      const created = await tx.insert(invite)
        .values(people.map((p) => ({ workspaceId, instrumentId, kind: "personal" as const, token: p.token, email: p.email, name: p.name, roleHint: p.role, opensAt: link.opensAt, closesAt: link.closesAt, sendStartedAt: now })))
        .onConflictDoNothing({ target: [invite.instrumentId, invite.email], where: sql`${invite.kind} = 'personal'` })
        .returning();
      return { created };
    });
  },
  // Claims a personal invite for sending again (E6-2): one never sent whose send failed,
  // or one whose last send started RESEND_AFTER_MINUTES ago with no outcome (a request
  // that died); one started more recently with no outcome is in flight on another request.
  // One statement that moves send_started_at, so two sends cannot both claim it. Null when
  // it cannot be claimed.
  claimResend: async (workspaceId: WorkspaceId, id: string, patch: { name: string | null; roleHint: string | null }, now = new Date()): Promise<Invite | null> => {
    if (!isUuid(id)) return null;
    const stale = new Date(now.getTime() - RESEND_AFTER_MINUTES * 60 * 1000);
    const rows = await db.update(invite).set({ ...patch, sendError: null, sendStartedAt: now })
      .where(and(eq(invite.workspaceId, workspaceId), eq(invite.id, id), eq(invite.kind, "personal"), isNull(invite.sentAt), or(sql`${invite.sendError} is not null`, isNull(invite.sendStartedAt), sql`${invite.sendStartedAt} < ${sql.param(stale, invite.sendStartedAt)}`)))
      .returning();
    return rows[0] ?? null;
  },
  // The personal invites created in the workspace in the `minutes` before `now` (the send
  // limit; the check and the inserts are not one statement, docs/review-list.md).
  countPersonalSince: async (workspaceId: WorkspaceId, minutes: number, now = new Date()): Promise<number> =>
    (await db.select({ n: count() }).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.kind, "personal"), gt(invite.createdAt, new Date(now.getTime() - minutes * 60 * 1000)))))[0].n,
  // The personal invite of an address on an instrument, if any.
  personalByEmail: async (workspaceId: WorkspaceId, instrumentId: string, email: string): Promise<Invite | null> => {
    if (!isUuid(instrumentId)) return null;
    const rows = await db.select().from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId), eq(invite.kind, "personal"), eq(invite.email, email))).limit(1);
    return rows[0] ?? null;
  },
  // The project's public link in force: the newest instrument's that has one, or null.
  livePublic: async (workspaceId: WorkspaceId, projectId: string): Promise<Invite | null> => {
    if (!isUuid(projectId)) return null;
    const rows = await db.select({ invite }).from(invite).innerJoin(instrument, eq(instrument.id, invite.instrumentId))
      .where(and(eq(invite.workspaceId, workspaceId), eq(invite.kind, "public"), eq(instrument.projectId, projectId)))
      .orderBy(desc(instrument.createdAt)).limit(1);
    return rows[0]?.invite ?? null;
  },
  // The dates and the passcode of an instrument's public link, under the project row's lock
  // (the one publish takes) and only while that link is the project's link in force: a save
  // that waited on the publish of a newer draft finds its link replaced and is refused. The
  // dates go to the instrument's personal links too (E6-2: they follow the public link);
  // the passcode does not.
  updatePublic: async (workspaceId: WorkspaceId, instrumentId: string, patch: Partial<Omit<PublicLinkData, "token">>): Promise<{ invite: Invite } | { refused: "replaced" | "none" } | null> => {
    if (!isUuid(instrumentId)) return null;
    return db.transaction(async (tx) => {
      const [own] = await tx.select({ id: instrument.id, projectId: instrument.projectId }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.id, instrumentId))).limit(1);
      if (!own) return null;
      const [locked] = await tx.select({ id: project.id, projectId: project.id }).from(project).where(and(eq(project.workspaceId, workspaceId), eq(project.id, own.projectId))).for("no key update");
      if (!locked) return null;
      const [live] = await tx.select({ instrumentId: invite.instrumentId }).from(invite).innerJoin(instrument, eq(instrument.id, invite.instrumentId))
        .where(and(eq(invite.workspaceId, workspaceId), eq(invite.kind, "public"), eq(instrument.projectId, locked.projectId)))
        .orderBy(desc(instrument.createdAt)).limit(1);
      if (!live) return { refused: "none" as const };
      if (live.instrumentId !== instrumentId) return { refused: "replaced" as const };
      const rows = await tx.update(invite).set(patch).where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId), eq(invite.kind, "public"))).returning();
      const dates: Partial<Pick<PublicLinkData, "opensAt" | "closesAt">> = {};
      if ("opensAt" in patch) dates.opensAt = patch.opensAt;
      if ("closesAt" in patch) dates.closesAt = patch.closesAt;
      if (Object.keys(dates).length > 0) await tx.update(invite).set(dates).where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId), eq(invite.kind, "personal")));
      return rows[0] ? { invite: rows[0] } : { refused: "none" as const };
    });
  },
};
