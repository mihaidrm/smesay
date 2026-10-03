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
- src/db/queries/internal.ts: productAiCostCentsThisMonth(now), the one query that reads
  across workspaces. It returns a sum, never a row, and the sample projects' rows do not
  count, as in usage(). It sits in the fenced module, and the lint rule lets
  src/lib/ai/client.ts and its test import that module, as src/lib/workspace.ts already could,
  and nothing else outside src/db (src/db/queries/lint-rule.test.ts has both cases). The
  audit asked for this: a sum in usage.ts would have been importable by any page.
  setAiBudgetEur(workspaceId, eur) sits beside it, for the admin area (E14-2) and the tests;
  the session-scoped workspaces.update no longer accepts the budget, and the owner permission
  workspace.budget is gone (eight owner-only actions now).
- Migration 0012: the column default 50 becomes 10, and rows at 50 become 10. A workspace
  whose budget an admin changed to another number keeps it.
- Settings: the AI budget card is gone. The usage line moves into the Plan card under the plan
  note, same text, same data-testid. The page no longer reads workspace.aiBudgetEur.
- Copy: AI_COPY.budget ends with "Come back next month." instead of asking the owner to raise
  a budget they cannot see. Both rows in docs/copy/errors.md, the Settings table in app.md.
- src/lib/shaping.ts logs every refusal's reason and detail, so a paused product or a spent
  budget leaves a line in the server log, not only an unusable answer.
- Tests: client.test.ts pauses the product on a cap computed from the test database's current
  spend (rows from earlier runs stay), lets a smaller call and next month through, and refuses
  with "failed" when the variable is missing, blank, a word or a decimal. usage.test.ts checks
  the product sum as a delta across two more workspaces and that samples do not count.
  e2e/settings.spec.ts asserts the budget line is gone and the usage line reads zero.
- playwright.config.ts gives the app server ANTHROPIC_MONTHLY_BUDGET_EUR=100000 beside the
  fake key; CI has no other source for it, and a dev database that keeps the stand-in's rows
  across months must not reach the cap.

## Why not

- A product cap without the workspace budget: one workspace could spend the whole EUR 10 in a
  day and pause the AI for everyone else. Kept, hidden (decision 0036, point 2).
- Reading the Console's limit from the API: the Spend Limits API page says "The Spend Limits
  API is available to Claude Enterprise organizations only. It is not available to Claude
  Platform (Claude Console) organizations." (platform.claude.com/docs/en/manage-claude/
  spend-limits-api, read 2026-10-03), and it needs an admin key the app must not hold. The
  environment variable mirrors the Console number by hand; docs/accounts.md step 9 says to
  keep the two the same.
- A lock around the check and the call: two calls at the same moment each see the same spend,
  so the cap can be passed by one estimate per concurrent call, as the workspace budget could
  before. With the cap equal to the Console limit the provider then refuses and the user sees
  "The AI did not answer" with Try again. Accepted for one product at EUR 10 a month; a lock
  across workspaces would be the first serialised path in the app.
- Treating a missing variable as "no cap": a deploy that forgets it would run uncapped against
  the provider's limit. Refused instead, as a missing key is.

## Audit

Fresh-context audit of 2026-10-03, 13 findings: the cross-workspace sum in an importable
module (moved to internal, lint allowance for client.ts), CI red on the first commit (the
shaping tests had no cap variable), stories E2-4, E2-5, E14-2, E1-3 and INTERFACES.md still
giving owners the budget (fixed), workspaces.update still accepting the budget (removed),
refusals not logged (fixed), the test's row growth (a euro a run at most now), the e2e assertion
(now also no "AI budget" heading, and the usage line inside the Plan region), a three-cell
table row (fixed), the API citation (replaced), and the concurrency note above.

## Open for Mihai

Both points below were accepted as they stand on 2026-10-03 (decision 0037, point 3).

- The lint allowance is per module: client.ts may call every internal helper and could
  re-export the module. The same holds for src/lib/workspace.ts since E1-3. A rule against
  re-exporting queries/internal from an allowed file would close it; not added here.

- The usage line now sits in the Plan card. If it reads as a plan limit (it is not, no plan
  carries one), it can move to its own line under the cards.
