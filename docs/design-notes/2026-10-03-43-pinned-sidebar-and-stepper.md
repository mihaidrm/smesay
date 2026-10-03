# Design note 43: the sidebar and the project header stay in view, 2026-10-03

Made in the Claude Code cloud session of 2026-10-03 from Mihai's message: "the left side
menu where we have projects, settings etc must not expand vertically with the page; if I
scroll the page down I always see that entire menu; same for the steps Import, Shape etc."

## What changed

- src/app/app/(shell)/layout.tsx: the sidebar is `position: sticky; top: 0` with the
  viewport's height, so it stays put while the content column scrolls; its bottom block
  (the sample card, the mode toggle, the email, Sign out) sits at the foot of the viewport.
  The project list is the one part that scrolls, inside the sidebar, when a workspace has
  more projects than fit; the rest of the menu never leaves the screen. Sticky, not fixed,
  so the content column keeps its own width and nothing overlaps.
- src/app/app/(shell)/projects/[projectId]/layout.tsx: the header row (breadcrumb, title,
  the stepper, Archive) is sticky at the top of the content column, on the ground with a
  hairline under it, above the page (z-index 20) so the cards slide under it. The step page
  keeps its padding.
- docs/design-system.md: the sidebar and the project header lines.

## Checks

e2e/build.spec.ts scrolls the Build page and checks the stepper and Sign out stay inside
the viewport. Screenshots of the scrolled page were sent to Mihai.
