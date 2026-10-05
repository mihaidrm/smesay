# E7-7 Accessibility: keyboard only, screen reader labels, contrast AA; the PM's brand on the page

User: an expert using a keyboard or a screen reader; a PM whose colour must not break the page
Status: built
Outcome: the whole respondent journey works without a mouse and reads aloud correctly, every
text passes AA, and the PM's logo and accent apply within the theming rules.

## Acceptance criteria
1. A Playwright run with axe-core over About you, a chapter, the Wrap up and Done on the
   sample instrument reports zero serious or critical violations (business plan E7).
2. Keyboard: every pill, toggle, box and button is reachable in reading order; the focus ring
   is 2 px violet with 2 px offset on focus-visible (design v2) (docs/design-system.md); a Playwright test
   tabs through one card and answers it with the keyboard only.
3. Screen reader: each card is a fieldset with its legend; the rating row is a radiogroup with
   the value and "proposed" in the accessible name; the note under the card is aria-live
   polite; the progress bar has role progressbar with value text (note 12, findings 35, 36).
4. Contrast: every text on the respondent side passes 4.5:1, with the accent used only where
   the design system allows (selected answer, active chapter, progress bar; amended
   2026-10-04: also the confidence picked, an answer too, and the header's initials when there
   is no logo, docs/review-list.md) and the fallback
   to ink when the PM's accent fails (E2-5). The status tints and text colours are the design
   system's.
5. Theming: the PM's logo replaces the mark in the header at 24 px, the workspace name beside
   it, "Powered by SMEsay" at the bottom of the page on the Free plan (under the card on a
   desktop, decision 0052) (design system, Identity). The
   fonts, Plus Jakarta Sans with Geist Mono for numbers (design note 33), are self-hosted; no
   request leaves the page to a font host (design system, Type). (Amended 2026-10-04 after
   the audit; the criterion named Geist, the type before design v2.)
6. `prefers-reduced-motion` turns off the 150 and 250 ms transitions (design system, Motion),
   and the 240 ms slide between chapters (E7-4, acceptance 7; added 2026-10-05).
7. (Added 2026-10-05, design note 97; Mihai: "should add the dark mode toggle on the sample
   respondent flow from the landing page as well".) The mode follows the phone's setting until
   the respondent presses the switch at the right end of the header, "Dark mode", on every
   respondent screen with a header, the visitors' sample and the Build preview included. The
   choice is kept in the browser (smesay-mode, the PM app's key) and applied before the first
   paint. A Playwright test turns the sample dark, reloads and turns it back.

## Out of scope
- Right-to-left languages, translations: not in R1. Auto translation is on the R3 roadmap
  (docs/plan-steps.md, Phase 6; decision 0055).

## Open questions
- None.

## Technical notes
@axe-core/playwright, checked with the research rule before adding (the result is under
Built). The theming values come from the workspace row
through the invite, never from the URL.

Built 2026-10-04 (design note 57, decision 0044):
- Research before adding @axe-core/playwright (CLAUDE.md): MPL-2.0 (`npm view
  @axe-core/playwright license`); version 4.13.0, the latest tag, published 2026-08-11
  (`npm view @axe-core/playwright time`; the 2026-09-02 first written here is the registry's
  last change, a canary on the next tag); 92 open issues on dequelabs/axe-core-npm
  (github.com/dequelabs/axe-core-npm/issues, read 2026-10-04). Added as a dev dependency.
- Acceptance 1: e2e/respondent-a11y.spec.ts runs axe (WCAG 2.0 A and AA, 2.1 AA) over About
  you, a chapter, the Wrap up and Done on the test's own project (the sample link collects
  nothing, docs/review-list.md) and finds no serious or critical violation.
- Acceptance 2: every control on the respondent side has the 2 px violet ring with 2 px
  offset on focus-visible, drawn as a ring over a hidden outline (Tailwind outline-hidden,
  which keeps an outline in forced colours: tailwindcss.com/docs/outline-style); the test
  tabs to a card's rating row, picks with an arrow key, tabs to the reason and types it.
  A screen change moves focus to the new screen's heading (built with E7-4, kept here).
- Acceptance 3: each card is a fieldset with its legend; the rating row is a radiogroup and
  the proposed pill is named "[VALUE], proposed"; the note is aria-live polite; the progress
  bar is a progressbar named "Items answered" with "[N] of [M]" (tested).
- Acceptance 4: the accent paints only the selected answer, the active chapter, the progress
  bar, the confidence picked and the header's initials; ink when it fails on white (E2-5).
  On dark it is lifted two steps, read as OKLCH lightness 0.72 with the hue kept (the design
  system's two pinned lifts, violet 600 to violet 400 and note 33's #1F4F7A to #6FA8E6,
  both land near it), and drawn with the dark ink; violet 600 and ink take violet 400, and
  so does a lift that still fails (darkAccent, src/lib/brand-rules.ts; tested in
  src/lib/brand.test.ts and in the browser at #9B86FF for violet).
- Acceptance 5: the logo at 24 px or the initials, the workspace name (E7-1); "Powered by
  SMEsay" shows while the workspace is on the Free plan (link brand's plan). The fonts are
  self-hosted at build time by next/font (src/app/layout.tsx); the test sees no request to
  fonts.googleapis.com or fonts.gstatic.com.
- Acceptance 6: under prefers-reduced-motion every transition and animation stops (the base
  layer's rule in src/app/globals.css, which covers the respondent pages); the test reads
  0s.
- Audit 2026-10-04: 1 blocking (five buttons with no focus ring: Start, Submit, the
  passcode's Continue, About you on the nothing-to-rate screen, Try again), 8 should-fix, 9
  nits. Fixed: every control on the respondent side has the 2 px violet ring with a 2 px
  offset in the colour behind it (ground, surface or sun), and hides its outline only on
  focus (focus:outline-hidden), so forced colours still shows which control has focus; the
  accent on dark follows the design system's pinned lifts (OKLCH lightness 0.72); Powered by
  on Done, the nothing-to-rate screen and the Build preview by the workspace's plan, with a
  test that it is gone on a paid plan; the research record; INTERFACES.md for the brand's
  plan and the accent helpers; the Details and comment toggles take a 48 px hit area; the
  duplicate reduced-motion rule is gone; the custom properties are --brand-accent and
  --brand-accent-dark; the stale wording; "proposed" is read once; axe also runs on About
  you in dark mode.
- Second audit 2026-10-04: 0 blocking, 3 should-fix (the toggles' hit area covered the box's
  bottom edge; three reloads in the tests were followed by typing or a click before
  hydration; axe never saw a card's details, and long details scrolled with nothing a
  keyboard could reach), 9 nits. Fixed: the box sits over the toggles' hit area; every
  reload waits for the page; the axe run imports a file with a Notes column, so every card
  has details, and details that scroll take focus as a region named "Details: [item]"; the
  item buttons' ring offset is the ground; the test names; the docs on the accent's uses,
  the dark ink and Powered by; the unknown-link page has no Powered by line; the plan rule
  is a function with a test (showsPoweredBy); the test tabs to Start and to Submit and reads
  their ring; INTERFACES.md lists the lift's helpers and constants.
- Third audit 2026-10-04: 0 blocking, 2 should-fix (a long word or link in the details
  scrolled sideways with no tab stop; the test's details overflowed by about 1 px, so the
  region was never checked), 5 nits. Fixed: long words and links wrap and the width is
  checked too; the test's details are long, with a long link, and it finds the region by its
  name, its tab stop, and no sideways scroll; the check runs again once the fonts have
  loaded and the tab stop stays while focused; the toggles' hit area is 48 px clear of the
  box (12 px above the text, 20 below); stories/E2-5 and decision 0041 name the accent's
  five uses; the copy doc has the region's name; note 57 records the region and the
  stacking; showsPoweredBy takes the plan type, with the Enterprise case tested.

Built 2026-10-05 (design note 97, acceptance 7): the switch is src/components/respondent/mode-button.tsx in
RespondentHeader, and in the SMEsay-mark header of the pages with no workspace (an unknown
link, the link's error and not-found pages, the preview's refused pages). e2e/sample-instrument.spec.ts,
"the header's switch turns the sample dark and keeps the choice": light at first, dark after a
press with smesay-mode "dark" stored, still dark after a reload, light again after a second
press. CI run 37355041221 on 797a432: 847 unit tests and 64 Playwright tests passed. The audit
of the same day found the switch's focus without a forced-colours outline (now
focus:outline-hidden, acceptance 2) and a long workspace name squeezing the close date at 390
px (the name now wraps beside a note kept to 40% of the row).
