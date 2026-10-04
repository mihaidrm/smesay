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

- Shape it, first pass: one item before and after. Mihai, after seeing it: "everything good
  except the 2nd card in the three steps section, need a serious brainstorm to get that
  right". Five concepts were drawn at the card's real size with the seed's own rows
  (screenshot sent in the session, 2026-10-04):
  1. One line, translated: the original struck through over the reader version. Clear, but
     it shows one item and says nothing about areas.
  2. Sorted into areas: three area names with their counts. Shows grouping, not the words.
  3. Before and after, a switch: "Your sheet" (four rows of the spreadsheet as imported, in
     mono, in cells) and "Shaped" (the same rows under their areas, in plain words). Both
     halves of shaping in one card, and the visitor can flip it.
  4. You review what the AI did: one suggestion with Accept and Edit. Shows control, not the
     result.
  5. What comes out, in numbers: 3 areas, 6 rewritten, 1 flagged. Easy to scan, abstract.
  Chosen: 3. The card opens on "Your sheet" and turns to "Shaped" once, 900 ms after it is
  first seen (only when it starts below the fold, so nothing changes under the reader); with
  reduced motion or without JavaScript it rests on "Shaped". Both sides share one grid cell
  so the card never changes height. Mihai can pick another concept by number.
- The section's line no longer repeats step 2: "Start from the spreadsheet you already have.
  Let the AI make it readable. Send one link." Step 2 says "AI sorts the list into areas and
  writes each item in plain words. You choose which wording your experts see." (reader
  versions are accepted or rejected, E4-3).
- Send one link: "Experts answer without an account or an app. Their answers arrive while
  they work." The phone moves to Questions.
- What you get back leads with what the PM gains, each card headed by the gain and showing
  the product screen that delivers it:
  - "See where the list is weak": the results fragment with the tiles a PM picks, the filter
    chips and the line that says every chart and export follows the filter, and a view
    switch that works on the page (Table, Columns, Share), so the visitor sees the charts
    change.
  - "Know who disagrees, and why": Sales against everyone else on the policy flags (the
    share that did not agree, in coral, as the Data section draws it) with Tom's reason.
  - "Walk into the meeting with the decisions listed": the seed's first two to-dos, each
    citing two answers.
  - "Numbers that hold up": the export matches the dashboard to the row; CSV and the PDF
    summary.
- The legend names the four kinds (Agree, Different priority, Disagree, Unclear) as the
  dashboard will (decision 0014), drawn in the status colours (Agree #2F855A, the pushed-back
  #B7791F for Different priority, Disagree #718096, Unclear #7C3AED), each bar's kind and
  count also given as text for screen readers.
- Both switches (Shape and the chart view) are a landing variant of the segmented control:
  a violet-soft track (#EEEAFF) with no hairline border, because the design system's tint
  track does not show on the tint card behind the results (the Shape switch matches it);
  options 32 px high, 13 px in the Shape switch and 12 px in the chart switch; the active
  option white with a small shadow (0 2px 8px). Colours are written out because the landing does not follow the app's
  mode, so src/components/ui/segmented-control.tsx, which reads the mode tokens, is not used.
  This is the line CLAUDE.md asks for a component outside the design system.
- Questions: seven, after Pricing and before the footer, each a native details element that
  opens without JavaScript. The phone answer lives there. The line beside the title points to
  hello@smesay.app (E12-5 adds the bubble once Mihai answers its questions). After the audit
  two answers were corrected to what the stories build: the link asks the fields the PM
  chooses, at least one (E5-1), and a personal invite carries the email, and the name and
  role when the PM gave them (E6-2);
  projects are archived and a workspace is deleted within 24 hours (decision 0028, E11-2).
- The numbers in the Shape and results fragments are the seed's (src/db/seed/sample.ts): 5
  of 7 submitted, six items, 30 answers (19 agree, 7 different priority, 2 disagree, 2
  unclear), 63 percent agreement, so they match the sample project a visitor opens. The stat
  tiles go to two columns from 1024 to 1279 px, where four would not hold "5 of 7" at 30 px.
  After
  the second audit the hero follows too: the live card shows the seed's answers on CL-04
  (Ioana and Tom from Sales push it to Must have, Dana and Lukas agree) and the chip says
  63 percent from 30 answers, so the hero and the group card tell the same story.
- Step 2's second sentence and the AI answer say what R1 lets the PM do: choose which
  wording goes out (E4-3), move items between areas (E4-2), dismiss flags and to-dos (E4-4,
  E9-2). "Only its members see them" was cut: the admin view (E14-4) can open a workspace.

## Checks

- Screenshots at 1440 and 390 from the dev server; no side scroll at 390 in every view
  (scrollWidth 390).
- e2e/landing.spec.ts: the third step names no phone, the Shape switch and the view switch
  change what they show, the seed's tiles, a question opens, no side scroll at 390 in Columns
  and Share.
- Lighthouse on the production build: in stories/E12-1, Build record.

## Not decided

- Whether Questions sits before Pricing instead of after: after, so the price is seen first;
  Mihai may prefer otherwise.
