# E12-1 Landing page F as real code, desktop and phone

User: a visitor who has never heard of the product
Status: built
Outcome: the landing page from the canvas, built as the product's own page, scoring over 90
on Lighthouse performance and accessibility on mobile.

Amended 2026-10-03 (design v2, decision 0041; Mihai: "I want the landing page in somewhere
like 3000/landing-page"): the page is landing page F (docs/design-notes/prototype-01/
LandingF.dc.html), served at /landing-page until Mihai moves it to /; the home page keeps its
placeholder until then. Landing page E and its phone board are superseded.

## Acceptance criteria
1. /landing-page renders landing page F (copy from docs/copy/landing.md): the nav, the dark
   hero with the aurora, the dot grid, the cursor light and the live card with the mascot's
   placeholder at its corner and the agreement chip, "Three steps", "What you get back",
   pricing (the Free card, decision 0008), the one-line footer with SME expanded once.
   Desktop 1440 and phone 390 (decision 0015): one column under 1024 px, the card upright
   and full width, the type one step smaller, no horizontal scroll.
2. Motion as designed (design note 33, Motion): the hero rises once on load, sections rise on
   scroll once with the cards staggered, the live dot pulses, the mascot floats, the cursor
   light follows the pointer over the dark sections, buttons lift on hover; everything off
   under prefers-reduced-motion, the light off on touch.
3. Lighthouse mobile: performance and accessibility over 90 on the built page, measured with
   the Lighthouse CLI and the numbers recorded here on acceptance. The CI job comes with the
   move to / (the home page's Lighthouse is what the launch gate reads).
4. The product fragments on the page (the live card, the shaped items, the agreement bars,
   the to-do) show the Marlow example (decision 0005). They are static markup until the
   respondent and dashboard components exist (E5, E6); then they render the real components
   with the seed data (decision 0004) and this criterion is re-accepted.
5. Buttons: "Start free" to the sign-in page; "See the sample" to the app, where the sample
   project is (E12-4's sample instrument replaces that target when it exists).
6. Playwright: the page loads with the headline, the two buttons point where they should, and
   a 390 px viewport has no horizontal scroll.

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
src/app/landing-page/page.tsx with the sections inline, two client components
(cursor-light.tsx for the glow, reveal.tsx for the rise on scroll through
IntersectionObserver), the motion keyframes in src/app/globals.css (landing-pulse,
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
