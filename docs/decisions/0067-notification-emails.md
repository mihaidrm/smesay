# 0067 Emails to the PM about a validation, and a getting-started series, 2026-10-12

Mihai, 2026-10-12, after Claude listed the six emails the product sends and four it could
send: "Yes do that - and also for people who came to the site and logged in but didnt
convert we should send the free trial emails and reminders and bla bla, scope and build
those as well".

Decision:
- Epic E16 Notifications. E16-1: a closing summary when a validation's link closes, an
  "everyone has submitted" email, a daily digest the PM opts into, and a workspace
  invitation that names the inviter; a per-person Emails card in Settings and a one-click
  stop link in every non-transactional email. E16-2: a getting-started series of four emails
  over two weeks to people who signed in and have not published a validation.
- This overrides the limit of decision 0003 and the design system's "transactional only":
  the product now sends service emails about the person's own validations and a short
  activation series, each with a switch and a stop link. No marketing, no digest of tips.
- "Converted" means a validation published (an invite row, public or personal): the product's
  own funnel (Sign up, First project, First validation published; E13). People who typed an
  address on the sign-in page and never opened the link have no account and get nothing.
- There is no free trial today (decision 0008), so no trial email is sent. The series is
  built so a "trial ends" and a "trial ended" step join it when a plan has a trial; their
  copy is drafted and marked not sent.
- The series goes out only when LIFECYCLE_EMAILS=on, which Mihai sets at the launch gate
  once the lawyer confirms the privacy policy's paragraph on service emails (design note 132,
  docs/legal/lawyer-review.md L31). The validation emails and the invitation need no gate:
  they follow from actions in the person's own workspace.
- Claude's choices under decision 0044, in docs/review-list.md: recipients are every member
  of the workspace with the switch on; the digest is opt-in; the steps are at 1, 3, 7 and 14
  days; the job runs hourly.

Consequences: migration 0040 (user.email_prefs, user.email_state, instrument.closed_email_at,
instrument.complete_email_at), src/lib/notifications.ts, scripts/jobs-emails.ts, five
templates, the Settings card, /email/stop, docs/copy/emails.md (emails 7 to 11), app.md,
errors.md, docs/design-system.md, INTERFACES.md, docs/setup.md, docs/runbooks, .env.example,
docs/accounts.md, docs/legal/lawyer-review.md, stories/E16-1 and E16-2, design note 132.
