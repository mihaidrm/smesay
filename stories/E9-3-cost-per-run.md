# E9-3 Insight cost shown per run

User: the workspace owner watching the euros
Status: built
Outcome: every run shows what it cost, and a run that would exceed the workspace's budget or
the product's cap is refused before it starts. The budget itself is never shown (decision 0036).

## Acceptance criteria
1. Under the actions: "Last run [DATE AND TIME] UTC: [N] tokens, EUR [COST]. This workspace this
   month: EUR [SPENT]." (wording amended 2026-10-04, decision 0044: the month is the workspace's)
   from the ai_run rows (E4-1). No budget number on the page: the workspace budget is for the
   admin area only (decision 0036, E14-2).
2. Before a run, the estimate (from the token count of the inputs and the price table) is
   checked by runModel (E4-1) against the product cap and the workspace budget; a refused run
   shows the E4-1 messages ("AI is paused until next month." or "This workspace has used its
   AI budget for the month.", docs/copy/errors.md, Shaping) with "This run would cost about
   EUR [ESTIMATE]." in front (added to docs/copy/errors.md with this story).
3. The estimate is within 30 percent of the actual. Amended 2026-10-04 (decision 0044,
   docs/review-list.md): the seeded project is the sample, which runModel refuses, and the fake
   transport reports fixed usage whatever the input, so a test against it proves nothing.
   Instead every answered run logs its estimate next to its actual, and the check is the first
   real run on a PM's project (Write actions, or `npm run evals -- insights`, which uses the
   same expected output), read from the server log by Mihai.
4. Settings' usage line (E2-6) matches the sum shown here.

## Out of scope
- Raising the budget in the app: credits bought from SMEsay, if that comes (decision 0036).

## Open questions
- None.

## Technical notes
The estimate uses a character-based estimate at 4 characters per token (chosen 2026-10-04:
the token counting endpoint would be a second call before every run and was not checked
against the SDK in this session, so it stays unverified and unused).

Built 2026-10-04 (design note 68, decision 0044):
- Acceptance 1: under the actions, "Last run [DATE AND TIME] UTC: [N] tokens, EUR [COST]. This
  workspace this month: EUR [SPENT]." from the project's last answered insights ai_run
  (aiRuns.lastFor) and usage() (E2-6); no budget number; not on the sample, whose seeded runs
  usage() does not count.
- Acceptance 2: runModel checks the estimate (estimateCents over estimateText: the prompt and
  the output schema at four characters a token, plus the 1,500 output tokens Write actions
  expects; src/lib/ai/client.test.ts pins it) against the product cap and the
  workspace budget; a refused run shows "This run would cost about EUR [ESTIMATE]." in front
  of the E4-1 sentence. src/lib/insights.test.ts sets the budget to 0, then the cap to 0, and
  sees both messages with no call made.
- Acceptance 3: amended (above) and open until the first real run: every answered run logs
  "estimate [N] cents, actual [N] cents" on the server.
- Acceptance 4: Settings' usage line adds "EUR [SPENT] on AI this month." from the same
  usage() call; e2e/actions.spec.ts reads the tab's month after a run and finds the same sum
  on Settings.

