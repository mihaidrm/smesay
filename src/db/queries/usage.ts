// A workspace's usage (stories/E2-6, acceptance 2): counted from the tables by SQL each time,
// never from counters that can drift. The sample project's rows do not count: they are
// invented (CLAUDE.md, dashboard rules), so a new workspace starts at zero. Months start at
// 00:00 UTC on the first. count(), sum() and inArray() with a subquery:
// orm.drizzle.team/docs/select#aggregations and /docs/operators#inarray. The AI budget check
// (E4-1) and withinPlan() (src/lib/plans.ts) both read this, so the euro cap and the run cap
// cannot disagree.
import { and, count, eq, gte, inArray, sum } from "drizzle-orm";
import { db } from "@/db";
import { aiRun, instrument, project, response } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";

export type Usage = { projects: number; responsesThisMonth: number; aiRunsThisMonth: number; aiCostCentsThisMonth: number };

export function monthStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function usage(workspaceId: WorkspaceId, now = new Date()): Promise<Usage> {
  const start = monthStart(now);
  const ownProjects = db.select({ id: project.id }).from(project).where(and(eq(project.workspaceId, workspaceId), eq(project.isSample, false)));
  const ownInstruments = db.select({ id: instrument.id }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), inArray(instrument.projectId, ownProjects)));
  const [[projects], [responses], [runs]] = await Promise.all([
    db.select({ n: count() }).from(project).where(and(eq(project.workspaceId, workspaceId), eq(project.isSample, false))),
    db.select({ n: count() }).from(response).where(and(eq(response.workspaceId, workspaceId), gte(response.firstSubmittedAt, start), inArray(response.instrumentId, ownInstruments))),
    db.select({ n: count(), cents: sum(aiRun.costEurCents) }).from(aiRun).where(and(eq(aiRun.workspaceId, workspaceId), gte(aiRun.createdAt, start), inArray(aiRun.projectId, ownProjects))),
  ]);
  return { projects: projects.n, responsesThisMonth: responses.n, aiRunsThisMonth: runs.n, aiCostCentsThisMonth: Number(runs.cents ?? 0) };
}

// Every live workspace's usage in three grouped queries, for the admin page (stories/E13-2),
// on the same conditions as usage() above: own projects only (the sample left out), responses
// by their first Submit this month, AI runs this month on own projects. A test checks the two
// agree for every workspace (src/db/queries/admin.test.ts), so the plan check and the admin
// page cannot drift.
export async function usageByWorkspace(now = new Date()): Promise<Map<string, Usage>> {
  const start = monthStart(now);
  const own = and(eq(project.isSample, false));
  const [projects, responses, runs] = await Promise.all([
    db.select({ id: project.workspaceId, n: count() }).from(project).where(own).groupBy(project.workspaceId),
    db.select({ id: response.workspaceId, n: count() }).from(response)
      .innerJoin(instrument, and(eq(instrument.id, response.instrumentId), eq(instrument.workspaceId, response.workspaceId)))
      .innerJoin(project, and(eq(project.id, instrument.projectId), eq(project.workspaceId, instrument.workspaceId)))
      .where(and(own, gte(response.firstSubmittedAt, start))).groupBy(response.workspaceId),
    db.select({ id: aiRun.workspaceId, n: count(), cents: sum(aiRun.costEurCents) }).from(aiRun)
      .innerJoin(project, and(eq(project.id, aiRun.projectId), eq(project.workspaceId, aiRun.workspaceId)))
      .where(and(own, gte(aiRun.createdAt, start))).groupBy(aiRun.workspaceId),
  ]);
  const out = new Map<string, Usage>();
  const at = (id: string) => out.get(id) ?? out.set(id, { projects: 0, responsesThisMonth: 0, aiRunsThisMonth: 0, aiCostCentsThisMonth: 0 }).get(id)!;
  for (const r of projects) at(r.id).projects = r.n;
  for (const r of responses) at(r.id).responsesThisMonth = r.n;
  for (const r of runs) { at(r.id).aiRunsThisMonth = r.n; at(r.id).aiCostCentsThisMonth = Number(r.cents ?? 0); }
  return out;
}
