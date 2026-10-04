# Design note 58: landing, the comparison with the usual ways, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 after Mihai asked: "We need to create a
section on landing page where we absolutely show all the advantages to this way compared to
other traditonal ways of doing this". Decided under decision 0044; the page, the board
(docs/design-notes/prototype-01/LandingF.dc.html) and docs/copy/landing.md changed together.

## What was decided

- One section, "Why not a spreadsheet, a form or a workshop?", between What you get back and
  Pricing, with Compare in the nav. It sits after the product fragments so the visitor has
  seen the dashboard before reading the comparison, and before the price.
- The three usual ways a PM collects expert views on a list: a spreadsheet sent by email, a
  survey form, a workshop. They are named as ways of working, not as products. A comparison
  that names a competitor has to stay objective and checkable for as long as the page is up
  (comparative advertising), and a product changes under it; a way of working does not.
  Recorded in docs/review-list.md.
- Six points, the same for every way: Setting it up, For your experts, The why behind a no,
  Who has answered, Making sense of it, What you walk out with. Six, not "all the
  advantages": each SMEsay line is a claim on R1 that the launch gate checks (decision 0042),
  and each row has to hold for all three ways. Lines that only some readers would care about
  (logo on the link, passcode, perspectives) stay in Questions and the stories.
- A switch, "What you use today", picks the way; the Today column changes, the SMEsay column
  stays. The visitor reads the comparison against what they actually do, and the section
  stays one table high instead of three. Without JavaScript the spreadsheet shows.
- Desktop: a table of three columns (the point, Today, With SMEsay) with the SMEsay column on
  the violet tint. Phone: each point stacks, the point, then Today, then With SMEsay, each
  with its small label. Under 640 px the first option reads "Spreadsheet", so the three
  options fit a 390 px phone inside the gutter.
- The Today lines describe the work a PM does, not the faults of a tool ("You copy every
  reply into one sheet before you can count anything"), and say "tend to" where it is a
  tendency (the loudest voices in a workshop).
- A closing line under the table: "It does not replace the meeting. It gives the meeting the
  answers and the open points to start from." The product makes the meeting better; it does
  not claim to remove it.
- The switch is the landing's segmented control (design note 53): violet-soft track, white
  active option, toggle buttons with aria-pressed in a group named by its visible label.

## Checks

- e2e/landing.spec.ts: the section is there with six points, the switch changes the Today
  column, no side scroll at 390.
- Lighthouse and axe on the production build: in stories/E12-1, Build record.

## Not decided

- Whether to name products (a form tool, a spreadsheet app) instead of ways of working:
  not, for the reason above; Mihai may decide otherwise with the claims checked by a lawyer.
