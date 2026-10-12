// The plan table (stories/E2-6, acceptance 1; decision 0008): the only place in the code that
// names a limit. Prices and limits are the business plan's table (docs/business-plan.pdf, page
// 3 and 4): Free 1 active project, 25 responses and 3 AI runs per month; Pro EUR 49 per month
// or 490 per year, unlimited projects, 500 responses per month; Team EUR 149 per month or
// 1,490 per year, 5 seats, 2,500 responses per month; Enterprise from EUR 6,000 per year,
// unlimited responses. Until the idea is validated the free entry has no limits (decision
// 0008); the business plan's free limits are kept beside it as `validatedFree` for the day
// Mihai sets the switch. A null limit means no limit. withinPlan() is the one check, read where
// a limit would apply (project creation, submission, AI run) and always true on the free entry.
import { productState, workspaces } from "@/db/queries";
import type { Workspace } from "@/db/queries/workspaces";
import { usage } from "@/db/queries/usage";
import type { PlanKey, WorkspaceId } from "@/db/types";
import { NotFoundError } from "@/lib/errors";
import { DEFAULT_MODEL } from "@/lib/ai/prices";

export type Limits = { projects: number | null; responsesPerMonth: number | null; aiRunsPerMonth: number | null; seats: number | null };
// aiCreditsCents (E2-7, decision 0068): the AI a workspace on the plan can spend in a month
// once the product is launched, 20 percent of the monthly price in euro cents (a yearly payer
// gets the same); model: the model its calls go to (one model for every plan today, design
// note 133; a change here needs a price row in src/lib/ai/prices.ts).
export type Plan = { key: PlanKey; name: string; priceEurPerMonth: number | null; priceEurPerYear: number | null; limits: Limits; aiCreditsCents: number; model: string };

export const PLANS: Record<PlanKey, Plan> = {
  free: { key: "free", name: "Free", priceEurPerMonth: 0, priceEurPerYear: 0, limits: { projects: null, responsesPerMonth: null, aiRunsPerMonth: null, seats: null }, aiCreditsCents: 0, model: DEFAULT_MODEL },
  pro: { key: "pro", name: "Pro", priceEurPerMonth: 49, priceEurPerYear: 490, limits: { projects: null, responsesPerMonth: 500, aiRunsPerMonth: null, seats: 1 }, aiCreditsCents: 980, model: DEFAULT_MODEL },
  team: { key: "team", name: "Team", priceEurPerMonth: 149, priceEurPerYear: 1490, limits: { projects: null, responsesPerMonth: 2500, aiRunsPerMonth: null, seats: 5 }, aiCreditsCents: 2980, model: DEFAULT_MODEL },
  enterprise: { key: "enterprise", name: "Enterprise", priceEurPerMonth: null, priceEurPerYear: 6000, limits: { projects: null, responsesPerMonth: null, aiRunsPerMonth: null, seats: null }, aiCreditsCents: 10_000, model: DEFAULT_MODEL },
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

// The free plan's limits once the product is launched (decision 0008's business plan, decision
// 0068): one project, 25 responses a month, no AI (credits replace the runs cap).
export const validatedFree: Limits = { projects: 1, responsesPerMonth: 25, aiRunsPerMonth: null, seats: 1 };
// The trial every new workspace starts after launch (decision 0068): one validation, 20
// respondents, 33 cents of AI, 7 days.
export const TRIAL = { name: "Trial", days: 7, limits: { projects: 1, responsesPerMonth: 20, aiRunsPerMonth: null, seats: 1 } as Limits, aiCreditsCents: 33 } as const;
export const TRIAL_MS = TRIAL.days * 24 * 60 * 60 * 1000;

// What a workspace is entitled to at an instant (E2-7): the one place that turns the plan, the
// trial and the launched state into limits, AI credits and a model. Before launch the free
// plan has no limits and the AI is the hidden euro budget of decision 0036; after launch the
// trial, then the free limits with no AI, or the paid plan's, with the admin's credit
// override when set.
export type Entitlement = { plan: PlanKey; name: string; trial: boolean; trialEndsAt: Date | null; limits: Limits; aiCreditsCents: number; model: string };
export type EntitledWorkspace = Pick<Workspace, "plan" | "aiBudgetEur" | "aiCreditsCents" | "trialEndsAt">;

export function entitlementFor(workspace: EntitledWorkspace, launched: boolean, now = new Date()): Entitlement {
  const plan = PLANS[workspace.plan];
  const inTrial = workspace.plan === "free" && workspace.trialEndsAt !== null && workspace.trialEndsAt.getTime() > now.getTime();
  if (!launched) return { plan: plan.key, name: plan.name, trial: false, trialEndsAt: workspace.trialEndsAt, limits: plan.limits, aiCreditsCents: workspace.aiBudgetEur * 100, model: plan.model };
  const credits = workspace.aiCreditsCents ?? (inTrial ? TRIAL.aiCreditsCents : plan.aiCreditsCents);
  if (inTrial) return { plan: plan.key, name: TRIAL.name, trial: true, trialEndsAt: workspace.trialEndsAt, limits: TRIAL.limits, aiCreditsCents: credits, model: plan.model };
  if (plan.key === "free") return { plan: plan.key, name: plan.name, trial: false, trialEndsAt: workspace.trialEndsAt, limits: validatedFree, aiCreditsCents: credits, model: plan.model };
  return { plan: plan.key, name: plan.name, trial: false, trialEndsAt: workspace.trialEndsAt, limits: plan.limits, aiCreditsCents: credits, model: plan.model };
}

// The entitlement of a workspace now, with the launched state read unless the caller gives it
// (the tests, whose shared database is never launched).
export async function entitlement(workspaceId: WorkspaceId, now = new Date(), launched?: boolean): Promise<Entitlement> {
  const workspace = await workspaces.getById(workspaceId);
  if (!workspace) throw new NotFoundError();
  return entitlementFor(workspace, launched ?? (await productState.launched()), now);
}

export type LimitKind = "projects" | "responses" | "aiRuns";

export function limitFor(plan: PlanKey, kind: LimitKind): number | null {
  const limits = PLANS[plan].limits;
  return kind === "projects" ? limits.projects : kind === "responses" ? limits.responsesPerMonth : limits.aiRunsPerMonth;
}

export function isWithin(limit: number | null, used: number): boolean {
  return limit === null || used < limit;
}

export const limitOf = (limits: Limits, kind: LimitKind): number | null => (kind === "projects" ? limits.projects : kind === "responses" ? limits.responsesPerMonth : limits.aiRunsPerMonth);

export async function withinPlan(workspaceId: WorkspaceId, kind: LimitKind, now = new Date(), launched?: boolean): Promise<boolean> {
  const limit = limitOf((await entitlement(workspaceId, now, launched)).limits, kind);
  if (limit === null) return true;
  const used = await usage(workspaceId, now);
  return isWithin(limit, kind === "projects" ? used.projects : kind === "responses" ? used.responsesThisMonth : used.aiRunsThisMonth);
}

// How many more of a kind the workspace's plan takes this month, or null for no limit (E10-2:
// an imported project's responses submitted this month count toward the month).
export async function roomInPlan(workspaceId: WorkspaceId, kind: LimitKind, now = new Date(), launched?: boolean): Promise<number | null> {
  const limit = limitOf((await entitlement(workspaceId, now, launched)).limits, kind);
  if (limit === null) return null;
  const used = await usage(workspaceId, now);
  return Math.max(0, limit - (kind === "projects" ? used.projects : kind === "responses" ? used.responsesThisMonth : used.aiRunsThisMonth));
}
