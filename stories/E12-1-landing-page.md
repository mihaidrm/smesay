# E12-1 Landing page F as real code, desktop and phone

User: a visitor who has never heard of the product
Status: built
Outcome: the landing page from the canvas, built as the product's own page, scoring over 90
on Lighthouse performance and accessibility on mobile.

Amended 2026-10-03 (design v2, decision 0041; Mihai: "I want the landing page in somewhere
like 3000/landing-page"): the page is landing page F (docs/design-notes/prototype-01/
LandingF.dc.html), served at /landing-page until Mihai moves it to /; the home page keeps its
placeholder until then. Landing page E and its phone board are superseded.

Amended 2026-10-04 (design note 53, Mihai's review): the Shape step switches between the
spreadsheet as imported and the shaped list (concept 3 of five drawn for Mihai); the third
step no longer speaks of phones; What you get back leads with what the PM gains over a
results fragment whose Table, Columns and Share switch works on the page; a Questions section
with seven questions sits after Pricing. Acceptance 1, 4, 6 and 7 below carry it.

Amended 2026-10-04 again (design note 58; Mihai: "a section on landing page where we
absolutely show all the advantages to this way compared to other traditonal ways"): "Why not
a spreadsheet, a form or a workshop?" between What you get back and Pricing, six points
against the way the visitor picks, with Compare in the nav. Acceptance 1, 6 and 7 carry it.

## Acceptance criteria
1. /landing-page renders landing page F (copy from docs/copy/landing.md): the nav, the dark
   hero with the aurora, the dot grid, the cursor light and the live card with the mascot's
   placeholder at its corner and the agreement chip, "Three steps", "What you get back",
   "Why not a spreadsheet, a form or a workshop?" (six points, a switch for the way used
   today),
   pricing (the Free card, decision 0008), "Questions" (seven, each opening in place), the
   one-line footer with SME expanded once.
   Desktop 1440 and phone 390 (decision 0015): one column under 1024 px, the card upright
   and full width, the type one step smaller, no horizontal scroll.
2. Motion as designed (design note 33, Motion): the hero rises once on load, sections rise on
   scroll once with the cards staggered, the live dot pulses, the mascot floats, the cursor
   light follows the pointer over the dark sections, buttons lift on hover; everything off
   under prefers-reduced-motion, the light off on touch.
3. Lighthouse mobile: performance and accessibility over 90 on the built page, measured with
   the Lighthouse CLI and the numbers recorded here on acceptance. The CI job comes with the
   move to / (the home page's Lighthouse is what the launch gate reads).
4. The product fragments on the page (the live card, the Shape switch, the results card with
   its tiles and three views, the group split, the to-dos) show the Marlow example (decision
   0005); the Shape and results fragments use the seed's own rows and numbers
   (src/db/seed/sample.ts). They are static markup until the dashboard components exist (E8
   to E10); then they render the real components with the seed data (decision 0004) and this
   criterion is re-accepted.
5. Buttons: "Start free" to the sign-in page; "Try the sample as a respondent" to /sample,
   E12-4's sample instrument (until E12-4 it was "See the sample" to the app).
6. Playwright: the page loads with the headline, the two buttons point where they should, and
   a 390 px viewport has no horizontal scroll; the third step names no phone; the Shape
   switch and the results switch change what they show; the seed's tiles are on the results
   card; a question opens; at 390 the Columns and Share views do not scroll sideways; the
   comparison shows six points and its switch changes the Today column.
7. The three switches are toggle buttons with aria-pressed in a named group, reachable by
   keyboard with the 2 px focus ring; every chart's kinds and counts are text for screen
   readers; the questions are native details elements that open without JavaScript.

## Out of scope
- Rewriting the copy after first users: Phase 4.
- The move to /: Mihai's call, one line in src/app/page.tsx when he gives it.

## Open questions
- Closed 2026-10-03 (decision 0042): the page describes the R1 product as planned; the copy
  rule is for the live product, and every planned line is checked at the launch gate
  (docs/copy/landing.md, "Claims to check before launch").
- Primary actions on the page are the violet gradient (design v2); on the respondent side
  they stay ink (decision 0031, 0016).

## Technical notes
src/app/landing-page/page.tsx with the sections inline, five client components
(cursor-light.tsx for the glow, reveal.tsx for the rise on scroll through
IntersectionObserver, shape-demo.tsx, results-demo.tsx and compare-demo.tsx for the three
switches), the motion keyframes in src/app/globals.css (landing-pulse,
landing-float, landing-rise). The landing keeps its own light and dark sections whatever the
app's mode, so its colours are written out rather than read from the mode tokens.

## Build record, 2026-10-03

Built on design v2 the day the design merged. Playwright e2e/landing.spec.ts covers
acceptance 6 (1 test, passed locally and in CI). Lighthouse CLI 13.5.0 on the production
build at http://localhost:3000/landing-page, mobile form factor, Chromium 1194:
performance 98, accessibility 100, best practices 100, SEO 100; LCP 2.5 s, CLS 0, TBT 50 ms.
Lighthouse sees the page as loaded, where the sections below the fold are still hidden by
the reveal-on-scroll, so axe-core 4 was run through Playwright over the whole page after
scrolling it: the result is in design note 36. Acceptance 4 holds in its amended form
(static Marlow markup) until E5 and E6. The audit of 2026-10-03 (6 blocking, 11 minor) and
what it changed: design note 36.

## Build record, 2026-10-04 (the amendment)

Design note 53. e2e/landing.spec.ts: 2 tests, both passed locally (the new one covers
acceptance 6 as amended). Lighthouse CLI 13.5.0 on the production build, mobile form factor,
Chromium 1194: performance 97, accessibility 100, best practices 100, SEO 100; LCP 2.6 s,
CLS 0, TBT 40 ms. axe-core 4.13.0 (WCAG 2.0 A and AA, 2.1 AA) through Playwright after
scrolling the whole page: 0 violations, 24 rules passed, at 1440 and at 390.
After the second audit the same day: the hero's live card and chip follow the seed; the
steps grid is one column under 1024 px (acceptance 1); e2e/landing.spec.ts checks the
Shape card's turn (2 tests, both passed).

## Build record, 2026-10-04 (the comparison)

Design note 58. e2e/landing.spec.ts: 4 tests, all passed on the dev server (the new one: the
nav link brings the section into view, six points, the switch changes the Today column and
leaves the SMEsay column as it was, the short label and no side scroll at 390). Lighthouse
CLI 13.5.0 on the production build, mobile form factor, Chromium 1194: performance 97,
accessibility 100, best practices 100, SEO 100; LCP 2.6 s, CLS 0, TBT 50 ms. axe-core 4.13.0
(WCAG 2.0 A and AA, 2.1 AA, best practice) through Playwright after scrolling the whole page:
0 violations, 38 rules passed, at 390 and at 1440, every section shown. After the audit the
same day: one column under 1024 px, the nav gap at 768, the switch's focus ring whole, every
SMEsay line with its condition, the survey form lines true of the common tools. Those
numbers were taken after that audit's fixes; CI run 37196295842 on cb32662: unit 54 files,
402 tests passed; e2e 22 passed. After the re-audit: the point labels shortened to two or
three words, the plain wording, the device and the group size conditions, the reminder
limit, the survey form lines conceding what a form has too, the pressed option no longer
covering the focus ring of the one before it, the board's frame at its measured height.

Amended 2026-10-05 (Mihai; design note 95): the header is sticky over every section
(src/app/landing-page/sticky-header.tsx), transparent over the hero and navy with a blur once
the page scrolls; the nav links glide to their section (scroll-behavior: smooth, not under
reduced motion) and each section stops 80 px from the top. e2e/landing.spec.ts covers both.

Changed 2026-10-08 (design note 117; Mihai: "a complete stranger understands everything"): the
hero, the three steps, "What you get back" and the questions were rewritten so every section
says what the visitor is looking at, the example company is named once at the top, and no
product word appears without its plain meaning. Acceptance 1 now reads eight questions; acceptance 6
reads the new headline and the sentence under the tiles.

Changed 2026-10-08, later (design note 118; Mihai: "I still have 0 clue what these numbers mean
here"): the group card names the item and the proposal, keeps its headline, and shows a table
of people (columns Sales, 2 people and Everyone else, 3 people; rows Agree with Should, Want a
different priority, Say it is not needed) instead of bars labelled "2 of 2"; e2e/landing.spec.ts
reads the rows and checks that no "of" count is left on the card.
