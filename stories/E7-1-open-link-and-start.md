# E7-1 Open a link, fill the mandatory fields, start

User: an expert who got a link on their phone
Status: ready
Outcome: the link opens without an account on any current browser, About you takes the
fields the PM asked for, and Start lands on the first chapter.

## Acceptance criteria
1. /r/[token] renders the About you page (respondent board, note 12): the PM's logo and name
   in the header with the note "Closes [DATE]", the intro, the fields from the instrument
   (E5-1), the perspectives question when defined (E5-4), Start, and "Powered by SMEsay".
   Public link first visit asks the fields; a personal link shows "Welcome back, [NAME]" with
   name and role already set (E6-2).
2. Start is disabled at 40 percent with "Fill in your name and role to start." until every
   mandatory field is filled; mandatory is per field (E5-1). Dropdown fields render as a
   native select at 48 px.
3. Link states each have a page (CLAUDE.md, respondent side): not yet open, closed, revoked,
   unknown token, passcode required, passcode attempts exceeded (E11-1), all with the copy in
   docs/copy/errors.md. A closed public link shows no per-device state; a closed personal link
   shows the respondent's own state (note 12, finding 33).
4. Works without an account on iOS Safari, Android Chrome, desktop Chrome, Edge and Firefox:
   Mihai checks iOS and Android on his devices (decision 0004); Playwright runs Chromium at
   390 by 844 and 1440 by 900.
5. The desktop layout is the same flow in a 560 px column for About you, done, closed and
   inactive (docs/design-system.md, Respondent columns).
6. Playwright: open the sample link, fill name and role, start, see the first chapter.

## Out of scope
- Rating: E7-2. Autosave: E7-3. Theming details beyond logo and accent: E7-7.

## Open questions
- Partial responses and the closed page (docs/context.md, Waiting on Mihai item 1): whether
  unsubmitted answers reach the PM and how they are marked. Recommend: they reach the
  dashboard marked "In progress" with the count answered, never counted in agreement until
  submitted, and the closed public page says nothing about them. E8-2 follows the answer.

## Technical notes
The respondent app lives under src/app/r/[token]/ and never imports the PM app's session
helpers: access is by token (E1-3, out of scope note). The device token for a public link is
created on Start and stored in a cookie scoped to /r/[token] (E7-3).
