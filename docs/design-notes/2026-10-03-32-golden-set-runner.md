# Design note 32: the golden set runner, 2026-10-03

Story E4-6, on decision 0037 (the set is scored as imported rows). `npm run evals` and the
Evals CI job.

## What was built

- evals/golden-generator.py gained a ROWS table: the line a PM imports for each expected item,
  145 rows over the ten specs. Spec 03 gained G03-15, the Romanian duplicate row, with
  duplicate_of G03-03. The spec files show the rows under "Rows as imported"; the expected
  JSON carries `row` per item, item_count equal to the rows with tolerance 0, and
  area_count_tolerance 1. The documents as received are unchanged, for people to read.
- evals/run.ts: loads expected/*.json, makes or reuses the throwaway workspace "evals" and
  its project "Golden set", and per spec sends the rows through buildShapePrompt and runModel
  with checkShape as in the app, then one judge call for every reader version that is not
  the row word for word, then score(). Prints one line per spec, writes results/latest.json
  (ignored by git) and the total cost, exits 1 when a spec fails.
- evals/score.ts: pure scoring. Refs come back as positions, mapped to golden refs. Area
  names match by name or alias, case and spacing aside; placement is counted only for items
  whose expected area was named. Duplicate pairs match in either direction. Glossary terms
  a row carries must be in the reader version exactly.
- evals/judge.md: the judge prompt, instructions only, with the pairs as data; it answers
  sameMeaning, added and a note per ref (schema JudgeOutput in run.ts, every ref once).
- evals/run.test.ts (vitest now includes evals/): a fetch that answers from the expectation
  passes spec 01 in two logged calls with the exact console line; a dropped "not hidden" and
  an added sentence fail it with the counts; a renamed SkiPass+ fails spec 04 on the glossary
  while an alias names the area; a reversed duplicate flag matches on spec 08; a missing key
  is a refused spec with no judge call.
- .github/workflows/evals.yml: a second workflow, on push and pull request when a file under
  src/lib/ai/prompts/, the output schema, the context module or evals/ changed; Postgres
  service, migrate, `npm run evals`, the result file as an artifact. Without the secret the
  job prints that it skipped and passes. ANTHROPIC_MONTHLY_BUDGET_EUR is 10 in the job.

## Choices

- Missing must_keep tokens do not fail by themselves. The story said tokens first and the
  judge only when tokens match; a reader version that says "shown greyed out rather than
  hidden" has no "not hidden" token and the same meaning. So the count is printed and the
  judge decides. Changed from the story's wording; the story and README say so.
- One judge call per spec, not per item: 10 calls a run instead of about 145.
- The judge uses purpose "shape": ai_run.purpose allows shape and insights only (schema
  0001), and a third value is a migration for an eval. The throwaway workspace keeps the
  rows apart from any real one.
- No concurrency: ten specs run one after the other, under a minute each.
- The CI job is its own workflow with a paths filter rather than a job in ci.yml: the main
  workflow runs on every push and the paths filter is per workflow in GitHub Actions
  (docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore).

## Open for Mihai

- The first real run: PR 49's Evals job. Its numbers go into the story (acceptance 5). If a
  spec fails on the judge's reading rather than on a real loss, the fix is in the
  expectation or the judge prompt, not the shaping prompt; say which you want to see first.
- E4 is complete after this; the pause you asked for starts.
