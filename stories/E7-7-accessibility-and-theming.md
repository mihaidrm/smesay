# E7-7 Accessibility: keyboard only, screen reader labels, contrast AA; the PM's brand on the page

User: an expert using a keyboard or a screen reader; a PM whose colour must not break the page
Status: ready
Outcome: the whole respondent journey works without a mouse and reads aloud correctly, every
text passes AA, and the PM's logo and accent apply within the theming rules.

## Acceptance criteria
1. A Playwright run with axe-core over About you, a chapter, the Wrap up and Done on the
   sample instrument reports zero serious or critical violations (business plan E7).
2. Keyboard: every pill, toggle, box and button is reachable in reading order; the focus ring
   is 2 px teal with 2 px offset on focus-visible (docs/design-system.md); a Playwright test
   tabs through one card and answers it with the keyboard only.
3. Screen reader: each card is a fieldset with its legend; the rating row is a radiogroup with
   the value and "proposed" in the accessible name; the note under the card is aria-live
   polite; the progress bar has role progressbar with value text (note 12, findings 35, 36).
4. Contrast: every text on the respondent side passes 4.5:1, with the accent used only where
   the design system allows (selected answer, active chapter, progress bar) and the fallback
   to ink when the PM's accent fails (E2-5). The status tints and text colours are the design
   system's.
5. Theming: the PM's logo replaces the mark in the header at 24 px, the workspace name beside
   it, "Powered by SMEsay" in the footer on the Free plan (design system, Identity). Geist is
   self-hosted; no request leaves the page to a font host (design system, Type).
6. `prefers-reduced-motion` turns off the 150 and 250 ms transitions (design system, Motion).

## Out of scope
- Right-to-left languages, translations: not in R1.

## Open questions
- None.

## Technical notes
@axe-core/playwright, checked with the research rule before adding (licence MPL 2.0 as of
the last check, unverified until the story). The theming values come from the workspace row
through the invite, never from the URL.
