# E4-6 Golden set runner in CI

User: Claude, changing a prompt; Mihai, trusting the shaping step
Status: built
Outcome: the ten specs in evals/ run on any prompt change and the run fails on an invented
item, a missed item, a changed meaning or a glossary term not kept.

## Acceptance criteria
1. `npm run evals` runs evals/run.ts over the rows of evals/expected/*.json (decision 0037)
   and prints per spec: found, missed, invented, meaning changed, tokens missing, areas named
   and placed, flags expected, raised and matched, glossary kept, cost (evals/README.md,
   Scoring). A spec fails on any invented item, missed item or changed meaning, a glossary
   term not kept, or an area count outside tolerance; the run exits 1 when fewer than 7 of
   the 10 specs pass (decision 0038, point 3).
2. Matching uses must_keep tokens first (no model call) and a judge call for meaning only
   where tokens match but wording differs; the judge prompt is in evals/judge.md and the
   judge's own output is schema-validated. (As built: a reader version identical to its row
   needs no call; every other one goes to one judge call per spec, every ref answered once;
   a missing token is counted and printed and the judge decides; decision 0038, point 4.)
3. The Evals job in CI is started by hand only (workflow_dispatch, decision 0039): Mihai
   runs it from the Actions tab when a prompt, the schema or evals/ changed and he wants the
   real numbers; it uses ANTHROPIC_API_KEY from the repository's secrets scoped to the steps
   that need it; the job is skipped, not failed, when the secret is absent, and the skip is
   printed. Nothing starts it on a push or a pull request.
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
   - 76e422f, CI run 37106473558: 9 of 10 for 38 cents. Spec 02 failed on G02-02, whose
     row put "30 for birds and reptiles" after the vaccination length and the model read it
     as visits only (the row now says it next to the visit, 69e353e). Spec 08 passed.
   - 69e353e, CI run 37106694262: 8 of 10 for 39 cents. G08-06 again ("receipts monthly");
     G07-10, where "export to the secretaries" became "the system sends", read by the judge
     as a decided channel.
   - c77427f, CI run 37106726352: 8 of 10 for 36 cents. G08-06 for the fourth time; G02-12,
     whose row began with the speaker label "Ana:" and came back as "when Ana marks a pet"
     (the label is not content and the row lost it).
   - ac2edaa, CI run 37106981888, before the prompt change: 7 of 10 for 40 cents (01 an
     addition, 06 and 08 a changed meaning).
   Decision 0038 then changed the prompt (keep ambiguous wording, fewest areas, fewer flags)
   and made the area count fail again. The first run with it, 0c8c6a8, CI run 37107240046,
   2026-10-03, claude-sonnet-5-5: 7 of 10 for 36 cents, and the first run with no content
   failure: 134 of 134 rows found, 0 invented, 0 meaning changed, every glossary term kept,
   ambiguity flags down to 0 to 4 per spec from 4 to 10. The three failures were area counts
   only: 05 gave 6 areas for 3 expected, 07 gave 5 for 3, 09 gave 3 for 5. That run meets the
   bar of decision 0038 and is recorded as acceptance 5. The ninth run (ffc3d55, CI run
   37107518921, the merge): 8 of 10 for 40 cents, no content failure, two area counts. The
   tenth, started by the merge to main itself (18544f0, CI run 37107761265, 39 cents, the
   last automatic run under decision 0039): 6 of 10, under the bar because the judge's note
   on one item of spec 01 ran to 201 characters against a 200 limit, which refused the whole
   judge answer and counted 15 items as changed; the limit is 400 now and an unusable judge
   answer gets one more try. Ten jobs in all, about 3 euro 70.

## Out of scope
- Evals for insights (E9): their own small set, written in E9-1.

## Open questions
- None. Decision 0038 settled the prompt lines, the area count and the matching rule; Mihai
  put ANTHROPIC_API_KEY in the repository secrets on 2026-10-03.

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
