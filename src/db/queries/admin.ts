// The one place that reads across workspaces (stories/E13-2; E14 builds on it). Each read takes
// an AdminProof, which only requireAdmin() (src/lib/admin.ts) gives out, and the lint rule
// refuses this module outside src/app/admin/ (eslint-rules/db-access.mjs). The sample projects
// and deleted workspaces are left out everywhere, as usage() leaves the sample out
// (src/db/queries/usage.ts, E2-6), so the numbers are the customers' own. Counts are computed
// in SQL (CLAUDE.md, dashboard rules): date_trunc('week') starts weeks on Monday, the ISO week
// (postgresql.org/docs/current/functions-datetime.html, date_trunc).
import { and, count, eq, gte, inArray, isNotNull, isNull, max, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { event, instrument, project, response, workspace, workspaceMember } from "@/db/schema";
import { FUNNEL_STEPS, type AdminProof, type FunnelStep } from "@/db/types";
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

export type AdminWorkspace = { id: string; name: string; createdAt: Date; members: number; projects: number; published: number; responsesThisMonth: number; aiCostCentsThisMonth: number; lastActivity: Date };

// One query per figure for all workspaces at once, never one per workspace.
export async function workspaceUsage(proof: AdminProof, now = new Date()): Promise<AdminWorkspace[]> {
  checked(proof);
  const live = await db.select({ id: workspace.id, name: workspace.name, createdAt: workspace.createdAt }).from(workspace).where(isNull(workspace.deletedAt));
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
    return { id: w.id, name: w.name, createdAt: w.createdAt, members: m.get(w.id)?.n ?? 0, projects: u?.projects ?? 0, published: p.get(w.id)?.n ?? 0, responsesThisMonth: u?.responsesThisMonth ?? 0, aiCostCentsThisMonth: u?.aiCostCentsThisMonth ?? 0, lastActivity: last && last > w.createdAt ? last : w.createdAt };
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
