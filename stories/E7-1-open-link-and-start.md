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
2. Start is disabled at 40 percent with "Fill in your name and role to start." (or "Fill in
   the required fields to start." when the mandatory fields are not exactly Name and Role,
   decision 0043) until every mandatory field is filled; mandatory is per field (E5-1). Dropdown fields render as a
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
- None. A closed public link shows no per-device state (decision 0031); unsubmitted answers
  reach the dashboard marked as not submitted, with a PM switch to exclude them (decision
  0030).

## Technical notes
The header's logo comes from E2-5: `workspaces.publicBrand()` and the logo at
/brand/[workspaceId]/logo (24 px). The accent is `effectiveAccent()` in src/lib/brand-rules.ts
(ink under 4.5:1 on white); where it is painted is E7-2, E7-4 and E7-7.
Every workspace's sample project (E2-3) carries working invite tokens and an instrument with
fixed dates (src/db/seed/sample.ts); this story must not let those links collect answers from
outsiders: the sample instrument is treated as not published to the public (E8-8, acceptance 2).
The respondent app lives under src/app/r/[token]/ and never imports the PM app's session
helpers: access is by token (E1-3, out of scope note). The device token for a public link is
created on Start and stored in a cookie scoped to /r/[token] (E7-3).
