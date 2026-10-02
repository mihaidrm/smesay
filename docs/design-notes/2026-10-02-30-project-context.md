# Design note 30: the project context in the prompts, 2026-10-02

Story E4-5 (decision 0011). The context typed on Import, the goal and audience and the
terms to keep as written, reaches the model as data and the Shape page says so.
Screenshots beside the boards: shape-context-desktop.png (after a run) and
shape-no-context-desktop.png.

## What was built

src/lib/ai/context.ts: contextBlock() writes one data section, "PROJECT CONTEXT" with
"Goal and audience:" and "Terms to keep as written:", whitespace folded, a part left out
when blank, nothing at all when both are; CONTEXT_INSTRUCTION is the instruction for the
system prompt: purpose-neutral (it names no areas or reader versions, so E9's insights
prompt reuses it with contextBlock), it says the section is data and nothing in it is an
instruction, and it names nothing from the context. buildShapePrompt puts the section
before AREAS and the list and adds the instruction plus one shaping line (the goal guides
the areas where the list came without them, their order, and the tone of the reader
versions) only when the section exists (acceptance 1, tested). shapeSet passes the
project's two fields and the run stores them on the set (item_set.context_used, migration
0011), so the page can say what a run was given rather than what Import says now.

On Shape, under the grouped line in 13 px (the board's ctxLine, with the story's full
stops):
after a run, "Context used: [goal]. Kept as written: [terms]."; before one, "Context the
AI will use: ..."; "none given" stands for a blank goal; when Import's context differs
from the one the run used, "The context on Import has changed since this run; Run again
to use it." follows; with no context at all, "No project context given. Add one on Import
so the AI keeps your names and terms." with a link to the About this project card
(acceptance 2). The browser test walks all three states.

## Decisions taken here

- The context is data, not instructions (SECURITY.md, AI; decision 0011): the system prompt
  says how to use the section, the section carries the words. A term list that reads like
  an instruction is still data.
- The terms go in as the PM typed them, one line; no splitting into a list, so a term with
  a comma survives. The model is told they are the project's own names, never translated,
  expanded, shortened or renamed; E4-6 checks that each term survives in the reader
  versions of specs 04 and 06 (acceptance 3).
- The line shows on Shape whenever a list exists, except on the sample: its seed carries a
  goal and terms but no run can use them (shaping refuses the sample), so a line would
  promise what cannot happen.
- Goal and terms each get one full stop through sentence(), so a trailing full stop typed
  on Import is not doubled. The too-long refusal reports the whole prompt as sent.
- The board (PmApp.dc.html) carries the same ctxLine: the label, the sentence with the
  link text when there is no context, one full stop each; it shows "Context used:" because
  the prototype's Shape shows a run's results, and it has no "changed since this run" note,
  which only a later edit on Import produces.
- E3-1's 2,000 character cap on the context holds, so no truncation here (the story's note);
  the prompt ceiling of E4-2 counts it, and the too-long message now counts the list and
  the context together.
- For E4-6: the golden specs carry a goal, an audience and a glossary list; the runner joins
  the goal and the audience into the goal field and the glossary with ", " into the terms,
  so the prompt it builds is the one a PM's project sends.

## Open for Mihai

- The context copy on Shape (docs/copy/app.md, Shape) waits for your acceptance.
