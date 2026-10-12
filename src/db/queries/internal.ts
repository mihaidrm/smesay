// Helpers that take no session: the seed, the removal job (E11-2, src/lib/workspace-removal.ts),
// the product's AI cap (src/lib/ai/client.ts) and the tests; lint lets in only the files
// eslint-rules/db-access.mjs names. Lint keeps this
// module out of every other file (eslint-rules/db-access.mjs), and the index barrel does not
// export it, so a route cannot reach a workspace by a bare id.
import { and, asc, count, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, lte, sum } from "drizzle-orm";
import { db } from "@/db";
import { session, verification } from "@/db/auth-schema";
import { adminAudit, aiRun, event, instrument, invite, itemSet, project, response, user, workspace, workspaceMember } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { NotFoundError, SignedOutError } from "@/lib/errors";
import { isUuid } from "./scoped";
import { monthStart } from "./usage";
import { workspaces, type DeletedWorkspace, type NewWorkspace, type Workspace } from "./workspaces";

// E16-1: a validation whose closing summary has not gone, with what the job needs to decide
// and to write the email.
export type Closing = { instrumentId: string; workspaceId: WorkspaceId; projectId: string; projectName: string; workspaceName: string; itemSetId: string; invites: { kind: "public" | "personal"; closesAt: Date | null; revokedAt: Date | null; submitted: number }[] };
// E16-1: an open validation with a new submission in the digest's window.
export type DigestCandidate = { instrumentId: string; workspaceId: WorkspaceId; projectId: string; projectName: string; workspaceName: string; fresh: number; submitted: number; invited: number; closesAt: Date | null };
// E16-2: a person the series may write to, with how far they got.
export type SeriesPerson = { userId: string; workspace: { id: string; name: string } | null; project: { id: string; name: string } | null; hasList: boolean; published: boolean };

export const internal = {
  // The seed asks "is the sample there?"; deleted workspaces included, so a half-removed one
  // is seen too.
  getWorkspaceById: async (workspaceId: string): Promise<Workspace | null> =>
    isUuid(workspaceId) ? (await db.select().from(workspace).where(eq(workspace.id, workspaceId)).limit(1))[0] ?? null : null,
  // A workspace with no member yet: the seed's sample workspace (stories/E1-4, acceptance 4),
  // whose owner is attached by E2's first sign-in.
  createEmptyWorkspace: async (data: NewWorkspace & { id?: string }): Promise<Workspace> =>
    (await db.insert(workspace).values(data).returning())[0],
  // What has passed its retention (decision 0054, docs/legal/privacy.md), deleted by the hourly
  // job: sessions that have ended, sign-in links that have expired, usage events older than
  // eventsBefore and admin log rows older than auditBefore. Counts per table, no ids.
  purgeExpired: async (now: Date, eventsBefore: Date, auditBefore: Date): Promise<{ sessions: number; links: number; events: number; audit: number }> => ({
    sessions: (await db.delete(session).where(lt(session.expiresAt, now)).returning({ id: session.id })).length,
    links: (await db.delete(verification).where(lt(verification.expiresAt, now)).returning({ id: verification.id })).length,
    events: (await db.delete(event).where(lt(event.createdAt, eventsBefore)).returning({ id: event.id })).length,
    audit: (await db.delete(adminAudit).where(lt(adminAudit.createdAt, auditBefore)).returning({ id: adminAudit.id })).length,
  }),
  // The removal job (stories/E11-2, acceptance 3): every workspace marked deleted, with the email
  // of the owner who deleted it.
  deletedWorkspaces: async (): Promise<DeletedWorkspace[]> =>
    (await db.select({ id: workspace.id, name: workspace.name, deletedAt: workspace.deletedAt, deletedByEmail: user.email })
      .from(workspace).leftJoin(user, eq(user.id, workspace.deletedBy)).where(isNotNull(workspace.deletedAt)))
      .map((r) => ({ id: r.id, name: r.name, deletedAt: r.deletedAt!, deletedByEmail: r.deletedByEmail })),
  // Deletes a deleted workspace's rows in decision 0028's order, in one transaction: its
  // responses (their answers and missing items go with them), then its projects (sets, items,
  // instruments, invites, actions, runs, uploads, export rows), then the workspace (members,
  // invitations, mappings). Counts per step. A workspace not marked deleted is left alone.
  purgeWorkspace: async (workspaceId: string): Promise<{ responses: number; projects: number; workspaces: number }> => {
    if (!isUuid(workspaceId)) return { responses: 0, projects: 0, workspaces: 0 };
    return db.transaction(async (tx) => {
      const marked = await tx.select({ id: workspace.id }).from(workspace).where(and(eq(workspace.id, workspaceId), isNotNull(workspace.deletedAt))).for("update");
      if (marked.length === 0) return { responses: 0, projects: 0, workspaces: 0 };
      const responses = (await tx.delete(response).where(eq(response.workspaceId, workspaceId)).returning({ id: response.id })).length;
      const projects = (await tx.delete(project).where(eq(project.workspaceId, workspaceId)).returning({ id: project.id })).length;
      const workspaces = (await tx.delete(workspace).where(eq(workspace.id, workspaceId)).returning({ id: workspace.id })).length;
      return { responses, projects, workspaces };
    });
  },
  // Removes the workspace and, through the cascades of schema v1, everything in it.
  hardDeleteWorkspace: async (workspaceId: string): Promise<boolean> =>
    isUuid(workspaceId) && (await db.delete(workspace).where(eq(workspace.id, workspaceId)).returning()).length > 0,
  // E16-1 (the hourly job): every validation with an invite whose closing summary has not gone,
  // in a workspace not deleted, with its invites and each invite's submitted responses.
  unsentClosings: async (): Promise<Closing[]> => {
    const heads = await db.select({ instrumentId: instrument.id, workspaceId: instrument.workspaceId, projectId: project.id, projectName: project.name, workspaceName: workspace.name, itemSetId: instrument.itemSetId })
      .from(instrument).innerJoin(project, eq(project.id, instrument.projectId)).innerJoin(workspace, eq(workspace.id, instrument.workspaceId))
      .where(and(isNull(instrument.closedEmailAt), isNull(workspace.deletedAt), eq(project.isSample, false)));
    if (heads.length === 0) return [];
    const ids = heads.map((h) => h.instrumentId);
    const rows = await db.select({ instrumentId: invite.instrumentId, id: invite.id, kind: invite.kind, closesAt: invite.closesAt, revokedAt: invite.revokedAt }).from(invite).where(inArray(invite.instrumentId, ids));
    const submitted = await db.select({ inviteId: response.inviteId, n: count() }).from(response).where(and(inArray(response.instrumentId, ids), isNotNull(response.submittedAt))).groupBy(response.inviteId);
    const byInvite = new Map(submitted.map((s) => [s.inviteId, s.n]));
    return heads.map((h) => ({ ...h, workspaceId: h.workspaceId as WorkspaceId, invites: rows.filter((r) => r.instrumentId === h.instrumentId).map((r) => ({ kind: r.kind, closesAt: r.closesAt, revokedAt: r.revokedAt, submitted: byInvite.get(r.id) ?? 0 })) })).filter((c) => c.invites.length > 0);
  },
  markClosedEmail: async (instrumentId: string, at: Date): Promise<boolean> =>
    isUuid(instrumentId) && (await db.update(instrument).set({ closedEmailAt: at }).where(and(eq(instrument.id, instrumentId), isNull(instrument.closedEmailAt))).returning({ id: instrument.id })).length > 0,
  // E16-1 (the digest): the validations with a response submitted in (since, now], not in a
  // deleted workspace, with their counts: new in the window, submitted in all, personal
  // invites not revoked, and the public link's close date (else the latest personal one).
  digestCandidates: async (since: Date, now: Date): Promise<DigestCandidate[]> => {
    const fresh = await db.select({ instrumentId: response.instrumentId, n: count() }).from(response)
      .where(and(gt(response.submittedAt, since), lte(response.submittedAt, now))).groupBy(response.instrumentId);
    if (fresh.length === 0) return [];
    const ids = fresh.map((f) => f.instrumentId);
    const heads = await db.select({ instrumentId: instrument.id, workspaceId: instrument.workspaceId, projectId: project.id, projectName: project.name, workspaceName: workspace.name })
      .from(instrument).innerJoin(project, eq(project.id, instrument.projectId)).innerJoin(workspace, eq(workspace.id, instrument.workspaceId))
      .where(and(inArray(instrument.id, ids), isNull(workspace.deletedAt), eq(project.isSample, false)));
    const all = await db.select({ instrumentId: response.instrumentId, n: count() }).from(response).where(and(inArray(response.instrumentId, ids), isNotNull(response.submittedAt))).groupBy(response.instrumentId);
    const invites = await db.select({ instrumentId: invite.instrumentId, kind: invite.kind, closesAt: invite.closesAt, revokedAt: invite.revokedAt }).from(invite).where(inArray(invite.instrumentId, ids));
    const n = (rows: { instrumentId: string; n: number }[], id: string) => rows.find((r) => r.instrumentId === id)?.n ?? 0;
    return heads.map((h) => {
      const mine = invites.filter((i) => i.instrumentId === h.instrumentId && i.revokedAt === null);
      const pub = mine.find((i) => i.kind === "public");
      const latestPersonal = mine.filter((i) => i.kind === "personal").map((i) => i.closesAt).filter((d): d is Date => d !== null).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
      return { ...h, workspaceId: h.workspaceId as WorkspaceId, fresh: n(fresh, h.instrumentId), submitted: n(all, h.instrumentId), invited: mine.filter((i) => i.kind === "personal").length, closesAt: pub ? pub.closesAt : latestPersonal };
    });
  },
  // E16-1 (the digest): the members of the workspaces named, by workspace.
  memberIds: async (workspaceIds: string[]): Promise<{ workspaceId: string; userId: string }[]> =>
    workspaceIds.length === 0 ? [] : db.select({ workspaceId: workspaceMember.workspaceId, userId: workspaceMember.userId }).from(workspaceMember).where(inArray(workspaceMember.workspaceId, workspaceIds)),
  // E16-2 (the series): the people who signed up in the window, oldest first, and how far each
  // got in the workspaces they belong to (deleted ones aside; the sample project's rows do not
  // count): a workspace, a list of their own imported, a validation published (any invite).
  seriesPeople: async (from: Date, to: Date): Promise<SeriesPerson[]> => {
    const people = await db.select({ id: user.id }).from(user).where(and(gte(user.createdAt, from), lte(user.createdAt, to))).orderBy(asc(user.createdAt));
    if (people.length === 0) return [];
    const ids = people.map((p) => p.id);
    const memberships = await db.select({ userId: workspaceMember.userId, workspaceId: workspace.id, workspaceName: workspace.name, joinedAt: workspaceMember.createdAt })
      .from(workspaceMember).innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId)).where(and(inArray(workspaceMember.userId, ids), isNull(workspace.deletedAt))).orderBy(asc(workspaceMember.createdAt));
    const wsIds = [...new Set(memberships.map((m) => m.workspaceId))];
    const projects = wsIds.length === 0 ? [] : await db.select({ id: project.id, name: project.name, workspaceId: project.workspaceId, createdBy: project.createdBy, createdAt: project.createdAt, sets: count(itemSet.id) })
      .from(project).leftJoin(itemSet, eq(itemSet.projectId, project.id)).where(and(inArray(project.workspaceId, wsIds), eq(project.isSample, false), isNull(project.archivedAt)))
      .groupBy(project.id).orderBy(desc(project.createdAt));
    const published = wsIds.length === 0 ? [] : await db.select({ workspaceId: instrument.workspaceId }).from(invite).innerJoin(instrument, eq(instrument.id, invite.instrumentId)).innerJoin(project, eq(project.id, instrument.projectId))
      .where(and(inArray(instrument.workspaceId, wsIds), eq(project.isSample, false))).groupBy(instrument.workspaceId);
    const publishedIn = new Set(published.map((p) => p.workspaceId));
    return people.map((p) => {
      const mine = memberships.filter((m) => m.userId === p.id);
      const first = mine[0] ?? null;
      const inMine = projects.filter((pr) => mine.some((m) => m.workspaceId === pr.workspaceId) && pr.sets > 0);
      const own = inMine.find((pr) => pr.createdBy === p.id) ?? inMine[0] ?? null;
      return { userId: p.id, workspace: first ? { id: first.workspaceId, name: first.workspaceName } : null, project: own ? { id: own.id, name: own.name } : null, hasList: inMine.length > 0, published: mine.some((m) => publishedIn.has(m.workspaceId)) };
    });
  },
  // The product's own AI spend this month, across every workspace (decision 0036): the one
  // number the product cap reads. A sum, never a row, and nothing else reads across
  // workspaces. The sample projects' rows do not count, as in usage().
  productAiCostCentsThisMonth: async (now = new Date()): Promise<number> => {
    const ownProjects = db.select({ id: project.id }).from(project).where(eq(project.isSample, false));
    const [row] = await db.select({ cents: sum(aiRun.costEurCents) }).from(aiRun).where(and(gte(aiRun.createdAt, monthStart(now)), inArray(aiRun.projectId, ownProjects)));
    return Number(row.cents ?? 0);
  },
  // The workspace's AI budget (decision 0036): set from the admin area (E14-2) and the tests,
  // never through the session-scoped update, so no workspace member can change it.
  setAiBudgetEur: async (workspaceId: string, aiBudgetEur: number): Promise<Workspace | null> =>
    isUuid(workspaceId) && Number.isInteger(aiBudgetEur) && aiBudgetEur >= 0
      ? (await db.update(workspace).set({ aiBudgetEur }).where(eq(workspace.id, workspaceId)).returning())[0] ?? null
      : null,
};

// The membership check behind requireWorkspace(headers, workspaceId) in src/lib/workspace.ts,
// for a user id the caller already trusts (the session, or a test). NotFoundError for a
// non-member, a missing or deleted workspace or a non-uuid id; SignedOutError for no user.
export async function requireWorkspaceForUser(userId: string | null, workspaceId: string): Promise<WorkspaceId> {
  if (!userId) throw new SignedOutError();
  const found = await workspaces.getForUser(userId, workspaceId);
  if (!found) throw new NotFoundError("This workspace does not exist, or you are not a member of it. Check the address, or go to your projects.");
  return found.id as WorkspaceId;
}
