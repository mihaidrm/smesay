# E2-6 Plan table and usage counters

User: Mihai, watching the usage metric that decides when paid plans switch on (decision 0008)
Status: built
Outcome: plan limits live in one table in the code, with a "free, no limits while validating"
entry, and every workspace's usage is counted from day one.

## Acceptance criteria
1. src/lib/plans.ts holds the plans (free, pro, team, enterprise) with limits for projects,
   responses per month and AI runs per month, prices from the business plan, and the current
   entry `free` with no limits (decision 0008). Nothing else in the code names a limit.
2. Usage is counted per workspace: projects created, responses submitted this month, AI runs
   this month, AI cost in euro cents this month. Counts come from SQL over the tables, not
   from counters that can drift; a test creates rows and checks the numbers.
3. Settings shows the usage line in the Plan card: "[N] projects, [N] responses this month,
   [N] AI runs this month."
4. Checking a limit is one function, `withinPlan(workspaceId, 'responses')`, called where a
   limit would apply (project creation, submission, AI run) and always true on the free entry.
   Switching a workspace to another plan is a column change on workspace (`plan`, default
   free), added in migration 0004 (migration 0002 went to E2-3's session field).

## Out of scope
- Charging money, Stripe, plan upgrade screens: R3.
- Showing plans on the landing page beyond the one free line: decision 0008.

## Open questions
- None.

## Technical notes
Built 2026-10-02.

- src/lib/plans.ts: the four plans with the business plan's prices and limits (docs/
  business-plan.pdf, pages 3 and 4); the free entry has no limits (decision 0008) and the
  business plan's free limits sit beside it as `validatedFree`, not in force; a null limit is
  no limit; `withinPlan(workspaceId, kind)` reads the workspace's plan and usage() and is always
  true on free. The AI budget (EUR 10, decision 0036; hidden from the workspace, set in the
  admin area) is a budget, not a plan limit, and stays on the workspace row. The product's
  own cap is ANTHROPIC_MONTHLY_BUDGET_EUR (E4-1). Nothing else in the code names a limit.
- src/db/queries/usage.ts: projects, the month's submitted responses (submitted_at), the
  month's AI runs and their cost in euro cents, each a SQL count or sum at call time, months
  from 00:00 UTC on the first. The sample project's rows never count (its responses and AI
  runs are invented, CLAUDE.md), so a new workspace starts at zero; this also fixes the E2-5
  audit's finding that the budget card showed the sample's EUR 0.09 as spent.
  src/db/queries/usage.test.ts creates rows in two workspaces, plus sample rows, and checks the
  numbers and the boundary. The settings page's usage line reads it too, and
  productAiCostCentsThisMonth(now) sums the same rows across every workspace for the product
  cap (decision 0036). E4-1's budget checks read both.
- workspace.plan (migration 0004, docs/schema.md through the generator), PLAN_KEYS in
  src/db/schema.ts and PlanKey in INTERFACES.md; `workspaces.setPlan(ws, plan)` is the column change,
  with no screen until R3; src/lib/plans.test.ts switches a
  workspace to pro, fills the month to 500 and sees withinPlan() refuse, then true again the
  next month and back on free.
- Settings shows the usage line in the Plan card (docs/copy/app.md); e2e/settings.spec.ts
  reads it.
- Not in this story: calling withinPlan() where limits apply (E3-1 project creation, E7-5
  submission, E4-1 AI run; each names it), plan screens and charging (R3).
