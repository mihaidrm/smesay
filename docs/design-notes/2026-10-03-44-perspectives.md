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
  set; an item left with no tag goes to everyone. Allowed on a published instrument: a
  name added changes nothing stored and a name removed only widens who sees an item.
- About you asks the question as checkboxes in the same 48 px rows as the fields, only
  when the instrument has perspectives; with none picked the respondent sees the untagged
  items only (visibleItems). The preview lifts the picks into the panel so the Items
  screen and its "0 of [N]" follow them.
- The chips on Shape are a group named "Perspectives of [REF]", pressed state by
  aria-pressed, optimistic while the server answers, and show nothing while the newest
  instrument has no perspectives or is built on another set than Shape's.

## Checks

- Unit: src/lib/perspectives.test.ts (3 tests: five picks over five items, the names, the
  tags); src/lib/instruments.test.ts gains the save, the tagging, the stripping and the
  refusals (sample, other workspace).
- Playwright: e2e/build.spec.ts, two names, two tags on Shape, one pick in the preview.
