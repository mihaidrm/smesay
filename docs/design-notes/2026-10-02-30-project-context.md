# Design note 30: the project context in the prompts, 2026-10-02

Story E4-5 (decision 0011). The context typed on Import, the goal and audience and the
terms to keep as written, reaches the model as data and the Shape page says so.
Screenshot beside the boards: shape-context-desktop.png.

## What was built

src/lib/ai/context.ts: contextBlock() writes one data section, "PROJECT CONTEXT" with
"Goal and audience:" and "Terms to keep as written:", whitespace folded, a part left out
when blank, nothing at all when both are; CONTEXT_INSTRUCTION is the one sentence for the
system prompt, which names nothing from the context. buildShapePrompt puts the section
before AREAS and the list and adds the sentence only when the section exists (acceptance
1, tested). shapeSet passes project.context_goal and context_terms. E9 reuses the builder.

On Shape, under the grouped line, in 13 px: "Context used: [goal] Kept as written:
[terms]" (the board's ctxLine), or "No project context given. Add one on Import so the AI
keeps your names and terms." with a link to the About this project card (acceptance 2).

## Decisions taken here

- The context is data, not instructions (SECURITY.md, AI; decision 0011): the system prompt
  says how to use the section, the section carries the words. A term list that reads like
  an instruction is still data.
- The terms go in as the PM typed them, one line; no splitting into a list, so a term with
  a comma survives. The model is told they are the project's own names, never translated,
  expanded, shortened or renamed; E4-6 checks that each term survives in the reader
  versions of specs 04 and 06 (acceptance 3).
- The line shows on Shape whenever a list exists, before and after a run, so the PM sees
  what the next run will use. The sample shows the no-context line without the link.
- E3-1's 2,000 character cap on the context holds, so no truncation here (the story's note);
  the prompt ceiling of E4-2 counts it.

## Open for Mihai

- The context copy on Shape (docs/copy/app.md, Shape) waits for your acceptance.
