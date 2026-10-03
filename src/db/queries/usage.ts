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
    db.select({ n: count() }).from(response).where(and(eq(response.workspaceId, workspaceId), gte(response.submittedAt, start), inArray(response.instrumentId, ownInstruments))),
    db.select({ n: count(), cents: sum(aiRun.costEurCents) }).from(aiRun).where(and(eq(aiRun.workspaceId, workspaceId), gte(aiRun.createdAt, start), inArray(aiRun.projectId, ownProjects))),
  ]);
  return { projects: projects.n, responsesThisMonth: responses.n, aiRunsThisMonth: runs.n, aiCostCentsThisMonth: Number(runs.cents ?? 0) };
}
