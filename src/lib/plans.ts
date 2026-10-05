// The plan table (stories/E2-6, acceptance 1; decision 0008): the only place in the code that
// names a limit. Prices and limits are the business plan's table (docs/business-plan.pdf, page
// 3 and 4): Free 1 active project, 25 responses and 3 AI runs per month; Pro EUR 49 per month
// or 490 per year, unlimited projects, 500 responses per month; Team EUR 149 per month or
// 1,490 per year, 5 seats, 2,500 responses per month; Enterprise from EUR 6,000 per year,
// unlimited responses. Until the idea is validated the free entry has no limits (decision
// 0008); the business plan's free limits are kept beside it as `validatedFree` for the day
// Mihai sets the switch. A null limit means no limit. withinPlan() is the one check, read where
// a limit would apply (project creation, submission, AI run) and always true on the free entry.
import { workspaces } from "@/db/queries";
import { usage } from "@/db/queries/usage";
import type { PlanKey, WorkspaceId } from "@/db/types";
import { NotFoundError } from "@/lib/errors";

export type Limits = { projects: number | null; responsesPerMonth: number | null; aiRunsPerMonth: number | null; seats: number | null };
export type Plan = { key: PlanKey; name: string; priceEurPerMonth: number | null; priceEurPerYear: number | null; limits: Limits };

export const PLANS: Record<PlanKey, Plan> = {
  free: { key: "free", name: "Free", priceEurPerMonth: 0, priceEurPerYear: 0, limits: { projects: null, responsesPerMonth: null, aiRunsPerMonth: null, seats: null } },
  pro: { key: "pro", name: "Pro", priceEurPerMonth: 49, priceEurPerYear: 490, limits: { projects: null, responsesPerMonth: 500, aiRunsPerMonth: null, seats: 1 } },
  team: { key: "team", name: "Team", priceEurPerMonth: 149, priceEurPerYear: 1490, limits: { projects: null, responsesPerMonth: 2500, aiRunsPerMonth: null, seats: 5 } },
  enterprise: { key: "enterprise", name: "Enterprise", priceEurPerMonth: null, priceEurPerYear: 6000, limits: { projects: null, responsesPerMonth: null, aiRunsPerMonth: null, seats: null } },
};

// When paid plans switch on (decision 0008: "a usage metric reaches a value Mihai sets later";
// stories/E13-2, acceptance 4). The metric is Claude's recommendation under decision 0044
// (docs/review-list.md); the threshold stays null until Mihai sets it. The admin page reads
// both from here.
// Each metric is computed from the admin page's workspace rows, whose usage figures are
// usage()'s (E2-6), so changing `metric` changes the number with the label.
export type PlanMetricRow = { projects: number; responsesThisMonth: number; aiCostCentsThisMonth: number };
export const PLAN_METRICS = {
  workspacesWithSubmissionsThisMonth: { label: "Workspaces with a response submitted this month", value: (rows: PlanMetricRow[]) => rows.filter((r) => r.responsesThisMonth > 0).length },
  responsesThisMonth: { label: "Responses submitted this month, all workspaces", value: (rows: PlanMetricRow[]) => rows.reduce((n, r) => n + r.responsesThisMonth, 0) },
} as const;
export const PAID_PLAN_SWITCH: { metric: keyof typeof PLAN_METRICS; threshold: number | null } = {
  metric: "workspacesWithSubmissionsThisMonth",
  threshold: null,
};

// The business plan's free limits, not in force (decision 0008).
export const validatedFree: Limits = { projects: 1, responsesPerMonth: 25, aiRunsPerMonth: 3, seats: 1 };

export type LimitKind = "projects" | "responses" | "aiRuns";

export function limitFor(plan: PlanKey, kind: LimitKind): number | null {
  const limits = PLANS[plan].limits;
  return kind === "projects" ? limits.projects : kind === "responses" ? limits.responsesPerMonth : limits.aiRunsPerMonth;
}

export function isWithin(limit: number | null, used: number): boolean {
  return limit === null || used < limit;
}

export async function withinPlan(workspaceId: WorkspaceId, kind: LimitKind, now = new Date()): Promise<boolean> {
  const workspace = await workspaces.getById(workspaceId);
  if (!workspace) throw new NotFoundError();
  const limit = limitFor(workspace.plan, kind);
  if (limit === null) return true;
  const used = await usage(workspaceId, now);
  return isWithin(limit, kind === "projects" ? used.projects : kind === "responses" ? used.responsesThisMonth : used.aiRunsThisMonth);
}

// How many more of a kind the workspace's plan takes this month, or null for no limit (E10-2:
// an imported project's responses submitted this month count toward the month).
export async function roomInPlan(workspaceId: WorkspaceId, kind: LimitKind, now = new Date()): Promise<number | null> {
  const workspace = await workspaces.getById(workspaceId);
  if (!workspace) throw new NotFoundError();
  const limit = limitFor(workspace.plan, kind);
  if (limit === null) return null;
  const used = await usage(workspaceId, now);
  return Math.max(0, limit - (kind === "projects" ? used.projects : kind === "responses" ? used.responsesThisMonth : used.aiRunsThisMonth));
}
