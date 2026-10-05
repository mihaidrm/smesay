// The one place that reads across workspaces (stories/E13-2; E14 builds on it). Each read takes
// an AdminProof, which only requireAdmin() (src/lib/admin.ts) gives out, and the lint rule
// refuses this module outside src/app/admin/ (eslint-rules/db-access.mjs). The sample projects
// and deleted workspaces are left out everywhere, as usage() leaves the sample out
// (src/db/queries/usage.ts, E2-6), so the numbers are the customers' own. Counts are computed
// in SQL (CLAUDE.md, dashboard rules): date_trunc('week') starts weeks on Monday, the ISO week
// (postgresql.org/docs/current/functions-datetime.html, date_trunc).
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, max, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { adminAudit, event, instrument, project, response, user, workspace, workspaceMember } from "@/db/schema";
import { FUNNEL_STEPS, type AdminAction, type AdminProof, type AuditChanges, type AuditOutcome, type FunnelStep } from "@/db/types";
import { alias } from "drizzle-orm/pg-core";
import { log } from "@/lib/log";
import { usageByWorkspace } from "./usage";

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
