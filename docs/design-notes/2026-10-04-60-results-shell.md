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

## Checks

- src/lib/results-filter.test.ts, src/db/queries/results.test.ts, results-boundary.test.tsx.
- e2e/results.spec.ts: the sample's Results with the switch on and off, the role filter, a
  tile swapped and kept, the empty state.
