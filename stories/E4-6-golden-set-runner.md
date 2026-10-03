# E4-6 Golden set runner in CI

User: Claude, changing a prompt; Mihai, trusting the shaping step
Status: built
Outcome: the ten specs in evals/ run on any prompt change and the run fails on an invented
item, a missed item, a changed meaning or a glossary term not kept.

## Acceptance criteria
1. `npm run evals` runs evals/run.ts over the rows of evals/expected/*.json (decision 0037)
   and prints per spec: found, missed, invented, meaning changed, tokens missing, areas named
   and placed, flags expected, raised and matched, glossary kept, cost (evals/README.md,
   Scoring). Exit 1 on any invented item, missed item, changed meaning or glossary term not
   kept, or an area count outside tolerance.
2. A reader version identical to its row is found without a model call; every other one goes
   to one judge call per spec, whose prompt is evals/judge.md and whose output is
   schema-validated with every ref answered once. A missing must_keep token is counted and
   printed; the judge decides whether the meaning survived.
3. CI runs the evals job only when a file under src/lib/ai/prompts/ or evals/ changed
   (paths filter on the workflow), with ANTHROPIC_API_KEY from the repository's secrets; the
   job is skipped, not failed, when the secret is absent, and the skip is printed.
4. A run writes evals/results/latest.json (ignored by git) and the cost of the run in euro
   cents to the console.
5. The first green run on all ten specs is recorded in this story with the date and the
   model id. Pending: the first run with the repository secret is the evals job of the pull
   request that built this (CI, 2026-10-03); its line goes here.

## Out of scope
- Evals for insights (E9): their own small set, written in E9-1.

## Open questions
- None. Mihai put ANTHROPIC_API_KEY in the repository secrets on 2026-10-03.

## Technical notes
run.ts uses the E4-1 client with purpose "shape" (the judge call too, there is no third
purpose) against a throwaway workspace "evals" with a project "Golden set", created once and
reused, so the runs are logged like any other and count against the product cap (decision
0036). Rows go through buildShapePrompt with no area column and the spec's context mapped to
the project context (goal and audience joined as the goal, the glossary joined as the terms).
checkShape guards the answer as in the app. Scoring is pure (evals/score.ts). Estimate at
Sonnet prices read 2026-10-02 (src/lib/ai/prices.ts, USD 2 and 10 per million tokens): a spec
of 15 rows is about 2,000 tokens in and 1,500 out for shaping plus about the same for the
judge, so 4 to 6 cents a spec and under one euro a run; the real numbers come from the first
run (acceptance 5). Built 2026-10-03, design note 32.
