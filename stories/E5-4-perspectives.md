# E5-4 Perspective filter: tag items, respondents pick perspectives, see tagged items only

User: a PM whose list mixes Finance items with Sales items
Status: built
Outcome: each respondent sees the items tagged for the perspectives they picked; untagged
items go to everyone; the dashboard shows coverage per perspective.

## Acceptance criteria
1. Build has a Perspectives card: a list of names (up to 10, 1 to 30 characters each). Each
   item on Shape can carry any number of perspectives (built on Shape only, not on Build:
   docs/review-list.md, 2026-10-03); an item with none is shown to everyone.
2. With at least one perspective defined, About you asks "Which of these describe you?" with
   checkboxes (multi-select); the respondent sees the union of their perspectives' items plus
   the untagged ones. With none defined, the question is not shown.
3. Progress and the Wrap up count only the items the respondent can see; "[N] of [M]" uses
   their M. The dashboard's tracker filters by perspective and the agreement table shows
   coverage per perspective: how many of the respondents who could see an item answered it
   (E8-2, E8-3).
4. A unit test builds an instrument with three perspectives and proves the visible set for
   four respondent combinations, including none.
5. Playwright: tag two items, pick one perspective as a respondent, see the right count.

## Out of scope
- Routing by respondent field (Role = Finance picks the Finance perspective automatically):
  R2 candidate.

## Open questions
- None.

## Technical notes
Schema v1 has no perspectives: migration 0014 adds instrument.perspectives jsonb (the names),
item.perspectives text[] (default empty) and response.perspectives text[]; INTERFACES.md
records all three with the SQL form of the rule. The visible-set function lives in
src/lib/perspectives.ts and is used by E7 and E8.

Built 2026-10-03 (design note 44, decision 0044):
- Acceptance 1: the Perspectives card on Build (perspectives-form.tsx), the names one per
  line, up to 10 of up to 30 characters, unique ignoring case, in instrument.perspectives
  (migration 0014 with item.perspectives and response.perspectives, INTERFACES.md). Items
  are tagged on Shape, one chip per name under every item (perspective-tags.tsx); Build
  shows how many items carry one and the way to Shape. A removed name is dropped from the
  items that carried it and a case-only rename keeps them, in one statement under the
  instrument's lock; the names and the tags lock once published; "Build on version N"
  copies the names, not the tags (docs/review-list.md).
- Acceptance 2: About you (src/components/respondent/about-you.tsx) asks "Which of these
  describe you?" as checkboxes when the instrument has perspectives; the preview's Items
  screen narrows to what that respondent would see: the untagged items plus those sharing
  a pick (visibleItems in src/lib/perspectives.ts), a chapter emptied by the picks dropped
  from the row and the Start label, and a "nothing to rate" screen when nothing is left.
  The real page and the stored picks are E7-1 and E7-3.
- Acceptance 3: the preview's "0 of [N]" counts the visible items; the respondent app's
  progress, the Wrap up and the dashboard parts are E7-4, E7-5, E8-2 and E8-3, which read
  the same function.
- Acceptance 4: src/lib/perspectives.test.ts proves the visible set for five picks on an
  instrument with three perspectives, none included; the instrument test saves, tags,
  strips and refuses on the test database.
- Acceptance 5: e2e/build.spec.ts defines Finance and Sales, tags one item with each on
  Shape, sees the "nothing to rate" screen with no pick, then picks Finance in the preview
  and sees one item and "0 of 1".

