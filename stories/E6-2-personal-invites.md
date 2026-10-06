# E6-2 Personal invites: paste emails, send from the platform, one link per person

User: a PM who needs named answers from specific people
Status: built
Outcome: each person gets their own link by email; the link resumes their response on any
device and records answers under their name.

Amended 2026-10-06 (E5-7, design note 100): under Anonymous the card holds "Anonymous
validations use the public link only." in place of the form and the list, and the server
refuses a send, a New link or (amended again after the audit) a reminder to the validation. Under Names hidden the card's line says
Results show the answers without names; the invite email drops "recorded under your name" and
says what About you says; the invite carries no name or role into the response.

## Acceptance criteria
1. Share, Personal invites (PM app board): a box that takes one or more emails (comma, space
   or newline separated), optional name and role per row, Send. "[TEXT] is not an email
   address. Check it and try again." per bad row; "[EMAIL] already has a personal link. Press
   Remind to send it again." for a repeat.
2. Each row creates an invite of kind personal with its own 32-character token and sends
   email 2 from docs/copy/emails.md (item count, minutes estimate at 20 seconds per item
   rounded up to 5, intro from Build, close date with time zone). Locally the email lands in
   Mailpit.
3. Opening a personal link skips the fields the PM already filled (name, role) and shows
   "Welcome back, [NAME]" with the count answered when there are answers (respondent board,
   note 11). The response is keyed by the invite, so a second device continues the same
   response.
4. The invite list shows name, role, status (Invited, In progress, Submitted), reminders sent
   and last date (E6-3), with Remind and Revoke per row.
5. A send failure shows "The invite to [EMAIL] was not sent: [PROVIDER REASON]. Check the
   address and try again." and the row stays with status "Not sent".
6. Playwright: add two emails, see two emails in Mailpit, open one link, see the welcome.

## Out of scope
- Importing invitees from a file: not in R1.

## Open questions
- None. Reply-to is the PM's own address and the sender name is the PM's (decision 0031).

## Technical notes
invite.email, name, role_hint (docs/schema.md); the response for a personal invite is created
on first open with fields pre-filled from the invite. The "minutes" estimate is one function
shared with the reminder and the landing copy.

Built 2026-10-03 (design note 47, decision 0044):
- Acceptance 1: the Personal invites card on Share (share/invites-card.tsx, invites-form.tsx)
  under the link card, on the same instrument; the box takes addresses apart by commas,
  semicolons, spaces or new lines, with a name and a role after commas
  (src/lib/invitees-rules.ts parseInvitees); a piece that is not an address, or an address
  already invited, refuses the whole send with the words from docs/copy/errors.md, so one bad
  line sends nothing (docs/review-list.md). The box is off until the public link is
  published: the personal links take its open and close instants.
- Acceptance 2: one invite row of kind personal per address with its own 32-hex token
  (src/lib/sharing.ts newToken), no passcode, and email 2 (src/lib/mail/templates/invite.ts)
  sent as "[PM NAME] via SMEsay" with reply-to the PM's address (src/lib/mail.ts fromName,
  replyTo); the minutes are 20 seconds per item rounded up to five (minutesFor); the intro's
  first three lines; the close instant in UTC. Locally the email lands in Mailpit.
- Acceptance 3: a personal link's About you says "Answering as [NAME], [ROLE]" and does not
  ask the fields the invite carries (src/components/respondent/about-you.tsx prefilled;
  src/app/r/[token]/page.tsx). "Welcome back, [NAME]" with the count answered needs answers,
  which E7-2 and E7-3 create and resume; the response keyed by the invite is E7-1's
  (docs/review-list.md).
- Acceptance 4: the list with Person, Status (Invited, In progress, Submitted from the
  response row; Not sent when the email failed) with the last save or submit, and Reminders
  (None sent, or "[N] sent, last [DATE]"); Remind and Revoke per row came with E6-3 and E6-4.
- Acceptance 5: a send that fails stores the provider's first line in invite.send_error
  (migration 0016), the row shows Not sent with the reason, the message lists the address
  under "[N] invites sent.", the box keeps that address so Send tries it again on the same
  row and token, and the other invites still go (src/lib/invitees.test.ts fails one of two
  through a stand-in transport, sends the failed one again, races two sends of one address,
  cuts a connection string from a reason, and proves the personal links follow the public
  link's dates and its close on a newer version).
- Acceptance 6: e2e/invites.spec.ts sends two people, reads both emails from Mailpit
  (sender, subject, count, minutes, close date, two different links), opens one link in a
  fresh context and sees About you answering as that person with Name and Role not asked and
  Start enabled; the other link asks for them; a bad address and a repeat are refused.
