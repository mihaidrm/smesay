# E4-5 Project context used by the prompts

User: a PM whose terms must survive the rewrite
Status: ready
Outcome: the goal and the glossary from Import shape the grouping and the wording, and the PM
can see that they were used.

## Acceptance criteria
1. The shaping prompt receives project.context_goal and context_terms as data (decision
   0011): the goal and audience to choose areas and tone, the terms as "keep as written". A
   unit test proves the prompt builder includes both and that an empty context produces a
   prompt without the section.
2. Shape shows "Context used: [goal]. Kept as written: [terms]." once at the top, or "No
   project context given. Add one on Import so the AI keeps your names and terms." (PM app
   board, ctxLine).
3. The golden set specs 04 and 06 carry a context block; the runner checks every glossary
   term appears unchanged in the reader versions (evals/README.md).
4. The same builder is reused by E9 for insights.

## Out of scope
- File upload as context: R2 (decision 0011).

## Open questions
- None.

## Technical notes
src/lib/ai/context.ts builds the context block; capped at 2,000 characters by E3-1's
validation, so no truncation logic here.
