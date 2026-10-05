# Design note 97: the dark mode switch on the respondent side, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05, under decisions 0044 and 0056. Mihai:
"should add the dark mode toggle on the sample respondent flow from the landing page as well".

## What was decided

- The switch is on every respondent screen, not only on /sample: About you, the chapters, the
  Wrap up, Done, the link pages, the link's error and not-found pages, and the Build preview
  with its refused pages. The
  sample is the real respondent app in its sample mode (stories/E12-4), so a switch there and
  not on a real link would show visitors something the product does not do (CLAUDE.md, "Do not
  describe a feature the product does not have"). Decision 0056 asks for every place.
- It sits at the right end of the header, after the close date or the save state. The footer
  was the other place; it was not taken because on a long chapter it is below the fold, and
  Powered by goes on a paid plan.
- A 36 px round button with the hairline-strong border on the surface, Lucide's moon on light
  and sun on dark in ink-muted, ink on hover, the violet focus ring. The tap target is 48 px,
  the respondent side's minimum (docs/design-system.md); negative margins leave it 28 px in the
  row, the initials' height. Its focus keeps a transparent outline for forced colours (Tailwind
  outline-hidden), as every respondent control does (E7-7, acceptance 2). It is a switch named "Dark mode" (WAI-ARIA switch pattern,
  w3.org/WAI/ARIA/apg/patterns/switch/), with the name as its tooltip.
- The press is the PM sidebar toggle's: the same 1.8 s sweep (design note 35), the plain switch
  under reduced motion, and the same stored choice, localStorage "smesay-mode", applied before
  the first paint by the script in src/app/layout.tsx. Until a press the page follows the
  phone's setting, as before.
- The Build preview's frame is the same site as the PM app, so a press there also sets the PM's
  choice. The script now listens for the storage event, which fires in every other document of
  the site when the key changes (developer.mozilla.org/docs/Web/API/Window/storage_event), so
  the PM app beside the frame, and any other open tab, turns at once instead of on the next
  page. In the Build preview the frame is drawn at about 0.4 of its size on a desktop, so the
  switch is about 15 px there: the preview is pointed at with a mouse, and the frame runs the
  1.8 s sweep while the app beside it turns at once.

- The header at 390 px: a long workspace name wraps (breaking a word longer than its column)
  beside the close date, which takes at most 40% of the row, so the switch stays inside the
  20 px side padding (measured with "Internationalisationsabteilung" and "Marlow Consolidated
  Holdings Group of Companies").
- The mode script reads the stored choice again on every system change and on a storage event
  with this key or a null key (a cleared storage), so a choice removed in another tab hands the
  mode back to the system at once.

## Where

src/components/respondent/mode-button.tsx (new), src/components/respondent/respondent-header.tsx,
useDarkMode in src/components/app/mode-toggle.tsx (taken out of ModeToggle so both share it),
the storage listener in src/app/layout.tsx, ABOUT_YOU_COPY.darkMode. Boards: Respondent,
RespondentDesktop and RespondentV2 draw the switch in the header. The privacy policy names the
stored choice for respondents.

## Checked

Screenshots of /sample at 390 and 1440, light and dark. e2e/sample-instrument.spec.ts turns the
sample dark, reloads, finds it dark, and turns it back; respondent-a11y (axe on About you in
both modes, the keyboard path), respondent-start, sample and styleguide pass with it.
