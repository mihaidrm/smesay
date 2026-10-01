# E4-6 Golden set runner in CI

User: Claude, changing a prompt; Mihai, trusting the shaping step
Status: ready
Outcome: the ten specs in evals/ run on any prompt change and the run fails on an invented
item, a missed item or a changed meaning.

## Acceptance criteria
1. `npm run evals` runs evals/run.ts over evals/specs/*.md with evals/expected/*.json and
   prints per spec: found, missed, invented, meaning changed, areas matched, flags expected
   and raised, glossary kept (evals/README.md, scoring). Exit 1 on any invented item, missed
   item or changed meaning, or counts outside tolerance.
2. Matching uses must_keep tokens first (no model call) and a judge call for meaning only
   where tokens match but wording differs; the judge prompt is in evals/judge.md and the
   judge's own output is schema-validated.
3. CI runs the evals job only when a file under src/lib/ai/prompts/ or evals/ changed
   (paths filter on the workflow), with ANTHROPIC_API_KEY from the repository's secrets; the
   job is skipped, not failed, when the secret is absent, and the skip is printed.
4. A run writes evals/results/latest.json (ignored by git) and the cost of the run in euro
   cents to the console.
5. The first green run on all ten specs is recorded in this story with the date and the
   model id.

## Out of scope
- Evals for insights (E9): their own small set, written in E9-1.

## Open questions
- The repository secret. Decision 0006 keeps accounts personal until the launch gate; a key
  in GitHub Actions is a personal key on Mihai's account. Recommend: Mihai adds his key as a
  repository secret with the EUR 50 limit set in the Console; until then the job skips and
  Mihai runs `npm run evals` on his PC before accepting E4. Mihai decides.

## Technical notes
run.ts uses the E4-1 client with purpose "shape" against a throwaway workspace id so the
runs are logged like any other. Ten specs at about 15 items each cost well under one euro per
run at Sonnet prices on 2026-10-01 (recomputed in the story with the price table).
