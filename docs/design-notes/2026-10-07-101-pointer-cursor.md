# 101 The hand cursor on every control, 2026-10-07

Mihai, 2026-10-07: "all over the app, when hovering over an item that the user can interact
with, we need to show the hover cursor (little hand)".

Why it was missing: Tailwind v4's preflight changed buttons to the browser default. The upgrade
guide says "Buttons now use cursor: default instead of cursor: pointer to match the default
browser behavior" and gives a base rule to restore it (tailwindcss.com/docs/upgrade-guide,
"Buttons use the default cursor"). Until today only six places set the hand by hand (the
scoring labels, two summaries, the landing FAQ).

Decided:
- One base rule in src/app/globals.css gives the hand to every control a click acts on: buttons,
  elements with the button, switch, radio, tab, option and menuitem roles, summaries, selects and
  their options, the file picker button, checkbox, radio, range, file, submit, button and reset
  inputs, and a label that wraps a checkbox or radio. A disabled control keeps the arrow (the
  buttons also turn pointer events off when disabled, so the parent's arrow shows). Text fields
  keep the I-beam.
- The shadcn select's items (the workspace switcher) used cursor-default on purpose in the kit;
  changed to the hand to match.
- The rule is in docs/design-system.md, Components. Checked everywhere per decision 0056: the PM
  side, the respondent side, the landing page, the admin pages and the emails (no cursor in
  email) all go through the same base layer.

Test: e2e/cursor.spec.ts reads the computed cursor on the landing page (a button, a summary,
a link) and on /sample (a rating pill, the role select, the dark mode switch, a text field, the
disabled Start button).
