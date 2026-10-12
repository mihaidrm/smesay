# 124 Plain section lines on the respondent side, 2026-10-12

Mihai, 2026-10-12, on the sample respondent: "please remove the AI language 'This comes
first, because every claim starts here.' re-fraze things in normal language like we discussed
before". The line under a chapter's name is the area's rationale from Shape; the sample seed,
the stand-in and the Shape prompt's example all wrote it as a sentence about the area's place
in the order ("This comes first, because ...", "This comes last and covers ..."), which reads
as written by a machine and tells respondents nothing they need.

Decided:
- The rationale is one plain sentence on what the area's items cover, with a subject and a
  verb (decision 0053 still holds), in the words a colleague would use. The sample seed
  (src/db/seed/sample.ts): "These items cover how a claim is submitted.", "These items cover
  what happens to a claim once it is in.", "These items cover how the money is paid back."
  The PmApp board carries the same three.
- The stand-in (src/lib/ai/stand-in.ts) writes "These items cover [area]." for every area,
  with no "first" or "next".
- The Shape prompt (src/lib/ai/prompts/shape.ts) asks for that sentence and says not to
  explain the order of the areas; the schema's example (src/lib/ai/shape-schema.ts,
  evals/schema.json) is "These items cover how a claim is submitted." Decision 0053's own
  text keeps its 2026-10-05 example as history. No model was called for this change
  (decision 0039): Mihai runs `npm run evals` before the next real Shape use.
- Existing projects keep the rationale their Shape run wrote; a new run writes the plain
  form. The sample is seeded at workspace creation, so a workspace made before this change
  keeps the old three lines in its sample.

Tests: src/lib/ai/stand-in.test.ts reads the stand-in's line; e2e/shape.spec.ts reads it on
the Shape page; the seed's tests (src/db/seed/seed.test.ts) count the areas, not their words.
