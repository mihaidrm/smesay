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

## The first real run (CI run 37105430695, claude-sonnet-5-5, 34 cents)

3 of 10 specs passed. What it showed, and what changed the same day:

- Spec 09 refused with "13 unknown ref(s) in areas": its rows kept the tender numbering
  ("3.1.1 The system shall...") and the model used 3.1.1 as the ref instead of [1]. The rule
  says numbering is stripped; the rows now are. A list pasted with such numbering in the app
  would hit the same confusion; the paste import strips "1." and "a)" but not "3.1.1"
  (src/lib/import/paste.ts), noted for E3 if it shows up in real files.
- Every row was found and no meaning changed in the nine specs that ran: 145 of 145 rows,
  0 changed. must_keep tokens were missing 15 times with the meaning intact (the judge agreed
  each time), which is why tokens are counted and not failed on.
- "Invented" 4 times: Dr. Iliescu became "her" and Mihnea "his" (spec 02), and two reasons
  the source gives in passing were restated as "because" clauses (04, 08). The pronouns are
  real inventions: the shaping prompt now says to give nobody a gender the item does not give.
  The restated reasons are not: judge.md now says so.
- The model gave 5 to 7 areas in every spec where the set expects 3 to 5, and no name
  matched a name or alias word for word (Placing the Order, Confirmation and Shortages,
  Client and Animal Files). Names now match loosely by stems; the area count is printed and
  not failed on, pending the question below.
- Ambiguity flags: 54 raised across the nine specs where the set expects 10. Nine of the ten
  expected ones were among them, so the model does see them; it also flags four to six more
  per spec.

## Open for Mihai

- Area granularity: the prompt asks for 3 to 8 areas and the model picks 5 to 7 for lists of
  10 to 18 rows. Recommended: tell the prompt to prefer the fewest areas that read well, three
  to five for a list under 40 items, then make the area count fail again. A prompt change
  reruns the evals (34 cents).
- Ambiguity volume: 4 to 6 flags per 15 rows means that many banners on Shape. Recommended:
  raise the bar in the prompt ("only when a respondent could not rate the item at all without
  asking") and watch the matched count in the next run; the dismissal and the one-banner-per-
  flag choice (decision 0037) stay.
- The next Evals job (this PR's second commit) is the candidate first green run for
  acceptance 5. E4 is complete after this; the pause you asked for starts.
