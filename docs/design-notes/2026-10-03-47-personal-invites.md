# Design note 47: personal invites, 2026-10-03

Made in the Claude Code cloud session of 2026-10-03 for stories/E6-2, under decision 0044.
Files: src/lib/invitees.ts and invitees-rules.ts (the send and the words), src/lib/mail/
invite-email.ts (email 2), src/lib/mail.ts (sender name and reply-to), src/db/queries/
invites.ts (the list with status), the Share page (share/invites-card.tsx,
invites-form.tsx), src/components/respondent/about-you.tsx and src/app/r/[token]/page.tsx
(the personal link's prefill), migration 0016.

## What was decided

- The Personal invites card sits under the link card on the same instrument and needs its
  public link published first: a personal link takes the public link's open and close
  instants (one project, one set of dates; E6-1 changes them on the public link only, and
  E6-3 or E6-4 may copy a change across) and has no passcode, since the address it was sent
  to is the proof. The box is off until then and the hint says why.
- The box takes addresses apart by commas, semicolons, spaces or new lines, with a name and
  a role after commas (the story's "comma, space or newline separated" plus the optional
  columns). A piece that is not an address, an address already invited, an empty box, more
  than 100 people or a name over 80 characters refuses the whole send before anything is
  created, so one bad line sends nothing and the PM fixes the list once. The refused address
  is named in the message.
- One invite row per address, oldest first in the list, with its own token from the same
  generator as the public link. The database refuses a second personal invite for the same
  address on an instrument (partial unique index), so two sends at once cannot double up.
- Rows are created first, then the emails go out one at a time: a send that fails leaves
  the row with the provider's first line in send_error and the status Not sent, the other
  invites still go, and the message under the box lists each address that was not sent. The
  PM reads the reason on the row; the respondent side never shows it.
- The email goes out as "[PM NAME] via SMEsay" on the EMAIL_FROM address with reply-to the
  PM's own address (decision 0031; docs/copy/emails.md, email 2). The PM's name is the
  session user's, or the email when the name is empty. The minutes estimate is 20 seconds
  per item rounded up to the next five minutes, at least five, shared with the reminder
  (E6-3). The intro from Build is cut to its first three lines in the email.
- The personal link's About you says "Answering as [NAME], [ROLE]" above the fields and
  does not ask the fields the invite carries (name, role); a field the invite has no value
  for is asked. The resume with "Welcome back, [NAME]" and the count answered waits for
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
