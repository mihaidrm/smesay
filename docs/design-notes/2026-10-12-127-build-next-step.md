# 127 The next-step panel on Build, 2026-10-12

Mihai, 2026-10-12: "the Build Step doesnt have a next step button popping up when everthing
is filled in". Import and Shape end in the next-step panel (design note 121); Build ended in
five closed cards and the stepper, and nothing said "done, now go to Share".

Decided (decision 0065):
- With an intro saved, the panel sits under Build's title and line, above the step tip and
  the cards, as on Import: the tick, "The validation is built.", "Change any card below if you
  want to, then share the link your respondents open." and Continue to Share the link.
- Build is filled in once an intro is saved (src/lib/build-guide.ts buildDone): every other
  card has a default, and Intro is the one card that opens while it is empty. Not on the
  sample, which cannot be edited. The panel stays as long as the intro is there, as the other
  two panels stay (design note 121).

Rejected:
- The panel as soon as the draft exists: the draft is created on the first open, so the panel
  would point past Build before the PM has looked at a card.
- A save on every card: the app does not record which cards were saved, and the defaults are
  complete; a PM who keeps MoSCoW and Name and Role has nothing to save there.

Tests: src/lib/build-guide.test.ts (buildDone, 2 cases); e2e/build.spec.ts reads no panel
before the intro's save and the panel with its link to Share after. Copy in
docs/copy/app.md, Build; the component entry in docs/design-system.md.
