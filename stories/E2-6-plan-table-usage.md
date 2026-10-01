# E2-6 Plan table and usage counters

User: Mihai, watching the usage metric that decides when paid plans switch on (decision 0008)
Status: ready
Outcome: plan limits live in one table in the code, with a "free, no limits while validating"
entry, and every workspace's usage is counted from day one.

## Acceptance criteria
1. src/lib/plans.ts holds the plans (free, pro, team, enterprise) with limits for projects,
   responses per month and AI runs per month, prices from the business plan, and the current
   entry `free` with no limits (decision 0008). Nothing else in the code names a limit.
2. Usage is counted per workspace: projects created, responses submitted this month, AI runs
   this month, AI cost in euro cents this month. Counts come from SQL over the tables, not
   from counters that can drift; a test creates rows and checks the numbers.
3. Settings shows the usage line under the AI budget: "[N] projects, [N] responses this month,
   [N] AI runs this month."
4. Checking a limit is one function, `withinPlan(workspaceId, 'responses')`, called where a
   limit would apply (project creation, submission, AI run) and always true on the free entry.
   Switching a workspace to another plan is a column change on workspace (`plan`, default
   free), added in migration 0002.

## Out of scope
- Charging money, Stripe, plan upgrade screens: R3.
- Showing plans on the landing page beyond the one free line: decision 0008.

## Open questions
- None.

## Technical notes
Month boundaries in UTC. The AI budget check in E4-1 reads the same usage function so the
euro cap and the run cap cannot disagree.
