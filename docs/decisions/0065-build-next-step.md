# 0065 The next-step panel shows on Build too, 2026-10-12

Mihai, 2026-10-12: "the Build Step doesnt have a next step button popping up when everthing
is filled in". Design note 121 (2026-10-08) had limited the panel to Import and Shape, a
choice Claude took under decision 0044 (docs/review-list.md, the row of 2026-10-08: "Build
and Share end in their own actions"). Mihai overturns it for Build.

Decision:
- Build gets the next-step panel under its title: "The validation is built.", a line on what
  comes next, and Continue to Share the link.
- Build counts as filled in once an intro is saved: every other card has a default (MoSCoW
  with the proposal shown, chapters, no perspectives, the default Closing card, Name and
  Role), and Intro is the one card that opens while it is empty (design note 122). The rule is
  Claude's reading of "everything is filled in", recorded in the review list.
- Share keeps its own ending, Publish (decision 0021).

Consequences: src/lib/build-guide.ts (buildDone), src/lib/build-copy.ts, the Build page,
e2e/build.spec.ts, docs/copy/app.md, docs/design-system.md, stories/E5-1, design note 127,
the review list.
