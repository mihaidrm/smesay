# E8-5 Item detail: every respondent's answer and comment on one item

User: a PM deciding one item
Status: built
Outcome: one panel with the item, its original text, the proposal, the counts, and a row per
respondent, loaded under 500 ms with 100 responses.

Amended 2026-10-04 (decision 0044, item 6): the pill for the change kind reads "Different
priority", as everywhere on screen.

## Acceptance criteria
1. The detail (PM app board, item detail panel): reference, area, reader text, original text
   under it, proposed value, the four counts and "[N] not yet answered"; a row per respondent
   with status pill (Agree, Different priority, Disagree, Unclear, In progress, Not started), their value
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

Built 2026-10-04 (design note 62, decision 0044; docs/review-list.md):
- Acceptance 1: src/app/app/(shell)/projects/[projectId]/results/detail-panel.tsx from
  src/db/queries/results.ts detail.item: reference and area, the reader text as the title
  with the original under it when they differ, the proposed value with the instrument's
  label, the four counts and "[N] not yet answered" (rated and unclear on a rate-blind
  list), a row per person the page's filter keeps who sees the item, answers first, with
  the pill, "Not submitted" on an answer that counts before a Submit, their value where it
  differs from the proposal, and the reason, question or comment. The counts are the
  Agreement tab's for the item under the same filter and switch (a test checks four filters).
- Acceptance 2: an item's title on the Agreement table and in the three answer registers
  opens the panel; the URL carries item=[id] with the filter and the tab, so the link opens
  the same panel within the workspace; Close and Escape return to the tab. The actions'
  citations are E9-1's.
- Acceptance 3: src/db/queries/results.test.ts times the query with 100 generated responses
  under 500 ms, under three filters.
- Acceptance 4: a person with no answer that counts reads "No answer yet." in muted text
  (In progress, or Not started for an invite not opened); the query is scoped by the
  session's workspace and returns null for another workspace's item or instrument (tested).
- Acceptance 5: e2e/results-detail.spec.ts opens CL-04 from the Agreement table and from
  the Different priority register and reads Ioana Marin's reason.
- The panel is a 560 px region on the right that leaves Results usable (a dialog with
  aria-modal false), not a modal sheet: the PM can change the filter with it open, and the
  counts follow (design note 62).
