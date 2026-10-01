# E9-3 Insight cost shown per run against the workspace budget

User: the workspace owner watching the euros
Status: ready
Outcome: every run shows what it cost, and a run that would exceed the budget is refused with
the shortfall.

## Acceptance criteria
1. Under the actions: "Last run [DATE]: [N] tokens, EUR [COST]. This month: EUR [SPENT] of
   EUR [BUDGET]." from the ai_run rows (E4-1).
2. Before a run, the estimate (from the token count of the inputs and the price table) is
   checked against the remaining budget; refused runs show "This run would cost about EUR
   [ESTIMATE] and the workspace has EUR [LEFT] left this month. Ask the workspace owner to
   raise the budget." (added to docs/copy/errors.md with this story).
3. The estimate is within 30 percent of the actual on the seeded project (a test compares the
   estimate function with the fake transport's reported usage).
4. Settings' usage line (E2-6) matches the sum shown here.

## Out of scope
- Raising the budget in the app: paid plans (R3).

## Open questions
- None.

## Technical notes
The estimate uses the SDK's token counting endpoint when available (docs.anthropic.com, token
counting; unverified until the story) or a character-based estimate at 4 characters per token,
recorded in the story when chosen.
