# E15-3 One tip per step page, and the sample walkthrough on Results

User: a PM on Import, Shape, Build or Share for the first time
Status: built
Outcome: on each step page the robot says the one thing to do next, from the data, and on
the sample's Results it explains what the person is looking at, one screen at a time.

## Acceptance criteria
1. Each step page shows at most one guide card (E15-1), keyed by the data: Import with no
   set ("reading" pose: upload or paste); Import with a set and a mapping not yet checked;
   Shape not yet run; Shape run with suggestions pending; Build with the intro empty; Build
   with Name and Role still the default fields (a tip that a dropdown Role helps the
   dashboard split groups, E8-6); Share with the link in draft. Every line is in
   docs/copy/guide.md with its condition. A page whose data matches no condition shows no
   card.
2. A tip shows only once per screen state per person: the card is dismissed by the action
   it suggests as much as by Dismiss (importing a list dismisses the Import tip for that
   project), so the person never sees a tip for a thing they just did.
3. The sample walkthrough: on the sample project's Results, three tips in "analysis" pose,
   one per screen (the headline strip and the agreement table; the registers; the item
   detail), each opened by the person from the previous card's "Next" link, never by a
   timer; the third ends with "Start a project". Dismiss on any ends the walkthrough.
4. Nothing moves, flashes or pulses to draw attention to a card; the card is where the page's
   banners are (under the title). Keyboard: the card's action and Dismiss are in the tab
   order after the title.
5. Playwright: on a new project's Import the card says upload or paste; after a paste it says
   check the mapping; on the sample's Results the three walkthrough cards follow Next.

## Out of scope
- Tips on Results of the person's own project: the empty state (E8-1) and the data speak.
- Tips on Settings and Members: none in R1.

## Open questions
- None. Three walkthrough tips (decision 0044, item 3; docs/review-list.md).

## Technical notes
The condition per tip is a pure function of the page's loaded rows (src/lib/guide.ts),
called by each step page with what it already loads. Built 2026-10-05 (design note 90): two
reads were added where the page did not load the fact, responses.countForInstrument (Share)
and events.lastWith (Shape, the newest shape_failed of the project). The walkthrough has no
query parameter: the step is the Results screen itself (the agreement tab, the Different
priority and Disagree tab, an item's detail), so a reload keeps the place and the Next link
is a link to the next screen.
