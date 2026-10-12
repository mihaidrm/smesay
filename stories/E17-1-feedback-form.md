# E17-1 A feedback form in the app, and the reports managed in admin

User: a person using SMEsay who hits something wrong, has an idea or a question; Mihai,
who reads the reports and closes them
Status: built
Outcome: anyone signed in sends a report from any page in two fields; Mihai sees every
report on one admin page, marks it solved, reopens it or removes it, and hears about each
new one by email.

## Acceptance criteria
1. The sidebar of every signed-in page has a "Feedback" item under Settings, which opens
   /app/feedback with the path of the page it was pressed on in the address (?from=), so
   the report says which page it is about. A person who opens /app/feedback directly sends
   a report with no page.
2. The page has one form: the kind (Something is wrong, An idea, A question, Something
   else), the text (1 to 2,000 characters), the page it is about as a line when there is one,
   and Send. The server checks the kind and the length; the page is kept only when it is a
   path of this app (starts with "/", at most 300 characters, no line break). Each refusal
   has its line (docs/copy/errors.md). After Send the form clears and a line says it was
   sent and that the reply, when there is one, goes to the person's sign-in address.
3. Under the form, "Reports from this workspace" lists the workspace's reports, newest
   first: the kind, the text, who sent it, when, and Open or Solved. Empty: one line.
   A workspace sends at most 20 reports an hour; the 21st is refused with its line.
4. Each report is a row of the feedback table with the workspace, the person, the kind, the
   text, the page, the status (open or solved), who solved it and when. A member of
   workspace A cannot read B's reports; a test proves it. Removing a workspace removes its
   reports.
5. Each new report sends one text-only email to every address in ADMIN_EMAILS: the kind, the
   workspace, the person's address, the page, the text, and the link to /admin/feedback
   (docs/copy/emails.md, 12). A failed send is logged and the report is kept.
6. /admin/feedback (a "Feedback" item in the admin nav) lists the reports newest first with
   a filter: Open (the default), Solved, All. Each row: when, the workspace (a link to its
   admin page), the person's address, the kind, the page, the text, the status, and the
   buttons Mark solved (or Reopen) and Remove, each through the confirm line. Mark solved
   and Reopen change the status and record who and when; Remove deletes the row. The three
   actions are in the audit log as feedback_solved, feedback_reopened and feedback_removed,
   with the workspace as the target and the report's id in the changes; the text never
   enters the audit. Empty, loading and error states as the other admin pages.
7. Tests: unit tests for the checks, the hourly cap, the email, the queries (create, the
   workspace's list, the admin's list and filter, solve, reopen, remove, the A/B isolation);
   one Playwright test: a member sends a report from a project page, sees it under the form,
   the admin sees it on /admin/feedback, marks it solved, the member sees Solved, the admin
   removes it; Mailpit holds the admin email.

## Out of scope
- A form on the landing page: the question bubble (E12-5) already emails Mihai from there,
  and a table needs a workspace (CLAUDE.md, data rules).
- A form on respondent links: respondents have no account; R2 if the answers show a need.
- Screenshots or files with a report: R2.
- A reply from the admin page: Mihai answers from his inbox, the person's address is in the
  email and on the row.
- A count of open reports in the admin nav or on the Overview.

## Open questions
- None. Decided 2026-10-12 by Claude under decision 0044 and recorded in decision 0069:
  in the app rather than on the landing page; Remove deletes the row; one email per
  report to the admin addresses; no "AI" anywhere in the form (decision 0046).

## Technical notes
The feedback table carries workspace_id like every product table (not nullable), user_id
with "set null" on deletion so a report outlives the account, a check on the kind and the
status, a check on the text's length, and an index on (status, created_at) for the admin
page. The form is a server action with useActionState (as the members form, E2-3); the
sidebar item is a client component for usePathname (as NavLink). The admin page uses
ConfirmForm (E14-2) with the report's id hidden in each form, and the actions go through
audited() with the workspace as the target. The admin email goes through sendMail
(src/lib/mail.ts) from the action after the row is written, one message per address, each
failure logged with the report's id.

Built 2026-10-12 (design note 134, decision 0069):
- Acceptance 1: src/components/app/feedback-link.tsx in the shell's sidebar, after Settings;
  the link carries ?from=[PATH] except on the feedback page itself.
- Acceptance 2 and 3: src/app/app/(shell)/feedback/ (page.tsx, form.tsx, actions.ts);
  src/lib/feedback.ts checks the fields, counts the hour in SQL, writes the row and sends the
  emails; src/lib/feedback-copy.ts holds the words.
- Acceptance 4: the feedback table (migration 0042), src/db/queries/feedback.ts (scoped).
- Acceptance 5: adminFeedbackMail in src/lib/feedback.ts, email 12 in docs/copy/emails.md.
- Acceptance 6: src/app/admin/feedback/ (page.tsx, actions.ts), the inbox queries in
  src/db/queries/admin.ts, three AdminActions, the nav item in src/app/admin/layout.tsx.
- Acceptance 7: src/lib/feedback.test.ts (5 tests), src/db/queries/feedback.test.ts (5
  tests: the row and the emails, the kept row on a failed send, the cap, the inbox with
  solve, reopen and remove inside audited(), the cascade), e2e/feedback.spec.ts (1 test).
