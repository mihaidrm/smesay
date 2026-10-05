# Design note 97: the dark mode switch on the respondent side, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05, under decisions 0044 and 0056. Mihai:
"should add the dark mode toggle on the sample respondent flow from the landing page as well".

## What was decided

- The switch is on every respondent screen with a header, not only on /sample: About you, the
  chapters, the Wrap up, Done, the link pages with a workspace, and the Build preview. The
  sample is the real respondent app in its sample mode (stories/E12-4), so a switch there and
  not on a real link would show visitors something the product does not do (CLAUDE.md, "Do not
  describe a feature the product does not have"). Decision 0056 asks for every place.
- It sits at the right end of the header, after the close date or the save state. The footer
  was the other place; it was not taken because on a long chapter it is below the fold, and
  Powered by goes on a paid plan.
- A 36 px round button with the hairline-strong border on the surface, Lucide's moon on light
  and sun on dark in ink-muted, ink on hover, the violet focus ring. The tap target is 48 px,
  the respondent side's minimum (docs/design-system.md); negative margins keep the header's
  height. It is a switch named "Dark mode" (WAI-ARIA switch pattern,
  w3.org/WAI/ARIA/apg/patterns/switch/), with the name as its tooltip.
- The press is the PM sidebar toggle's: the same 1.8 s sweep (design note 35), the plain switch
  under reduced motion, and the same stored choice, localStorage "smesay-mode", applied before
  the first paint by the script in src/app/layout.tsx. Until a press the page follows the
  phone's setting, as before.
- The Build preview's frame is the same site as the PM app, so a press there also sets the PM's
  choice. The script now listens for the storage event, which fires in every other document of
  the site when the key changes (developer.mozilla.org/docs/Web/API/Window/storage_event), so
  the PM app beside the frame, and any other open tab, turns at once instead of on the next
  page.

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
