# Design note 53: landing steps, what you get back, questions, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 after Mihai's review of landing page F:
"middle card seems too crowded", "3rd card talks about opening on phone, i wouldnt really
talk about phone here, but instead find a place where we can say that it can be done from
phone also, maybe we add an FAQ section as well?", and on What you get back: "we need to
show things that are more exciting ... nicer charts and visuals and possibility to configure
stuff, but also showcase better what the user stand to gain". Decisions under decision 0044;
the page, the board (docs/design-notes/prototype-01/LandingF.dc.html) and
docs/copy/landing.md changed together.

## What was decided

- Shape it: one sentence ("AI sorts the items into areas and rewrites each one in plain
  words. You approve every line.") over one item shown before and after: the reference and
  its area, the original struck through, the reader version. Three rows of three different
  flags were the crowding; one before and after says what shaping does.
- Send one link: "Experts answer without an account or an app. Their answers arrive while
  they work." The phone moves to Questions.
- What you get back leads with what the PM gains, each card headed by the gain and showing
  the product screen that delivers it:
  - "See where the list is weak": the results fragment with the tiles a PM picks, the filter
    chips and the line that says every chart and export follows the filter, and a view
    switch that works on the page (Table, Columns, Share), so the visitor sees the charts
    change. It is the one new script on the page, a small client island.
  - "Know who disagrees, and why": the group comparison with a quoted reason.
  - "Walk into the meeting with the decisions listed": the to-do list, each line citing
    answers.
  - "Numbers that hold up": the export matches the dashboard to the row; CSV and the PDF
    summary.
- The legend names the four kinds (Agree, Different priority, Disagree, Unclear) now, as the
  dashboard will (decision 0014); "Pushed back" is gone from the page.
- Questions: seven, after Pricing and before the footer, each a native details element that
  opens without JavaScript. The phone answer lives there. The line beside the title sends
  anything else to hello@smesay.app, where a person answers (E12-5 adds the bubble once Mihai
  answers its questions).
- The numbers in the results fragment are one consistent Marlow snapshot: six of seven
  experts, five items, thirty answers (20 agree, 4 different priority, 3 disagree, 3
  unclear), so every tile, bar, column and donut adds up.

## Checks

- Screenshots at 1440 and 390 from the dev server; no side scroll at 390 (scrollWidth 390).
- e2e/landing.spec.ts: the third step names no phone, the view switch changes the chart, a
  question opens.

## Not decided

- Whether Questions sits before Pricing instead of after: after, so the price is seen first;
  Mihai may prefer otherwise.
