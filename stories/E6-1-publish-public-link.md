# E6-1 Publish with a public link, open and close dates, optional passcode

User: a PM ready to send the list out
Status: ready
Outcome: one link anyone can open between the dates, with an optional passcode; a closed
instrument shows a closed page, not an error.

## Acceptance criteria
1. Share (PM app board): the link card with the state pill Draft, Published or Revoked and
   its note ("Not published yet. Nobody can open the link." / "Anyone with the link can respond
   until the close date." / revoked, E6-4); open and close date-times with the workspace's time
   zone shown; a passcode field; Publish, then Copy link.
2. The token is 128-bit random from crypto.randomBytes(16) as hex (32 characters, E1-2 check);
   the link is /r/[token]. A URL with an unknown token shows "This link does not match any
   project. Check that you copied the whole link, or ask the person who sent it for a new
   one." (docs/copy/errors.md).
3. Before the open date the link shows "This link opens on [OPEN DATE AND TIME]. Come back
   then; nothing to do now." After the close date it shows the closed page from the
   respondent board ("Link closed. The project team at [WORKSPACE] stopped collecting answers
   for [PROJECT] on [DATE]. Nothing you sent is lost. ..."). Both return a page, not data
   (SECURITY.md).
4. A close date before the open date or in the past: "The close date is before the open date.
   Pick a later close date." A passcode under 6 characters: "Use at least 6 characters.
   Respondents type it once per device." The passcode is stored hashed (argon2 or bcrypt,
   chosen with the research check) and a wrong one shows "That passcode is not right. Ask the
   person who sent you the link."; attempts are limited in E11-1.
5. Publishing freezes method and layout (E5-2) and records published_at. Dates can be changed
   after publishing; the respondent header note updates.
6. Playwright: publish, open the link in a fresh context, see About you; set the close date
   to the past, reload, see the closed page.

## Out of scope
- Personal invites: E6-2. Reminders: E6-3. Revoking: E6-4.

## Open questions
- None.

## Technical notes
invite rows of kind public (docs/schema.md: token, opens_at, closes_at, passcode_hash). One
public invite per instrument in R1; publishing creates it. The passcode is remembered per
device by a cookie scoped to the token path.

Owed from E3-6 (recorded 2026-10-02): the Import banner "This list is published. Importing a
new version does not change the published instrument..." (docs/copy/errors.md) once an
instrument can be published.

Owed from E5-4 and E5-5 (recorded 2026-10-03): publishing takes the instrument row's lock
(the one instruments.setPerspectives and instruments.tagItem take), and the four saves
that lock on publish (saveScoring, savePerspectives, tagItem, saveClosing) move their
published check inside a transaction that locks the row, re-reads the invites and writes;
today the check runs outside any lock, so a change that passed it before the publish would
still land; docs/review-list.md.
