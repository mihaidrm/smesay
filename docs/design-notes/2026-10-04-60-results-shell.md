# Design note 60: the Results page, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E8-1, under decision 0044.
The boards draw the strip and the tabs (the PM app boards, Results; design note 40) but not
the filter bar, the tile chooser or the "Showing" line; these follow the design system's
existing parts.

## What was decided

- The filter selects people (design note 40, E8-2 acceptance 2): started responses, and
  personal invites not opened yet, which carry the name and role their About you would start
  with and nothing else. A field filter, the perspective and the status match the person;
  the answer-kind filter keeps a person with at least one answer of a chosen kind (Not
  answered: an item they see and did not answer), the comment filter a person with an answer
  that has a reason or comment (with a kind chosen too, an answer of that kind). The numbers
  count the answers of the people kept. One rule for every tab, so a register and the strip
  always agree.
- "Submitted of invited" counts people: everyone kept, invited or started, and the
  submitted ones; with the include-unsubmitted switch off only the answers of people who
  have not submitted leave the numbers, not the people. Agreement is agree over the answers
  given against a shown proposal: a value rated with no proposal shown is "Rated", a kind of
  its own on the bar where the instrument hides the proposal, and never in agreement.
- Tiles: the catalogue's twelve, six on by default (the board's six with the new names), up
  to six, per PM per instrument. "Items with a different priority or disagree" names what the
  story called "items most pushed back". Median minutes to submit runs from the response's
  start to its first Submit.
- Tab counts: Different priority and Disagree counts both kinds; Questions and gaps the
  unclear answers and the missing items suggested; Actions the project's open actions (E9,
  not filtered). Each tab's content comes with its story and says so until then.
- The tabs are links (the tab in the URL, with the filter), the active one marked
  aria-current with the design system's 2 px violet underline, so each tab renders on the
  server with its own data and its own error boundary.
- Once the link is published the stepper's current step is Results and Share is done.
- Order on the page (after the audit): the switch and Choose tiles, the strip, then the
  filter bar and the "Showing" line under it, then the tabs. The line is a status region that
  stays in place across a filter change (the page's error boundary is not keyed), so the
  change is read out and the focus stays on the control. A filter that keeps nobody shows the no-match state; one that
  keeps people with no counted answer (an invite not opened, an answer not submitted with the
  switch off) shows the page, so the Responses tab lists them.
- The URL always carries the switch, so a shared view counts the same answers for whoever
  opens it: a first open without it is redirected to the full URL with the PM's stored
  choice, and the switch writes its new value into the URL.
- A personal invite counts among the invited once its email went out (sent), not while the
  mail failed.
- The sample's Results carries the watermark band "Sample data: invented answers, for looking
  around" (CLAUDE.md, dashboard rules); E8-8 puts it on every screen of the sample.

## Components added

- Skeleton (src/components/ui/skeleton.tsx): a raised-surface block with a slow pulse in the
  shape of what comes, hidden from assistive technology, its region aria-busy; the
  reduced-motion rule stops the pulse. Not in the design system before (it said "Loading"
  in text).
- The tile chooser is the HTML dialog element with showModal (Escape and the backdrop are
  the browser's), a native checkbox list in violet, the count in mono.
- The filter bar is a card of toggle chips (the design system's toggle chip), a "contains"
  box per text field and a select for the perspective.
- The error banner of a part is the design system's Banner with Try again in the Dismiss
  pill's place.
- The sample's band (SampleBand in the Results page): the dashed outline on the tint, the
  watermark line from E8-8 in soft ink, never dismissed. The PM app board's band now opens
  with the same line; its Delete sample button comes with E8-8.

- Added with E8-2 (the Responses tab), after its audit: the sortable header is a link in
  the column header (the label, then an arrow hidden from assistive technology), with
  aria-sort on the sorted header only ("should only be added to a single table or grid
  header at a time", developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/Attributes/
  aria-sort); the registers (E8-4) use the same header. The status cell is the design
  system's status pill (Submitted in the agree tint, Invited and In progress neutral) with
  E7-6's marks beside it as text: "Changes not submitted again" in the sun text colour,
  "Submitted again" in muted ink.

- Added with E8-4 (the registers), after its audit: each register is a card with its title
  and count, a table under it named by the title for screen readers, the sortable header of
  the Responses tab and rows that tint on hover. The disagree register sits under the
  different-priority register (both keep their columns at 1440). The respondent cell carries
  the Responses tab's marks: the Not submitted pill and "Changes not submitted again". The
  value columns sort in the scale's order. Each tab's panel has a heading for screen readers
  under the project's h1. The PM app board draws the register titles and columns as built;
  its Unclear and Missing items lists stay drawn as cards there, and the Results screens as
  built go on the canvas at the end of E8.

## Checks

- src/lib/results-filter.test.ts, src/db/queries/results.test.ts, results-boundary.test.tsx.
- e2e/results.spec.ts: the sample's Results with the switch on and off, the role filter, a
  tile swapped and kept, the empty state.
