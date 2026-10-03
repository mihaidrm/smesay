# E4-6 Golden set runner in CI

User: Claude, changing a prompt; Mihai, trusting the shaping step
Status: built
Outcome: the ten specs in evals/ run on any prompt change and the run fails on an invented
item, a missed item, a changed meaning or a glossary term not kept.

## Acceptance criteria
1. `npm run evals` runs evals/run.ts over the rows of evals/expected/*.json (decision 0037)
   and prints per spec: found, missed, invented, meaning changed, tokens missing, areas named
   and placed, flags expected, raised and matched, glossary kept, cost (evals/README.md,
   Scoring). Exit 1 on any invented item, missed item or changed meaning, or counts outside
   tolerance. (As built on 2026-10-03: the area count is printed with "outside tolerance"
   and does not fail the run; open question 2 below.)
2. Matching uses must_keep tokens first (no model call) and a judge call for meaning only
   where tokens match but wording differs; the judge prompt is in evals/judge.md and the
   judge's own output is schema-validated. (As built: a reader version identical to its row
   needs no call; every other one goes to one judge call per spec, every ref answered once;
   a missing token is counted and printed and the judge decides; open question 1 below.)
3. CI runs the evals job only on a pull request, or a push to main, that changed a file the
   shaping result depends on: src/lib/ai/, src/lib/shaping.ts or evals/ (paths filter on its
   own workflow), with ANTHROPIC_API_KEY from the repository's secrets scoped to the steps
   that need it; the job is skipped, not failed, when the secret is absent, and the skip is
   printed.
4. A run writes evals/results/latest.json (ignored by git) and the cost of the run in euro
   cents to the console.
5. The first green run on all ten specs is recorded in this story with the date and the
   model id. Real runs on 2026-10-03, all on claude-sonnet-5-5 (the set had 135 rows until
   c760886 and has 134 since):
   - 62182b7, two runs (push and pull request): 3 of 10 for 34 cents, and 1 of 10 for 37.
     Spec 09 refused in both: its rows kept the tender numbering and the model read "3.1.1"
     as the ref. In the nine specs that ran, 122 of 122 rows were found. The judge counted
     a gender given to a person twice and a reason restated twice as additions; every spec
     gave 5 to 7 areas where the set expects 3 to 5; no area name matched a name or alias
     word for word. Fixes the same day: numbering stripped, the judge told a restated
     reason is not an addition and a given gender is, the shaping prompt told to give
     nobody a gender, area names matched by stems, the area count reported.
   - 9492622, two runs: 7 of 10 for 36 cents (01, 02 and 06 failed) and 7 of 10 for 39
     (06, 07 and 08 failed; 132 of 135 rows found). In the second: G06-13 kept the 12 m/s the
     row still carried next to its correction, which is the set's fault (the row now applies
     it); G07-06 and G08-06 shifted a condition ("until a meeting with the student";
     "receipts monthly" for "invoices monthly") and G07-08 added who sets the finance flag,
     which are the model's. Four reader versions out of 135.
   - c760886, one run (pull request only from here on): 8 of 10 for 34 cents. Spec 06
     failed on "a technician" read as an added party by a judge that did not see the
     project context naming technicians (the judge gets a CONTEXT line since 76e422f); spec
     08 again on "receipts monthly".
   The first green run goes here when a run gives it; what to change in the prompt is
   Mihai's call (design note 32, Open for Mihai).

## Out of scope
- Evals for insights (E9): their own small set, written in E9-1.

## Open questions
- The matching rule. The story as written said a missing must_keep token is a changed
  meaning, with the judge only where every token is present. The build counts the missing
  token and lets the judge decide, because the first run showed 15 missing tokens with the
  meaning intact each time ("for each product" for "per product"). Claude's call, pending
  Mihai's (design note 32); the stricter rule is a one-line change in evals/score.ts.
- The area count is reported, not failed on, until the prompt's grouping is decided (note 32).
- Mihai put ANTHROPIC_API_KEY in the repository secrets on 2026-10-03.

## Technical notes
run.ts uses the E4-1 client with purpose "shape" (the judge call too, there is no third
purpose) against a throwaway workspace "evals" with a project "Golden set", created once and
reused, so the runs are logged like any other and count against the product cap (decision
0036). Rows go through buildShapePrompt with no area column and the spec's context mapped to
the project context (goal and audience joined as the goal, the glossary joined as the terms).
checkShape guards the answer as in the app. Scoring is pure (evals/score.ts). Estimate at
Sonnet prices read 2026-10-02 (src/lib/ai/prices.ts, USD 2 and 10 per million tokens): a spec
of 15 rows is about 2,000 tokens in and 1,500 out for shaping plus about the same for the
judge, so about 4 cents a spec and under one euro a run; the real runs gave 3 to 6 cents a
spec and 34 to 39 for the ten (acceptance 5). Built 2026-10-03, design note 32.
