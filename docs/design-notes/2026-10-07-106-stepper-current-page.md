# 106 The stepper fills the open page, 2026-10-07

Mihai, 2026-10-07, with a screenshot of the stepper on a built project (Import ticked, Shape
ticked, Build filled, Share 4, Results 5): "if i click to move through these, nothing changes
visually i dont know which one i am on currently".

Why it did not change: design note 19 made the filled pill the furthest step the project's
data has reached (Import until a set exists, Shape from the import, Build from the draft,
Results from the published link), and the open page won only when it was further. On a built
project every click left Build filled; on a published one, Results.

Decided:
- The filled pill is the page that is open. The furthest step stands in only when the open
  segment is not a step page. aria-current="step" stays on the filled pill.
- The ticks follow the data, not the filled pill: every step before the furthest one, plus
  the layout's done list (Share once published). Clicking back to Import on a published
  project shows Import filled and Shape, Build and Share ticked, Results numbered. One
  exception stays from the old rule: Build creates its draft while the page renders, so on
  that first open the layout's data is one step behind and Shape is ticked from the open page.
- The filled pill carries a 2 px violet ring with a 2 px surface offset, the ring every pill
  already shows on focus (the same tokens: ring-violet, ring-offset-surface), so the current
  step reads at a glance in light and dark and without colour. Nothing else in the design
  changes. The ring and its offset take 4 px, the track's padding, so the pill stays inside
  the track's hairline.
- Stepper (src/components/app/stepper.tsx) takes `reached` for the ticks and `current` for
  the filled pill; project-stepper.tsx computes both.

Ring utilities: tailwindcss.com/docs/box-shadow ("ring-<number>", "ring-offset-<number>",
"ring-offset-<color>"), the classes the focus state used already.

Tests: e2e/import.spec.ts (Import filled right after the import, Shape a link),
e2e/build.spec.ts (Share filled while Share is open, Build again on the way back),
e2e/share.spec.ts (Share filled after Publish, Results a link), e2e/results.spec.ts (Results
filled on the sample's Results page, unchanged).
