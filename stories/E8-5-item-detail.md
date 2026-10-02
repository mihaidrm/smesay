# E8-5 Item detail: every respondent's answer and comment on one item

User: a PM deciding one item
Status: ready
Outcome: one panel with the item, its original text, the proposal, the counts, and a row per
respondent, loaded under 500 ms with 100 responses.

## Acceptance criteria
1. The detail (PM app board, item detail panel): reference, area, reader text, original text
   under it, proposed value, the four counts and "[N] not yet answered"; a row per respondent
   with status pill (Agree, Changed, Disagree, Unclear, In progress, Not started), their value
   where it differs, and the reason, question or comment.
2. Opens from the agreement table, the registers and the actions' citations (E9-1); the URL
   carries the item so the panel can be linked within the workspace; Close returns to the tab.
3. Loads under 500 ms with 100 responses: measured in a test with generated rows.
4. In-progress respondents show "No answer yet." in muted text; the panel never shows
   another workspace's rows (E1-3 helpers; the cross-workspace test covers the query).
5. Playwright: open CL-04 on the seeded project, see Ioana Marin's reason.

## Out of scope
- Editing the item from the panel: R2.

## Open questions
- None.

## Technical notes
A sheet component (shadcn Sheet restyled) at 560 px; the query joins answer, response and the
unpacked respondent fields.
