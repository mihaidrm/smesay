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

## The second run (CI run 37105823980 on 9492622, 39 cents)

7 of 10 passed. Spec 09 ran (13 of 13 found) once its numbering was gone; no gender was
invented; area names matched 3 or 4 of 4 in every spec once matched by stems. Still 6 to 8
areas where 3 to 5 are expected, placed 50 to 70 percent in the matched areas, and 4 to 8
ambiguity flags per spec. The three failures were one reader version each: a row that still
carried its correction next to the old value (fixed in the rows), two conditions shifted in
plainer words (an advisor's hold "until a meeting with the student"; "receipts monthly" where
the source says invoices monthly), and one addition (who sets the finance flag). Those are
the model's, and the shaping prompt is the place to change them; see Open for Mihai.

## The third run (CI run 37106214401 on c760886, 34 cents)

8 of 10. Spec 06 failed on two "added" verdicts for "a technician" and "the technician":
the spec's context says the app is one technicians use, and the judge saw only the pairs. The
judge now gets a CONTEXT line (goal and audience) before the pairs, and judge.md says a party
the context makes plain is not an addition. Spec 08 failed again on G08-06, the model reading
"receipts by email, invoices for companies with CUI, monthly" as monthly receipts: the same
drift as the second run, and the case for the prompt line in Open for Mihai.

## Audit of 2026-10-03

23 findings in fresh context, 10 blocking. Fixed the same day: a row with no source line
(spec 08's contrived duplicate, dropped: 12 rows, no duplicate expected there); corrections
that were appended to a row instead of applied (02, 06; a reader version kept both values and
the judge read a changed meaning); spec 09's numbering; a judge answer that names a ref
twice now refuses; the cost of a call the app refused is counted (read from the workspace's
ai_run rows); the throwaway workspace is found by a fixed id, never by a name a person could
pick; the workflow runs once per commit (pull requests, and main), scopes the key to its two
steps and holds a read-only token; duplicate flags count as the app keeps them (earlier item
only); positions are exact strings; stale "accepts it merged" notes rewritten; SECURITY.md
names the scripts outside src/ that read the database. Two rules the build changed from the
story are now open questions in the story and below, not choices.

## Open for Mihai

- The matching rule (story, open question 1): keep "the judge decides" when a must_keep token
  is missing, or the story's stricter "missing token is a changed meaning". Recommended:
  keep the judge, since the first run's 15 missing tokens were all intact meanings.
- Two lines left out of the rows that decision 0037's list does not name: spec 04's "the
  website must not look like the old one (Mihai will do the design)" and spec 08's "the
  washing machines are not part of this, separate contract". Both read as remarks, not
  requirements; say so if a PM would import them.
- Two runs of one commit differ: specs 06 and 10 passed in one run and failed in the other.
  The model is not deterministic and there is no knob: the Messages API page says
  "Deprecated. Models released after Claude Opus 4.6 do not support setting temperature. A
  value of 1.0 will be accepted for backwards compatibility, all other values will be
  rejected." (platform.claude.com/docs/en/api/messages, read 2026-10-03). Recommended: read
  two runs before changing a prompt, and treat one failing spec as a question, not a verdict.
- The remaining failures are drift in one reader version out of 13 to 14 per spec: a
  condition restated with a detail the row does not state, or a qualifier attached to the
  wrong noun. The prompt already says "Do not add detail the item does not have". Options:
  (a) accept 7 to 9 of 10 as the bar and record the first green run when it comes, (b) add to
  the prompt "When a sentence could be read two ways, keep the original wording of that part"
  and rerun, (c) both. Recommended: (b), one rerun, then (a) if it still drifts. A prompt
  change is product behaviour, so your call.
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
