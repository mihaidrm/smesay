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
  that names a competitor has to stay objective and checkable for as long as the page is up,
  and a product changes under it; a way of working does not. The rule meant is the EU's on
  comparative advertising (Directive 2006/114/EC, Article 4); its text could not be read from
  the session, so the reference is unverified. Whether naming ways instead of products takes
  the section outside that rule is also unverified. Who checks it is open: E11-3's lawyer
  reads the four legal pages only, and adding this section to that review is a spend for
  Mihai to decide (docs/review-list.md).
- Six points, the same for every way: Setting it up, For your experts, The reasons, Who has
  answered, Reading the answers, The result (labels of two or three words, WRITING.md). Six,
  not "all the
  advantages": each SMEsay line is a claim on R1 that the launch gate checks (decision 0042),
  and each row has to hold for all three ways. Points only some readers would care about
  (the logo on the link, the passcode, perspectives) are left out; the logo is in Questions,
  the others are in the product and the stories.
- A switch, "What you use today", picks the way; the Today column changes, the SMEsay column
  stays. The visitor reads the comparison against what they actually do, and the section
  stays one table high instead of three. Without JavaScript the spreadsheet shows.
- From 1024 px: a table of three columns (the point, Today, With SMEsay) with the SMEsay
  column on the violet tint. Under 1024 px (one column, as the rest of the page): each point
  stacks, the point, then "Today, with a [way]", then With SMEsay, each with its small
  label. Under 640 px the first option reads "Spreadsheet", so the three
  options fit a 390 px phone inside the gutter.
- The Today lines describe the work a PM does, not the faults of a tool ("You copy every
  reply into one sheet before you can count anything"), and say "tend to" where it is a
  tendency (the loudest voices in a workshop, quiet experts saying less). After the audits
  the survey form lines concede what a form has too (a link, usually no account) and make no
  claim about what most form tools do: the PM rewrites the wording, who has answered is
  known only when the form asks for a name or the tool sends the invitations, and a reason
  needs a follow-up question. The difference left is that a form has no proposal to agree
  with and no reasons tied to it.
- Every SMEsay line carries its condition where it has one: the wording is the one the PM
  chose (E4-3: the respondent sees a rewrite only where the PM accepted it); stopping and
  carrying on works on the same device, or anywhere with a personal link (E7-3); the reason
  is asked when the PM shows the proposal; reminders are for personal links, at most once
  every three days; the group split needs role or department asked as a list to pick from,
  and compares a group only once 3 or more in it have answered the item (E8-6) (docs/copy/landing.md,
  claims).
- A closing line under the table: "It does not replace the meeting where you decide. It
  gives that meeting the answers and the open points to start from." The workshop the title
  names is the one that gathers views; the meeting that decides stays.
- The board (LandingF.dc.html) draws the spreadsheet state; the survey form and workshop
  lines are in docs/copy/landing.md and the component. The board's frame is 4,931 px high,
  measured in Chromium with every section at its natural height; the How it works section
  had lost its closing tag, so the sections after it sat inside it, and the 2,660 px frame
  had squeezed the hero to nothing. Both fixed with this section. The phone layout is in
  code only, like the rest of page F (docs/review-list.md).
- The switch is the landing's segmented control (design note 53): violet-soft track, white
  active option, toggle buttons with aria-pressed in a group named by its visible label.

## Checks

- e2e/landing.spec.ts: the section is there with six points, the switch changes the Today
  column and leaves the SMEsay column with its six lines, one column at 1023 px and three at
  1024, no side scroll at 390.
- Lighthouse and axe on the production build: in stories/E12-1, Build record.

## Not decided

- Whether to name products (a form tool, a spreadsheet app) instead of ways of working:
  not, for the reason above; Mihai may decide otherwise with the claims checked by a lawyer.
