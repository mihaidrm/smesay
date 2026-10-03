# Design note 31: the AI budget leaves Settings; one cap for the product, 2026-10-03

Decision 0036. Mihai's rule: EUR 10 a month for the whole product while the idea is checked,
and no one in a workspace sees a budget. Both parts in one pull request.

## What was built

- src/lib/ai/client.ts reads ANTHROPIC_MONTHLY_BUDGET_EUR at each call (productCapEur(),
  whole euro or null) and checks the product's spend this month plus the estimate against it
  before the workspace budget and the plan cap. The refusal is a new reason, "paused", with
  its own message (AI_COPY.paused). The three checks read the same ai_run rows, so none can
  disagree. Order: product cap, workspace budget, plan cap; the first that refuses names itself
  in the detail for the server log.
- src/db/queries/usage.ts: productAiCostCentsThisMonth(now), the one query that reads across
  workspaces. It returns a sum, never a row, and the sample projects' rows do not count, as in
  usage(). It sits beside usage() rather than in queries/internal because nothing about a
  workspace leaves it; the admin epic (E14) gets its own module per decision 0035.
- Migration 0012: the column default 50 becomes 10, and rows at 50 become 10. A workspace
  whose budget an admin changed to another number keeps it.
- Settings: the AI budget card is gone. The usage line moves into the Plan card under the plan
  note, same text, same data-testid. The page no longer reads workspace.aiBudgetEur.
- Copy: AI_COPY.budget ends with "Come back next month." instead of asking the owner to raise
  a budget they cannot see. Both rows in docs/copy/errors.md, the Settings table in app.md.
- Tests: client.test.ts pauses the product on a cap computed from the test database's current
  spend (rows from earlier runs stay), lets a smaller call and next month through, and refuses
  with "failed" when the variable is missing, blank, a word or a decimal. usage.test.ts checks
  the product sum as a delta across two more workspaces and that samples do not count.
  e2e/settings.spec.ts asserts the budget line is gone and the usage line reads zero.
- playwright.config.ts gives the app server ANTHROPIC_MONTHLY_BUDGET_EUR=10 beside the fake
  key; CI has no other source for it.

## Why not

- A product cap without the workspace budget: one workspace could spend the whole EUR 10 in a
  day and pause the AI for everyone else. Kept, hidden (decision 0036, point 2).
- Reading the Console's limit from the API: Anthropic's Admin API lists usage and cost reports
  (platform.claude.com/docs/en/build-with-claude/usage-cost-api), not the spend limit, and it
  needs an admin key the app must not hold. The environment variable mirrors the Console
  number by hand; docs/accounts.md step 9 says to keep the two the same.
- Treating a missing variable as "no cap": a deploy that forgets it would run uncapped against
  the provider's limit. Refused instead, as a missing key is.

## Open for Mihai

- The usage line now sits in the Plan card. If it reads as a plan limit (it is not, no plan
  carries one), it can move to its own line under the cards.
