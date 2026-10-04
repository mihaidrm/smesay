# E6-1 Publish with a public link, open and close dates, optional passcode

User: a PM ready to send the list out
Status: built
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
5. Publishing freezes the method, the proposal switch and the labels (E5-2), the perspective
   names and tags (E5-4) and the closing question (E5-5), and records published_at; the layout
   (E5-3), the missing-item switch and the sign-off text still change. The freeze holds
   against a save in flight: publishing takes the instrument row lock and the four saves
   check inside it (a unit test publishes while a save waits on the lock and proves the save
   is refused). Dates can be changed after publishing; the respondent header note updates.
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

Owed from E5-4 and E5-5 (recorded 2026-10-03, done the same day): publishing takes the
instrument row's lock (invites.publish), and the four saves that lock on publish
(saveScoring, savePerspectives, tagItem, saveClosing) check inside a transaction that
locks the row (instruments.updateLocked, setPerspectives, tagItem); docs/review-list.md.

Built 2026-10-03 (design note 46, decision 0044):
- Acceptance 1: the Share page (share/page.tsx) with the link card: the state pill, the
  note, the link with Copy link, Opens and Closes as date-times in the browser's zone
  (named under them), the passcode, Publish then Save (share-form.tsx).
- Acceptance 2: the token is crypto.randomBytes(16) as 32 hex characters
  (src/lib/sharing.ts newToken); /r/[token] (src/app/r/[token]/page.tsx); an unknown token
  gets its page.
- Acceptance 3: not yet open and closed pages with the instants in UTC
  (src/components/respondent/link-page.tsx); the revoked page is drawn too, for E6-4.
- Acceptance 4: parseLinkInput refuses a close date before the open date, a missing one, a
  close date in the past on Publish and a short passcode; the passcode is a salted scrypt
  hash with its parameters (src/lib/passcode.ts, docs/review-list.md), checked on the
  passcode page of an open link and remembered by a cookie scoped to the link's path
  (src/lib/link-access.ts); wrong attempts are limited in the process, 60 per link and 5
  per link and address in 15 minutes, counted when a post starts and given back on a right
  passcode; E11-1 kept that as it is.
- Acceptance 5: publish and the four saves share the instrument row's lock; the test in
  src/lib/instruments.test.ts holds the lock, starts three saves, publishes, and sees the
  scoring save narrowed to the layout and the perspectives and closing saves refused.
  Publishing records instrument.published_at (migration 0015). Dates change after
  publishing, also after "Build on version N" (the link in force stays on the published
  instrument; publishing the newer draft replaces it, docs/review-list.md); the respondent
  header says "Closes [DATE] UTC"; the stepper shows Share as the current step (from E8-1: Results, with Share done).
- Acceptance 6: e2e/share.spec.ts publishes with a passcode, opens the link in a fresh
  context, is refused with a wrong passcode and let in with the right one, sees About you,
  moves the close date into the past and sees the closed page; the Import banner owed from
  E3-6 is asserted too.
