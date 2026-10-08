# 120 The column mapping: roles that say what they mean, the latest pick wins, a context column for the AI, 2026-10-08

Mihai, 2026-10-08, with the open select pasted: "need to make the items in this dropdown much
more intuitive"; then "selecting Reference doesnt work - it changes back to do not import
automatically after half a second. Also in that list we need a field that signals the user that
the AI can get more context about the requirement from that field".

What was wrong:
- The options were bare nouns (Item text, Area, Proposed value, Reference, Custom field, Do not
  import). Nothing said what a custom field is for or what "proposed value" means.
- Four roles can sit on one column only. Picking one on a second column made the server keep
  the first column in file order and reset the pick to Do not import, without a word; the
  audit of 2026-10-02 had left it open. A file whose first column is guessed as the reference
  could never move the reference elsewhere.
- Nothing let a column reach the AI as background.

Decided:
- Each option reads "label: meaning" in the native select, and a line above the rows says what
  the card asks ("Say what each column holds. One column must be the item text; the others are
  optional."). The meanings: the requirement itself, one per row; the group or section the item
  belongs to; your priority for it, such as Must or Should; the item's own id, such as CL-04;
  background the AI reads when it shapes the list and writes actions, respondents never see it;
  extra detail kept with the item and shown to respondents under it; this column is left out.
- The latest pick wins a single role: the form carries the column just changed, and
  cleanMapping keeps that column's role and sends any other column asking for the same role to
  Do not import. The footer says so. A remembered mapping or a guess, which carry no changed
  column, keep the first column in file order as before.
- A seventh role, "Context for the AI": one column, stored as item.ai_context (migration 0038),
  appended to the item's line in the Shape prompt and the Write actions prompt as
  "(context: ...)", with an instruction to use it for placing and rewriting and never to copy
  it into the reader version. Respondents never see it: the respondent's item shape does not
  carry it. The whole-project export carries it, optional on import. Guessed from a header
  reading Notes, Comments, Context, Details, Background, Rationale, Why or Remarks.
- Not a custom field: a custom field's first value is shown to respondents under the item
  (src/lib/respondent.ts), which is the opposite of background for the AI.

Tests: src/lib/import/mapping.test.ts (the latest pick, the guess), report.test.ts (the
context cell), src/lib/ai/prompts/shape.test.ts (the context note); e2e/import.spec.ts picks
Reference on a second column and sees it move. Copy in docs/copy/app.md; shapes in
INTERFACES.md.
