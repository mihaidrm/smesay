# Design note 44: perspectives on Build, Shape and the About you page, 2026-10-03

Made in the Claude Code cloud session of 2026-10-03 for stories/E5-4, under decision 0044.
Files: src/lib/perspectives.ts (the rule), src/lib/instruments.ts (savePerspectives,
tagItem), the Build page's perspectives-form.tsx, the Shape page's perspective-tags.tsx,
src/components/respondent/about-you.tsx, build/preview-panel.tsx, migration 0014.

## What was decided

- The names live on the instrument (jsonb string[]), the tags on the item (text[]) and the
  picks on the response (text[]), as the story's note asked; the arrays are text[] so E8
  can filter them in SQL with the overlap operator.
- Items are tagged on Shape, where the items are, as chips under each item; Build holds
  the names and says how many items carry one. The story says "each item on Shape and
  Build"; a second tagging list on Build would repeat Shape for up to 2,000 rows.
  Recorded in docs/review-list.md.
- Removing a name drops it from every item that carried it, on the newest instrument's
  set, and a case-only rename keeps the tags spelt the new way; both in one statement
  under the instrument row's lock, so a chip pressed meanwhile cannot write a removed name
  back. An item left with no tag goes to everyone. The names and the tags lock once the
  instrument is published, like the method: a tag added mid-run would take an item away
  from respondents who already answered it. "Build on version N" copies the names, not the
  tags. (Amended after the audit of 2026-10-03; docs/review-list.md.)
- About you asks the question as checkboxes in the same 48 px rows as the fields, only
  when the instrument has perspectives; with none picked the respondent sees the untagged
  items only (visibleItems). The preview lifts the picks into the panel so the Items
  screen and its "0 of [N]" follow them: the page sends the first ten untagged cards and
  the first ten per name, the panel draws the first ten visible, drops a chapter the picks
  empty from the row and the Start label, and shows "Nothing to rate yet"
  when nothing is left.
- The chips on Shape are a group named "Perspectives of [REF]", pressed state by
  aria-pressed, optimistic and aria-disabled (keeping focus) while the server answers, and
  show nothing while the newest instrument has no perspectives, is published or is built
  on another set than Shape's; the last two cases get a line under the grouped line.

## Checks

- Unit: src/lib/perspectives.test.ts (3 tests: five picks over five items, the names, the
  tags); src/lib/instruments.test.ts gains the save, the tagging, the stripping and the
  refusals (sample, other workspace).
- Playwright: e2e/build.spec.ts, two names, two tags on Shape, one pick in the preview.
