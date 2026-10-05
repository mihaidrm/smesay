# Design note 94: the question bubble, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E12-5, under decisions 0044
and 0049.

## What was decided

- A violet round button (56 px, the brand violet #6D4CF5, white speech-bubble icon from
  Lucide) at the bottom right of the landing page. It is the one new component; it is not in
  docs/design-system.md because it lives only on the landing page, whose colours are written
  out (decision 0041).
- The panel is white with the hairline border and a 20 px radius, as the app's cards. On a
  phone it is a sheet across the full width at the bottom; from 768 px it is a 360 px card
  above the button. The title, the one-line promise, two fields, the privacy line and a full
  width Send in the landing's primary button style.
- The button turns into a close icon while the panel is open. On a phone the sheet covers the
  button, and the panel's own Close button closes it.
- Sent replaces the form with a green line naming the address; the next opening starts a new
  question. Errors show in red under the fields, named by the field they concern.

## Why the footer is taller on a phone

The bubble sits over the page's bottom right corner. On a 390 px screen the footer's last line
(the legal links and the address) ran under it, so the footer keeps 96 px below its content
under 768 px. The Playwright test checks every link and button against the bubble at the top
and the bottom of the page.

## Why a second limit

The story limits each visitor address to 5 questions an hour. A visitor who types a new
address each time would not be stopped by that, so one connection (the last X-Forwarded-For
address, as every limit in the app reads it) is also limited to 20 an hour.

## Checked

- e2e/question-bubble.spec.ts at 390 by 844 and 1440 by 900: 2 of 2 passed.
- Screenshots of the open panel at both sizes looked at in the session.
