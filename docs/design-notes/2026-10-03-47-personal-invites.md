# Design note 47: personal invites, 2026-10-03

Made in the Claude Code cloud session of 2026-10-03 for stories/E6-2, under decision 0044.
Files: src/lib/invitees.ts and invitees-rules.ts (the send and the words), src/lib/mail/
invite-email.ts (email 2), src/lib/mail.ts (sender name and reply-to), src/db/queries/
invites.ts (the list with status), the Share page (share/invites-card.tsx,
invites-form.tsx), src/components/respondent/about-you.tsx and src/app/r/[token]/page.tsx
(the personal link's prefill), migration 0016.

## What was decided

- The Personal invites card sits under the link card on the same instrument and needs its
  public link published and not closed or revoked: a personal link takes the public link's
  open and close instants and follows them (a date change on Share reaches the personal
  links; publishing a newer version closes the older version's personal links with its
  public one) and has no passcode, since the address it was sent to is the proof. The box
  is off otherwise and the hint says why.
- The box takes addresses apart by commas, semicolons, spaces or new lines, with a name and
  a role after commas (the story's "comma, space or newline separated" plus the optional
  columns). A piece that is not an address, an address already invited, an empty box, more
  than 100 people or a name over 80 characters refuses the whole send before anything is
  created, so one bad line sends nothing and the PM fixes the list once. The refused address
  is named in the message.
- One invite row per address, oldest first in the list (one send's rows share an instant
  and come by address), with its own token from the same generator as the public link. The database refuses a second personal invite for the same
  address on an instrument (partial unique index), so two sends at once cannot double up.
- Rows are created first, then the emails go out one at a time: a send that fails leaves
  the row with the provider's first line in send_error (anything shaped like a connection
  string cut) and the status Not sent, the other invites still go, and the message under
  the box lists each address that was not sent while the box keeps those addresses, so
  Send tries them again on the same row and token. A row with no sent_at reads Not sent
  whatever send_error holds; one with no outcome at all is another request's for 15
  minutes from its last send start (invite.send_started_at; the message names the wait),
  then it can be sent again (a request that died mid-way). The claim is one update
  statement that moves send_started_at, so two sends cannot both take a row. The new rows
  go in first, with one insert under the instrument row's lock then the project row's (the
  order publish takes, so the two cannot deadlock; both FOR NO KEY UPDATE, so a
  respondent's save is not held up), the public link checked inside them
  (the project's link in force, not revoked, not closed) and its dates read there, ON
  CONFLICT DO NOTHING on the partial unique index; a refusal there happens before any row
  is claimed for sending again. The outcomes come back in the order pasted. The PM reads the reason on the row; the respondent side never shows it. A missing
  mail variable is the app's fault, not the address's: it is thrown and named, not stored.
- Up to 500 personal invites per workspace in 24 hours, counted on rows created, since the
  PM names the sender and three lines of the body (SECURITY.md); the refusal says how many
  can still go today.
- Email 2 names the open date when the link opens after the send, so an early click on the
  not-yet-open page is no surprise.
- The email goes out as "[PM NAME] via SMEsay" on the EMAIL_FROM address with reply-to the
  PM's own address (decision 0031; docs/copy/emails.md, email 2). The PM's name is the
  session user's, or the email when the name is empty. The minutes estimate is 20 seconds
  per item rounded up to the next five minutes, at least five, shared with the reminder
  (E6-3). The intro from Build is cut to its first three lines in the email.
- The personal link's About you says "Answering as [NAME], [ROLE]" above the fields and
  does not ask the fields the invite carries (name, role) when the instrument has them; a
  dropdown is prefilled only with one of its options; a field the invite has no value for,
  or that the PM did not configure, is asked or not stored. The resume with "Welcome back, [NAME]" and the count answered waits for
  answers to exist (E7-2, E7-3).
- Status in the list reads from the response row joined on the invite: none means Invited
  (or Not sent), a row without submitted_at means In progress, with it Submitted; the last
  save or submit is shown under the pill. Reminders show "None sent" until E6-3.
- The sample's personal invites show in the list read-only and are marked sent at the
  sample link's opening.

## What was not decided

- Importing invitees from a file (out of scope in R1).
- A PM contact line on the closed page for a personal invite (docs/copy/errors.md names
  one): the sender is not stored on the invite yet; docs/review-list.md.
