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
  pointer over the hero and the pricing section and is not rendered on touch screens.
- Fragments: the live card, the shaped items, the agreement bars and the to-do are the
  Marlow example as static markup (the same data as the board), swapped for the real
  components when E5 and E6 exist; story E12-1, acceptance 4.
- "Try the sample as a respondent" became "See the sample" to /app, because the respondent
  instrument does not exist yet and the copy rule is not to describe what the product does
  not have; it points at E12-4's sample instrument when that is built.

## Numbers

performance 98, accessibility 98, best practices 100, SEO 100; LCP 2.5 s, CLS 0, TBT 40 ms (the accessibility finding was the missing main landmark, added in the same pass). Playwright: e2e/landing.spec.ts.
