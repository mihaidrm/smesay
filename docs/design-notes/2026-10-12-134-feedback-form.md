# 134 The feedback form and the admin inbox, 2026-10-12

Stories/E17-1, decision 0069. Mihai: a feedback form on the site, the reports managed in
admin (solve, remove).

## Where the form lives

Three places were weighed. The landing page: visitors there already have the question bubble
(E12-5), which emails Mihai and stores nothing; a second form beside it would split one
need in two. The respondent link: respondents have no account and no workspace, so a table
for them breaks the data rule (CLAUDE.md) and they are not the people Mihai wants feedback
from first. The signed-in app: the people who use the product are there, every page has
the sidebar, the workspace and the person are known, and a table fits the rules. The form
goes in the app, as a sidebar item under Settings on every page.

## The form

Two fields, one line, one button. The kind as four radio buttons (Something is wrong, An
idea, A question, Something else), the text as a textarea (1 to 2,000 characters, the count
not shown; the refusal names the limit), the page as a line "About: /app/projects/.../build"
when the item was pressed on a page, and Send. No subject line: the kind is the subject.
No screenshot: R2. The person's address is not asked; the session has it, and the sent line
says the reply goes there. Under the form the workspace's reports, newest first, with Open or
Solved, so a person sees the report was kept and whether it was handled.

## The admin page

/admin/feedback, the fifth item of the admin nav. A filter of three links (Open, Solved,
All), a table (when, workspace, person, kind, page, text, status), and two ConfirmForms per
row: Mark solved or Reopen, and Remove. The text is shown in full in the row (2,000
characters at most); no detail page. Remove deletes the row: a removed report has no value
later, and the audit row keeps the fact. Solved keeps the row with who and when, so the list
of solved reports is the log of what the first users asked for.

## The email

One text email per report to each address in ADMIN_EMAILS, from the server action after the
row is written. The subject names the kind and the workspace; the body has the person's
address, the page, the text and the link. A failed send is logged with the report's id and
the person still sees "Sent": the row is the record, the email is the nudge.

## The cap

20 reports an hour per workspace, counted in SQL on the table itself (no memory counter, as
the respondent limits use): a loop in a browser or a prank cannot fill the inbox, and no
real person sends 20 in an hour.

## Not done

A count of open reports on the Overview or in the nav: the email is the notice; a count can
come when there are more than a few reports a day. Replies from the admin page: Mihai's
inbox has the address.
