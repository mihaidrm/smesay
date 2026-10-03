# Design note 38: Build, the intro and the respondent fields, 2026-10-03

Made in the Claude Code cloud session of 2026-10-03 for stories/E5-1, on design v2 (decision
0041). Files: src/app/app/(shell)/projects/[projectId]/build/ (page, intro-form, fields-form,
build-on), src/components/respondent/about-you.tsx, src/lib/instruments.ts,
src/lib/respondent-fields.ts, src/lib/build-copy.ts. Screenshots in the pull request.

## What was decided

- The draft is created on the first open of Build (acceptance 1 says Build "opens" a draft),
  one per project, on the latest set, titled after the project. A render that writes a row is
  unusual; the alternative (a "Start building" button) adds a click the story does not ask
  for. The write is idempotent: a second open finds the draft.
- Role defaults to a text field, not the board's dropdown with four options. Nothing in the
  app knows the PM's roles; the sample keeps its five. The PM turns Role into a dropdown by
  picking the type and typing the options.
- "Build on version N" (owed from E3-6) copies the whole draft (title, intro, fields, method,
  layout, closing) onto the new set and leaves the old instrument on its version. The old one
  is reachable only through its responses on Results (E8); Build always shows the newest.
- Limits the story does not name: the title is 1 to 80 characters (the project name's rule,
  src/lib/workspace-name.ts), the intro up to 1,000 (the reader-version cap of E4-3, read on a
  phone), an option up to 60 (the label's rule). Each has a row in docs/copy/errors.md.
- The fields card edits in place (a row per field with Label, Type, Required, Remove, and
  the options box under a dropdown row) instead of the board's read-only list; the sample
  shows the list. The Required switch is the design system's 44 by 24 toggle, the same
  markup as the mode toggle without its view transition names.
- The preview panel is the shell of design note 13 (460 px, "Preview", the caption with a
  violet square, the 390 px phone frame with a violet ring) holding the About you page as a
  React component, not the iframe of E5-6. The Desktop toggle and "Open full size" come with
  E5-6, when the respondent app exists to open. The preview re-renders from the saved draft
  after each Save (the line under the title says so), not as the PM types.
- The About you page is one component (src/components/respondent/about-you.tsx) for the
  preview now and /r/[token] in E7-1, so the two cannot drift (E5-6, acceptance 3). It
  renders with the app's tokens, so the preview follows the PM's mode; the PM's accent is on
  the initials tile only, where effectiveAccent() guarantees white reads on it.
- The Shape board (v2) has a "Continue to Build" button; the stepper pill is the way to Build
  until the Share page exists and the Continue buttons are placed on every step together.

## Questions for Mihai

1. The hint under Start reads "Fill in your name and role to start." as the respondent board
   wrote it, whatever the fields are called. A PM who renames the fields, or adds a required
   Team, gets a hint that names the wrong fields. The option: "Fill in the required fields to
   start." when the required fields are not exactly Name and Role. Recommended.
2. Role as text by default (above). The alternative is the board's dropdown with placeholder
   options, which a PM would have to replace before publishing.

## Checks

- Unit: src/lib/respondent-fields.test.ts (6 tests), src/lib/instruments.test.ts (4 tests on
  the test database, one of them the cross-workspace refusal).
- Playwright: e2e/build.spec.ts (1 test, the main path of acceptance 5 plus the empty state,
  the disabled Start and the refused Remove).
