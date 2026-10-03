# E9-3 Insight cost shown per run

User: the workspace owner watching the euros
Status: ready
Outcome: every run shows what it cost, and a run that would exceed the workspace's budget or
the product's cap is refused before it starts. The budget itself is never shown (decision 0036).

## Acceptance criteria
1. Under the actions: "Last run [DATE]: [N] tokens, EUR [COST]. This month: EUR [SPENT]."
   from the ai_run rows (E4-1). No budget number on the page: the workspace budget is for the
   admin area only (decision 0036, E14-2).
2. Before a run, the estimate (from the token count of the inputs and the price table) is
   checked by runModel (E4-1) against the product cap and the workspace budget; a refused run
   shows the E4-1 messages ("AI is paused until next month." or "This workspace has used its
   AI budget for the month.", docs/copy/errors.md, Shaping) with "This run would cost about
   EUR [ESTIMATE]." in front (added to docs/copy/errors.md with this story).
3. The estimate is within 30 percent of the actual on the seeded project (a test compares the
   estimate function with the fake transport's reported usage).
4. Settings' usage line (E2-6) matches the sum shown here.

## Out of scope
- Raising the budget in the app: credits bought from SMEsay, if that comes (decision 0036).

## Open questions
- None.

## Technical notes
The estimate uses the SDK's token counting endpoint when available (docs.anthropic.com, token
counting; unverified until the story) or a character-based estimate at 4 characters per token,
recorded in the story when chosen.
