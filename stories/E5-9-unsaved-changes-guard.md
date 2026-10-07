# E5-9 Unsaved changes guard on the setup steps

User: a PM setting up a validation on Import, Shape, Build and Share
Status: built 2026-10-07
Outcome: a PM cannot leave a setup step by mistake while a card holds changes that were not
saved; the page says which cards, and offers to discard them.

Mihai, 2026-10-07: "on each page when setting up an event - we must not allow to navigate away
from that page, if you have any unsaved changes on that page (in any section) we shake the
screen or notify the user, and we put in red text what is not saved, and we show a message
that he needs to save or discard changes".

## Acceptance criteria
1. Every form with its own Save (or Send, or Use this list) on Import, Build and Share
   registers itself with the project frame under its card's title and says whether it holds
   unsaved changes: About this project and The list (the paste box) on Import; Intro,
   Scoring, Perspectives, Closing and Respondent fields on Build; Public link (the draft card
   too, when there is one) and Personal invites on Share. A change makes the form unsaved; a
   save that went through, a Discard, or leaving the step clears it. A save on its way and a
   save the server refused count as unsaved. Shape's controls save at once, so Shape registers
   nothing.
2. While any registered form is unsaved, a click on a stepper pill, on Projects, Settings or
   Help in the sidebar, on a project in the sidebar's list or on Open the sample does not
   leave the page. Instead each unsaved card gets a 2 px danger border and the red label
   "Not saved" beside its title, the unsaved cards shake once (4 px side to side over 400 ms,
   nothing under prefers-reduced-motion), and a banner under the project header reads "Save
   or discard your changes before you leave: [the card titles]." with a Discard button
   beside it. A second click shakes them again.
3. Discard puts every unsaved form back to its saved values and clears the banner, the
   borders and the labels. A save that went through does the same for its own form. The
   next click on a pill or a sidebar link then goes through.
4. Closing the tab, reloading or typing another address while a form is unsaved shows the
   browser's own leave dialog (a beforeunload listener; the browser's words). Nothing of this
   happens on Results, Projects or Settings, and nothing while no form is unsaved.
5. A unit test covers the registry (register, clear, forget, the blocked click, the banner
   line) and one Playwright test covers the main path: type in the Intro on Build, click the
   Share pill, stay on Build with the banner and the label, Discard, type again, Save, click
   Share, reach Share.

## Out of scope
- The browser's Back button inside the app (a client-side navigation Next does not let a
  page cancel; the beforeunload dialog covers a reload or a typed address).
- Shape's reader and tag controls, which save on each press (E4-3, E4-4).
- Column mapping on Import, which saves on each change (E3-3).
- Autosaving the setup forms instead of asking: Mihai asked for the guard.

## Open questions
- None.

## Technical notes
The registry is pure (src/lib/unsaved.ts: a reducer over the registered forms and the count
of blocked clicks; the blocked count returns to 0 the moment no form is unsaved). The React
side (src/components/app/unsaved.tsx) provides it from the signed-in shell's layout, since
the sidebar links live outside the project frame: useUnsavedForm for a form, useUnsavedGuard
for a link's onClick (Next's Link runs onClick first and stops when the event's default is
prevented: node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md,
`onNavigate`; node_modules/next/dist/client/app-dir/link.js), UnsavedMark beside a card's
title, UnsavedBanner under the project header, GuardedLink for the sidebar's plain links.
Discard remounts the form with the server's values through a changed key
(react.dev/learn/preserving-and-resetting-state, "Resetting a form with a key"). The card's
border comes from `.card:has([data-unsaved])` (developer.mozilla.org/docs/Web/CSS/:has) and
the shake from a class the form puts back on its card after each blocked click
(developer.mozilla.org/docs/Web/CSS/CSS_animations/Tips, "Run an animation again"). The
leave dialog: developer.mozilla.org/docs/Web/API/Window/beforeunload_event (preventDefault,
with returnValue for older browsers). Playwright accepts a beforeunload dialog nobody listens
to (packages/playwright-core/src/server/dialog.ts, `_close`), so a test that leaves a dirty
form through page.goto still goes through.

Built 2026-10-07 (design note 112):
- Acceptance 1: useUnsavedForm in the nine forms (import/context-form.tsx, import/paste-form.tsx,
  build/intro-form.tsx, build/scoring-form.tsx, build/perspectives-form.tsx,
  build/closing-form.tsx, build/fields-form.tsx, share/share-form.tsx, share/invites-form.tsx);
  isUnsaved in src/lib/unsaved.ts says what counts.
- Acceptance 2: the guard on the stepper (src/components/app/stepper.tsx, project-stepper.tsx),
  NavLink and GuardedLink in the shell's layout; the border and the shake in
  src/app/globals.css; UnsavedMark beside the eleven card titles; UnsavedBanner in the
  project layout.
- Acceptance 3: Discard in UnsavedBanner calls each unsaved form's reset, which remounts it.
- Acceptance 4: the beforeunload listener in UnsavedProvider, only while a form is unsaved.
- Acceptance 5: src/lib/unsaved.test.ts (8 tests); e2e/unsaved-guard.spec.ts.
