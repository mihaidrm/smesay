# 0038 The shaping prompt keeps ambiguous wording, prefers fewer areas and flags less, 2026-10-03

Status: decided by Mihai on 2026-10-03 ("go with your recommendation for both"), on the two
recommendations of design note 32 after six real golden set runs.

1. The shaping prompt (src/lib/ai/prompts/shape.ts) gains three lines: when a sentence could
   be read two ways, the reader version keeps the original wording of that part rather than
   choosing one reading; a list without areas is grouped into the fewest areas that read
   well, three to five for a list under 40 items and never more than eight; an ambiguity flag
   is set only when a respondent could not rate the item at all without asking, most items
   need none, and a vague word alone is not enough.
2. The golden set's area count fails a run again beyond area_count_tolerance (evals/score.ts),
   as story E4-6 acceptance 1 says.
3. If a run still drifts after the prompt lines, 7 to 9 of 10 specs is accepted as the bar
   for acceptance 5 and the first run at or above it is recorded; one failing spec is read as
   a question, not a verdict (note 32).
4. The matching rule (the judge decides when a must_keep token is missing) and the judge's
   context line stay as built; Mihai did not ask for the stricter rule.

Consequences: the prompt, its tests, the scorer and its test, story E4-6 and design note 32
on 2026-10-03; the Evals job reruns on the pull request.
