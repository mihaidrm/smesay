// The one place that reads across workspaces (stories/E13-2; E14 builds on it). Each read takes
// an AdminProof, which only requireAdmin() (src/lib/admin.ts) gives out, and the lint rule
// refuses this module outside src/app/admin/ (eslint-rules/db-access.mjs). The sample projects
// and deleted workspaces are left out everywhere, as usage() leaves the sample out
// (src/db/queries/usage.ts, E2-6), so the numbers are the customers' own. Counts are computed
// in SQL (CLAUDE.md, dashboard rules): date_trunc('week') starts weeks on Monday, the ISO week
// (postgresql.org/docs/current/functions-datetime.html, date_trunc).
import { and, count, desc, eq, exists, gte, ilike, inArray, isNotNull, isNull, max, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { adminAudit, adminNote, event, instrument, invite, itemSet, project, response, upload, user, workspace, workspaceMember } from "@/db/schema";
import { FUNNEL_STEPS, type AdminAction, type AdminProof, type AuditChanges, type AuditOutcome, type FunnelStep, type WorkspaceId } from "@/db/types";
import { alias } from "drizzle-orm/pg-core";
import { log } from "@/lib/log";
import { internal } from "./internal";
import { unsafeWorkspaceId } from "./scoped";
import { usageByWorkspace } from "./usage";
import type { Workspace } from "./workspaces";

export const FUNNEL_WEEKS = 12;

// The proof checked at run time too, for a caller that cast its way past the type.
function checked(proof: AdminProof): void {
  if (proof?.checked !== "admin") throw new Error("The admin check did not run.");
}

// Monday 00:00 UTC of the week holding `now`.
export function weekStart(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

export type FunnelWeek = { week: Date; counts: Record<FunnelStep, number> };

// Newest week first. The day comes back as text ("YYYY-MM-DD 00:00:00", a timestamp without a
// zone), read as that day in UTC.
export async function funnel(proof: AdminProof, now = new Date()): Promise<FunnelWeek[]> {
  checked(proof);
  const first = weekStart(now);
  first.setUTCDate(first.getUTCDate() - 7 * (FUNNEL_WEEKS - 1));
  const week = sql<string>`to_char(date_trunc('week', ${event.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;
  const rows = await db.select({ week, name: event.name, n: count() }).from(event).leftJoin(workspace, eq(workspace.id, event.workspaceId))
    .where(and(gte(event.createdAt, first), inArray(event.name, [...FUNNEL_STEPS]), or(isNull(event.workspaceId), isNull(workspace.deletedAt))))
    .groupBy(week, event.name);
  const weeks: FunnelWeek[] = Array.from({ length: FUNNEL_WEEKS }, (_, i) => {
    const w = new Date(first);
    w.setUTCDate(first.getUTCDate() + 7 * i);
    return { week: w, counts: Object.fromEntries(FUNNEL_STEPS.map((s) => [s, 0])) as Record<FunnelStep, number> };
  });
  for (const r of rows) {
    const target = weeks.find((w) => w.week.toISOString().slice(0, 10) === r.week);
    if (target) target.counts[r.name as FunnelStep] = r.n;
  }
  return weeks.reverse();
}

export type AdminWorkspace = { id: string; name: string; createdAt: Date; firstSource: string | null; members: number; projects: number; published: number; responsesThisMonth: number; aiCostCentsThisMonth: number; lastActivity: Date };

// One query per figure for all workspaces at once, never one per workspace.
export async function workspaceUsage(proof: AdminProof, now = new Date()): Promise<AdminWorkspace[]> {
  checked(proof);
  const live = await db.select({ id: workspace.id, name: workspace.name, createdAt: workspace.createdAt, firstSource: workspace.firstSource }).from(workspace).where(isNull(workspace.deletedAt));
  if (live.length === 0) return [];
  const [members, published, activity, used] = await Promise.all([
    db.select({ id: workspaceMember.workspaceId, n: count() }).from(workspaceMember).groupBy(workspaceMember.workspaceId),
    db.select({ id: instrument.workspaceId, n: count() }).from(instrument).innerJoin(project, and(eq(project.id, instrument.projectId), eq(project.workspaceId, instrument.workspaceId)))
      .where(and(isNotNull(instrument.publishedAt), eq(project.isSample, false))).groupBy(instrument.workspaceId),
    db.select({ id: event.workspaceId, at: max(event.createdAt) }).from(event).where(isNotNull(event.workspaceId)).groupBy(event.workspaceId),
    // The usage figures are E2-6's (usage.ts), so this page and the plan check cannot disagree.
    usageByWorkspace(now),
  ]);
  const byId = <T extends { id: string | null }>(list: T[]) => new Map(list.map((r) => [r.id, r]));
  const m = byId(members), p = byId(published), a = byId(activity);
  return live.map((w) => {
    const u = used.get(w.id);
    const last = a.get(w.id)?.at ?? null;
    return { id: w.id, name: w.name, createdAt: w.createdAt, firstSource: w.firstSource, members: m.get(w.id)?.n ?? 0, projects: u?.projects ?? 0, published: p.get(w.id)?.n ?? 0, responsesThisMonth: u?.responsesThisMonth ?? 0, aiCostCentsThisMonth: u?.aiCostCentsThisMonth ?? 0, lastActivity: last && last > w.createdAt ? last : w.createdAt };
  }).sort((x, y) => y.lastActivity.getTime() - x.lastActivity.getTime() || x.name.localeCompare(y.name));
}

export type AdminTotals = { workspaces: number; projects: number; published: number; submitted: number };

export async function totals(proof: AdminProof): Promise<AdminTotals> {
  checked(proof);
  const own = and(eq(project.isSample, false), isNull(workspace.deletedAt));
  const [[w], [p], [i], [r]] = await Promise.all([
    db.select({ n: count() }).from(workspace).where(isNull(workspace.deletedAt)),
    db.select({ n: count() }).from(project).innerJoin(workspace, eq(workspace.id, project.workspaceId)).where(own),
    db.select({ n: count() }).from(instrument).innerJoin(project, and(eq(project.id, instrument.projectId), eq(project.workspaceId, instrument.workspaceId))).innerJoin(workspace, eq(workspace.id, project.workspaceId)).where(and(own, isNotNull(instrument.publishedAt))),
    db.select({ n: count() }).from(response).innerJoin(instrument, and(eq(instrument.id, response.instrumentId), eq(instrument.workspaceId, response.workspaceId))).innerJoin(project, and(eq(project.id, instrument.projectId), eq(project.workspaceId, instrument.workspaceId))).innerJoin(workspace, eq(workspace.id, project.workspaceId)).where(and(own, isNotNull(response.firstSubmittedAt))),
  ]);
  return { workspaces: w.n, projects: p.n, published: i.n, submitted: r.n };
}

export type AuditEntry = { action: AdminAction; targetWorkspaceId?: string | null; targetUserId?: string | null; changes?: AuditChanges };

// A row's changes are ids and fixed values (stories/E14-1, acceptance 3: never a secret, never
// respondent text). Free text has no place in them: a string longer than an id or a plan name is
// refused, and so is a row with more than 12 keys.
export const CHANGE_MAX = 80;
function checkChanges(changes: AuditChanges): void {
  const entries = Object.entries(changes);
  if (entries.length > 12 || entries.some(([k, v]) => k.length > 40 || (typeof v === "string" && v.length > CHANGE_MAX))) throw new Error("An audit row holds ids and fixed values only.");
}

// The result an action returns when the product refused it ({ error }, the shape of
// src/lib/members.ts Refused and the other helpers' refusals).
const isRefusal = (result: unknown): boolean => typeof result === "object" && result !== null && typeof (result as { error?: unknown }).error === "string";

// An admin action and its audit row (stories/E14-1, acceptance 3). The row is written first, by
// the admin the proof names; only when it is in does the action run, through the product's own
// helpers, so no action runs without its row. Then the row gets its outcome: done, refused (the
// action returned { error }) or failed (it threw, and the error goes on to the caller). A row
// left without an outcome is an action whose end was not recorded (the process stopped). fn must
// not call redirect() or notFound(): they throw, and the row would read failed.
export async function audited<T>(proof: AdminProof, entry: AuditEntry, fn: () => Promise<T>): Promise<T> {
  checked(proof);
  const changes = entry.changes ?? {};
  checkChanges(changes);
  const [row] = await db.insert(adminAudit).values({
    adminUserId: proof.userId,
    action: entry.action,
    targetWorkspaceId: entry.targetWorkspaceId ?? null,
    targetUserId: entry.targetUserId ?? null,
    changes,
  }).returning({ id: adminAudit.id });
  let outcome: AuditOutcome = "failed";
  try {
    const result = await fn();
    outcome = isRefusal(result) ? "refused" : "done";
    return result;
  } finally {
    try {
      await db.update(adminAudit).set({ outcome }).where(eq(adminAudit.id, row.id));
    } catch (error) {
      log("error", "admin:audit could not record an outcome.", { detail: row.id, reason: outcome, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

export const AUDIT_PAGE = 50;
// Pages past this are read as the last page; it keeps the offset a number Postgres takes.
const PAGE_CAP = 1_000_000;

export type AuditRow = { id: string; action: AdminAction; outcome: AuditOutcome | null; adminEmail: string | null; targetWorkspaceId: string | null; targetWorkspaceName: string | null; targetWorkspaceDeleted: boolean; targetUserId: string | null; targetUserEmail: string | null; changes: AuditChanges; createdAt: Date };

// Newest first, AUDIT_PAGE rows a page (page 1 is the first; a page past the end reads as the
// last, and the page read comes back), filtered by target workspace and by admin (acceptance
// 4). A target or an admin removed since shows as null, which the page prints as "deleted"; a
// workspace marked deleted and waiting for removal keeps its name, with targetWorkspaceDeleted.
// Ids that are not uuids match nothing rather than failing the query.
export async function auditLog(proof: AdminProof, opts: { page: number; workspaceId?: string | null; adminUserId?: string | null }): Promise<{ rows: AuditRow[]; total: number; page: number }> {
  checked(proof);
  const where: SQL[] = [];
  if (opts.workspaceId) where.push(isUuid(opts.workspaceId) ? eq(adminAudit.targetWorkspaceId, opts.workspaceId) : sql`false`);
  if (opts.adminUserId) where.push(eq(adminAudit.adminUserId, opts.adminUserId));
  const filter = where.length ? and(...where) : undefined;
  const [{ n: total }] = await db.select({ n: count() }).from(adminAudit).where(filter);
  const last = Math.max(1, Math.ceil(total / AUDIT_PAGE));
  const page = Math.min(last, Math.max(1, Math.min(PAGE_CAP, Math.floor(opts.page) || 1)));
  const admin = alias(user, "admin_user"), target = alias(user, "target_user");
  const rows = await db.select({
    id: adminAudit.id, action: adminAudit.action, outcome: adminAudit.outcome, adminEmail: admin.email, targetWorkspaceId: adminAudit.targetWorkspaceId, targetWorkspaceName: workspace.name,
    targetWorkspaceDeletedAt: workspace.deletedAt, targetUserId: adminAudit.targetUserId, targetUserEmail: target.email, changes: adminAudit.changes, createdAt: adminAudit.createdAt,
  }).from(adminAudit)
    .leftJoin(admin, eq(admin.id, adminAudit.adminUserId))
    .leftJoin(target, eq(target.id, adminAudit.targetUserId))
    .leftJoin(workspace, eq(workspace.id, adminAudit.targetWorkspaceId))
    .where(filter).orderBy(desc(adminAudit.createdAt), desc(adminAudit.id)).limit(AUDIT_PAGE).offset((page - 1) * AUDIT_PAGE);
  return { rows: rows.map(({ targetWorkspaceDeletedAt, ...r }) => ({ ...r, targetWorkspaceDeleted: targetWorkspaceDeletedAt !== null })), total, page };
}

// The filter choices: every workspace and admin that appears in the log; one removed since has
// no name or email (null), and the page names it by the start of its id.
export async function auditFilters(proof: AdminProof): Promise<{ workspaces: { id: string; name: string | null }[]; admins: { id: string; email: string | null }[] }> {
  checked(proof);
  const [workspaces, admins] = await Promise.all([
    db.selectDistinct({ id: sql<string>`${adminAudit.targetWorkspaceId}`, name: workspace.name }).from(adminAudit).leftJoin(workspace, eq(workspace.id, adminAudit.targetWorkspaceId)).where(isNotNull(adminAudit.targetWorkspaceId)),
    db.selectDistinct({ id: adminAudit.adminUserId, email: user.email }).from(adminAudit).leftJoin(user, eq(user.id, adminAudit.adminUserId)),
  ]);
  const byLabel = <T extends { id: string }>(label: (x: T) => string | null) => (a: T, b: T) => (label(a) ?? "\uffff" + a.id).localeCompare(label(b) ?? "\uffff" + b.id);
  return { workspaces: workspaces.sort(byLabel((w) => w.name)), admins: admins.sort(byLabel((a) => a.email)) };
}

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export type AdminDirectoryRow = { id: string; name: string; slug: string; plan: Workspace["plan"]; createdAt: Date; deletedAt: Date | null; owners: string[]; members: number; projects: number; published: number; responsesThisMonth: number; aiCostCentsThisMonth: number; lastActivity: Date };

// The Workspaces page (stories/E14-2, acceptance 1): every workspace, the deleted ones too (with
// deletedAt), by last activity; q matches the name, the slug or a member's email, in any case,
// as typed (% and _ are matched as themselves). The usage figures are E2-6's, as on the
// Overview. One query per figure for all the rows, never one per workspace.
export async function workspaceDirectory(proof: AdminProof, opts: { q?: string | null } = {}, now = new Date()): Promise<AdminDirectoryRow[]> {
  checked(proof);
  const q = (opts.q ?? "").trim().slice(0, 200);
  const like = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
  const match = q ? or(ilike(workspace.name, like), ilike(workspace.slug, like), exists(db.select({ one: sql`1` }).from(workspaceMember).innerJoin(user, eq(user.id, workspaceMember.userId)).where(and(eq(workspaceMember.workspaceId, workspace.id), ilike(user.email, like))))) : undefined;
  const list = await db.select({ id: workspace.id, name: workspace.name, slug: workspace.slug, plan: workspace.plan, createdAt: workspace.createdAt, deletedAt: workspace.deletedAt }).from(workspace).where(match);
  if (list.length === 0) return [];
  const ids = list.map((w) => w.id);
  const [people, published, activity, used] = await Promise.all([
    db.select({ id: workspaceMember.workspaceId, role: workspaceMember.role, email: user.email }).from(workspaceMember).innerJoin(user, eq(user.id, workspaceMember.userId)).where(inArray(workspaceMember.workspaceId, ids)).orderBy(user.email),
    db.select({ id: instrument.workspaceId, n: count() }).from(instrument).innerJoin(project, and(eq(project.id, instrument.projectId), eq(project.workspaceId, instrument.workspaceId)))
      .where(and(inArray(instrument.workspaceId, ids), isNotNull(instrument.publishedAt), eq(project.isSample, false))).groupBy(instrument.workspaceId),
    db.select({ id: event.workspaceId, at: max(event.createdAt) }).from(event).where(inArray(event.workspaceId, ids)).groupBy(event.workspaceId),
    usageByWorkspace(now),
  ]);
  const p = new Map(published.map((r) => [r.id, r.n])), a = new Map(activity.map((r) => [r.id, r.at]));
  return list.map((w) => {
    const u = used.get(w.id);
    const mine = people.filter((m) => m.id === w.id);
    const last = a.get(w.id) ?? null;
    return { ...w, owners: mine.filter((m) => m.role === "owner").map((m) => m.email), members: mine.length, projects: u?.projects ?? 0, published: p.get(w.id) ?? 0, responsesThisMonth: u?.responsesThisMonth ?? 0, aiCostCentsThisMonth: u?.aiCostCentsThisMonth ?? 0, lastActivity: last && last > w.createdAt ? last : w.createdAt };
  }).sort((x, y) => y.lastActivity.getTime() - x.lastActivity.getTime() || x.name.localeCompare(y.name));
}

// The one way the admin area turns an id from the address into a WorkspaceId (stories/E14-2):
// the workspace exists (deleted or not) and the caller passed the admin check. The product's
// own helpers then take it, as they take the one requireWorkspace() gives a member.
export async function adminWorkspace(proof: AdminProof, id: string): Promise<{ ws: WorkspaceId; workspace: Workspace } | null> {
  checked(proof);
  if (!isUuid(id)) return null;
  const row = (await db.select().from(workspace).where(eq(workspace.id, id)))[0];
  return row ? { ws: unsafeWorkspaceId(row.id), workspace: row } : null;
}

export type AdminInstrument = { id: string; projectId: string; title: string; publishedAt: Date | null; createdAt: Date; version: number; publicLink: { id: string; opensAt: Date | null; closesAt: Date | null; revokedAt: Date | null } | null; personalLinks: number };

// Each instrument of the workspace with the version of the list it was built on, its public
// link in force (the newest; a revoked one is replaced by "Publish again", E6-4) and how many
// personal links it has (acceptance 2).
export async function workspaceInstruments(proof: AdminProof, ws: WorkspaceId): Promise<AdminInstrument[]> {
  checked(proof);
  const [rows, links] = await Promise.all([
    db.select({ id: instrument.id, projectId: instrument.projectId, title: instrument.title, publishedAt: instrument.publishedAt, createdAt: instrument.createdAt, version: itemSet.version })
      .from(instrument).innerJoin(itemSet, and(eq(itemSet.id, instrument.itemSetId), eq(itemSet.workspaceId, instrument.workspaceId)))
      .where(eq(instrument.workspaceId, ws)).orderBy(instrument.createdAt),
    db.select({ id: invite.id, instrumentId: invite.instrumentId, kind: invite.kind, opensAt: invite.opensAt, closesAt: invite.closesAt, revokedAt: invite.revokedAt, createdAt: invite.createdAt })
      .from(invite).where(eq(invite.workspaceId, ws)).orderBy(desc(invite.createdAt)),
  ]);
  return rows.map((r) => {
    const mine = links.filter((l) => l.instrumentId === r.id);
    const pub = mine.find((l) => l.kind === "public");
    return { ...r, publicLink: pub ? { id: pub.id, opensAt: pub.opensAt, closesAt: pub.closesAt, revokedAt: pub.revokedAt } : null, personalLinks: mine.filter((l) => l.kind === "personal").length };
  });
}

export async function workspaceUploads(proof: AdminProof, ws: WorkspaceId): Promise<{ id: string; projectId: string; filename: string; kind: string; byteSize: number; createdAt: Date }[]> {
  checked(proof);
  return db.select({ id: upload.id, projectId: upload.projectId, filename: upload.filename, kind: upload.kind, byteSize: upload.byteSize, createdAt: upload.createdAt })
    .from(upload).where(eq(upload.workspaceId, ws)).orderBy(desc(upload.createdAt));
}

// The workspace's last product events (E13-1): names, counts and fixed values, no personal data.
export async function workspaceEvents(proof: AdminProof, ws: WorkspaceId, limit = 20): Promise<{ name: string; properties: Record<string, string | number>; createdAt: Date }[]> {
  checked(proof);
  return db.select({ name: event.name, properties: event.properties, createdAt: event.createdAt }).from(event).where(eq(event.workspaceId, ws)).orderBy(desc(event.createdAt), desc(event.id)).limit(limit);
}

export const NOTE_MAX = 2000;
export type AdminNote = { id: string; adminEmail: string | null; text: string; createdAt: Date };

// Support notes (acceptance 3): shown only on the workspace's admin page, newest first.
export const adminNotes = {
  list: async (proof: AdminProof, ws: WorkspaceId): Promise<AdminNote[]> => {
    checked(proof);
    return db.select({ id: adminNote.id, adminEmail: user.email, text: adminNote.text, createdAt: adminNote.createdAt }).from(adminNote)
      .leftJoin(user, eq(user.id, adminNote.adminUserId)).where(eq(adminNote.workspaceId, ws)).orderBy(desc(adminNote.createdAt), desc(adminNote.id));
  },
  add: async (proof: AdminProof, ws: WorkspaceId, adminUserId: string, text: string): Promise<{ id: string }> => {
    checked(proof);
    return (await db.insert(adminNote).values({ workspaceId: ws, adminUserId, text }).returning({ id: adminNote.id }))[0];
  },
};

// The AI budget (decision 0036): seen and set only here; the write is the product's own
// (internal.setAiBudgetEur, which the AI client reads).
export const AI_BUDGET_MAX_EUR = 10_000;
export async function setAiBudget(proof: AdminProof, ws: WorkspaceId, eur: number): Promise<Workspace | null> {
  checked(proof);
  return internal.setAiBudgetEur(ws, eur);
}

// The latest list version of each project of the workspace (acceptance 2).
export async function projectVersions(proof: AdminProof, ws: WorkspaceId): Promise<Map<string, number>> {
  checked(proof);
  const rows = await db.select({ id: itemSet.projectId, v: max(itemSet.version) }).from(itemSet).where(eq(itemSet.workspaceId, ws)).groupBy(itemSet.projectId);
  return new Map(rows.map((r) => [r.id, r.v ?? 0]));
}
