# Design note 57: accessibility and theming on the respondent side, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E7-7, under decision 0044.

## What was decided

- Focus: a screen change moves focus to the new screen's heading (tabIndex -1), including a hidden heading
  on the single long page (built with E7-4 after its audit, design note 54; kept here).
- Names: the proposed pill reads "[VALUE], proposed"; the captions "no fit" and "fits
  fully" stay as descriptions.
- The accent on dark: lifted two steps, with the dark ink on it. The design system pins two
  lifts (violet 600 #6D4CF5 to violet 400 #9B86FF; note 33's #1F4F7A to #6FA8E6), and both
  land near OKLCH lightness 0.7, so the rule raises the accent to OKLCH lightness 0.72 with
  its hue and as much chroma as sRGB holds: #1F4F7A gives #78A9DA. Violet 600 and ink are
  SMEsay's own colours and take violet 400; a lift that still reads under 4.5:1 against the
  dark surface or the dark ink takes violet 400 too. The audit found the first rule, 30
  points of HSL lightness, far from both pinned lifts (violet came out #D8CFFC). Two values
  travel as CSS custom properties (--brand-accent, --brand-accent-dark; --accent is the UI
  kit's own) on the selected pill, the active chapter pill, the progress bar, the confidence
  pill and the header's initials.
- "Powered by SMEsay" is one component, shown while the workspace is on the Free plan (the
  link carries the plan with the brand).
- Reduced motion stops every transition and animation: the base layer's rule in
  src/app/globals.css covers every page, the respondent side's included (a second rule
  scoped to the respondent root was dropped after the audit as a duplicate).
- axe-core through @axe-core/playwright (MPL-2.0, 4.13.0) checks the four screens at 390 px,
  and About you again in dark mode.
- Focus: every respondent control shows the 2 px violet ring with a 2 px offset in the colour
  behind it, and hides the browser outline only while focused (focus:outline-hidden,
  tailwindcss.com/docs/outline-style), so forced colours, which drop the ring (a box shadow),
  still outline the focused control.
- Details on a card: when they are longer than their slot they scroll, and the slot becomes a
  region named "Details: [ITEM]" with a tab stop, so a keyboard can scroll it (axe,
  scrollable-region-focusable). The check runs on every size change and once the fonts have
  loaded, and the tab stop stays while the region has focus. Long words and links wrap
  (overflow-wrap: anywhere), so the details never scroll sideways.
- The Details and comment toggles keep their text size with a 48 px tall hit area (12 px
  above the text, 20 px below). The slot above them sits on top (relative z-10), so a tap on
  its edge stays the slot's.

## Checks

- src/lib/brand.test.ts: the lift and the fallback.
- e2e/respondent-a11y.spec.ts: axe on four screens, keyboard answer, names, no font host,
  reduced motion, the dark accent, and long details that scroll as a named region with a tab
  stop and never sideways.
