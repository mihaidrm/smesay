# 0069 A feedback form in the app, managed in admin, 2026-10-12

Mihai, 2026-10-12: "we should create a feedback Form on the website-- that is viewable in the
admin (the reports are viewable in admin i mean, and i can manage them from there / solve /
remove etc)", for the first real users who give feedback.

Decision (Claude under decision 0044, recorded here, in docs/review-list.md for Mihai's
review):
- The form is inside the signed-in app (a Feedback item in the sidebar on every page,
  /app/feedback), not on the landing page. The landing page already has the question bubble
  (E12-5, decision 0049) that emails Mihai, and a table needs a workspace (CLAUDE.md, data
  rules); the people giving feedback are signed in.
- A report has a kind (Something is wrong, An idea, A question, Something else), a text of 1
  to 2,000 characters, and the page it was sent from. Nothing else is asked: the person's
  address comes from the session.
- Mihai manages reports on /admin/feedback: Mark solved, Reopen, Remove. Remove deletes the
  row; the audit log keeps who did what to which report, never the text.
- Every new report emails every address in ADMIN_EMAILS, text only, with the link to the
  admin page. There is no reply from the admin page: Mihai answers from his inbox.
- At most 20 reports an hour per workspace, so a loop or a prank cannot fill the inbox.

Why: the first users need one place to say what is wrong, and Mihai needs one place to see
it and close it. The landing bubble serves visitors; this serves users. Email is how Mihai
notices; the page is where he works.

Files: stories/E17-1-feedback-form.md, design note 134, src/db/schema.ts (feedback), migration
0042, src/db/queries/feedback.ts, src/db/queries/admin.ts, src/lib/feedback.ts,
src/app/app/(shell)/feedback/, src/app/admin/feedback/, docs/copy/app.md, errors.md,
emails.md (12), INTERFACES.md, stories/backlog.md (E17), docs/plan-steps.md.
