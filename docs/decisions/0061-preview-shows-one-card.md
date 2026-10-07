# 0061 The builder's preview shows one card; the full view shows everything, 2026-10-07

Mihai, 2026-10-07, two messages on the Build preview: "The preview has multiple issues: it
doesnt look like the sample, no gaps between cards, looks very weird at the top and bottom.
Rework it to be consistent with the sample we show on the landing page", then "the purpose of
the preview is for users to see the elements better. So no point in showing 10 cards if all 10
are identical. in preview we show 1 card, and maybe the top navigation etc. only things that
are important. ofc he can open full view for more info".

Decision:
- The panel on Import, Shape, Build and Share shows the compact view of the respondent app:
  the band "Preview: nothing you enter here is saved" above it (as the sample's band), the
  header, the chapter row, the first card and the line "1 of [N] cards. The full view shows
  them all." No ring, no Previous and Next, no footer, no Powered by. Desktop is a 720 px
  column at 58.3 percent, so the card reads at 420 px; a phone is 390 px at true size.
- On the Wrap up (the Closing card focused) the compact view shows the heading, the tally,
  the still-to-finish line and the Closing card's parts; the item lists, the footer and Powered
  by stay out (Mihai, 2026-10-07: "preview looks bad after the results start being
  populated", a Wrap up with 119 rows at 40 percent).
- "Full view" (was "Open full size") opens the whole app in a new tab, with the step's rings
  (E5-6 acceptance 2 holds there) at its own size.
- The rings, which drew a violet line around every card and the chapter row (the "no gaps"
  and the odd top and bottom), stay out of the panel.

Why: a PM reads one card to judge the wording, the rating row and the fields; ten identical
cards at 40 percent show less than one at 58. The sample on the landing page has no rings and
its band on top; the panel now matches it.

Consequences: src/components/app/preview-frame.tsx, src/app/r/[token]/preview-route.tsx,
src/app/r/[token]/respondent-app.tsx, src/components/respondent/chapter-screen.tsx,
src/components/app/sample-band.tsx (testId), src/lib/build-copy.ts; stories/E5-6; docs/copy/
app.md; e2e/preview.spec.ts; design note 108.
