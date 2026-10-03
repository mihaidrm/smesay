# Design note 36: the landing page in code, 2026-10-03

Mihai: "I want the landing page in somewhere like 3000/landing-page." Landing page F
(design note 33) built as src/app/landing-page/page.tsx the same day; the home page keeps
its placeholder until he moves the landing to /. Story E12-1 amended for it.

## Decisions in the build

- Route and mode: the page lives at /landing-page. It keeps its dark hero and pricing with
  light sections between whatever the app's mode (decision 0041, point 2), so its colours
  are written out in the page rather than read from the mode tokens; only the primary
  button, the mark and the mascot placeholder come from shared components.
- Phone (decision 0015, no phone board for F): one column under 1024 px; the live card
  upright and full width instead of tilted; the headline 40 on 44 instead of 66 on 68, the
  section titles 32 on 36 instead of 44 on 48, the body 17 on 26; the buttons stack and span
  the width under 640 px; the nav keeps the lockup and Start free, the three anchors show
  from 768 px. The aurora blobs stay at their desktop sizes and overflow is clipped.
- Motion: the hero rises once on load (CSS); sections rise on scroll once through an
  IntersectionObserver in reveal.tsx, the hiding state set only on the client after checking
  for the observer and for reduced motion, so a page without JavaScript shows everything;
  the live dot pulses, the mascot floats, the cursor light (cursor-light.tsx) follows the
  pointer over the hero and the pricing section and is hidden by CSS on touch screens
  (the hover media feature).
- Fragments: the live card, the shaped items, the agreement bars and the to-do are the
  Marlow example as static markup (the same data as the board), swapped for the real
  components when E5 and E6 exist; story E12-1, acceptance 4.
- "Try the sample as a respondent" became "See the sample" to /app, because the respondent
  instrument does not exist yet and the copy rule is not to describe what the product does
  not have; it points at E12-4's sample instrument when that is built.

## Numbers

performance 98, accessibility 100, best practices 100, SEO 100; LCP 2.5 s, CLS 0, TBT 50 ms (a first run before the main landmark was added read accessibility 98). Playwright: e2e/landing.spec.ts.

## Audit (fresh context, same day)

17 findings, 6 blocking. Fixed before the merge: the two card labels on light ("To do,
written by AI", "Where groups disagree") used the mint and coral solids at 3.41 and 2.80
and now use the text colours (5.75 and 6.12 on white; the board changed with them); the nav
anchors had no focus ring; the cursor light was drawn on touch screens (now hidden by CSS
on hover: none); the board and the E12-4 story still said "Try the sample as a respondent";
small hero text lifted one step (#C9C4E0 and #D4D0E4) so it keeps 4.5 over the aurora and
the light; decision 0008 amended for the Free card; docs/copy/landing.md carries the page
metadata and the full claims list; docs/context.md says F; citations added in the two
client components; print shows every section; the test loads at 390, checks the hero and
pricing buttons and the hidden state before scrolling. Recorded as an open question in the
story rather than fixed: the page describes the planned product, which the copy rule
forbids; Mihai decides. Left as is: the reduced-motion setting is read once on mount; "See
the sample" and "Start free" both reach sign-in for a visitor without a session (acceptance
5 as worded, until E12-4). Evidence for accessibility below the fold: axe-core 4.13.0 (WCAG 2.0 A and AA, 2.1 AA rules) run through Playwright after scrolling the whole page, at 1440 and at 390: 0 violations, 20 rules passed at each width.

