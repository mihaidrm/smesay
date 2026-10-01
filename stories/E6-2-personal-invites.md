# E6-2 Personal invites: paste emails, send from the platform, one link per person

User: a PM who needs named answers from specific people
Status: ready
Outcome: each person gets their own link by email; the link resumes their response on any
device and records answers under their name.

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
- From docs/copy/emails.md: reply-to the PM's own address (recommended) or none; sender name
  shows the PM's name (recommended) or the workspace name. Mihai decides; the email and the
  story change together.

## Technical notes
invite.email, name, role_hint (docs/schema.md); the response for a personal invite is created
on first open with fields pre-filled from the invite. The "minutes" estimate is one function
shared with the reminder and the landing copy.
