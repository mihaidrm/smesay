# E11-3 Privacy policy, terms, DPA and subprocessor list; privacy notice on every instrument

User: a PM's legal team; a respondent wondering where their answers go
Status: ready
Outcome: the four legal pages exist as drafts with a marker at every place a lawyer must
confirm, each showing its version and date, and every instrument links to the privacy notice.

## Acceptance criteria
1. /legal/privacy, /legal/terms, /legal/dpa, /legal/subprocessors: drafted by Claude in plain
   English (WRITING.md), with "[LAWYER: confirm ...]" markers at every place a lawyer must
   confirm (decision 0004 item 3), the controller Alerty S.R.L. with the registered address
   placeholder, the hosting region, retention (24 hour deletion, E11-2), the respondent data
   stored (only the fields the PM configured, CLAUDE.md), the AI processing (Anthropic as a
   subprocessor, what is sent), exports, and contact.
2. Each page shows "Version [N], [DATE]" at the top; versions are files in docs/legal/ and
   the pages render them, so a change is a commit.
3. The respondent About you page and the Done page link to the privacy notice ("How your
   answers are used") in the footer beside Powered by; the landing page footer links to all
   four (docs/copy/landing.md).
4. The markers are counted by a script (`npm run legal:markers`) and listed in docs/accounts.md
   step 12 for the lawyer; the pages ship with the markers visible until Mihai says they are
   confirmed, then the markers are removed in one commit.
5. The copy scan passes on docs/legal/.

## Out of scope
- The lawyer's review itself: the launch gate (docs/accounts.md step 12).

## Open questions
- None.

## Technical notes
The sign-in email's footer already links to /legal/privacy (E2-1, src/lib/mail/sign-in-email.ts),
so the address is fixed; until this story the link opens the 404 page.
Markdown in docs/legal/ rendered through a small renderer with the design system's type;
subprocessors list from docs/accounts.md (hosting, database, email, storage, AI, errors,
analytics) with "none yet" where the account does not exist (decision 0006).
