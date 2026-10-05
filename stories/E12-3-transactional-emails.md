# E12-3 The four transactional emails, rendered and tested in Gmail, Outlook web and Apple Mail

User: a PM and a respondent reading email on whatever client they have
Status: built
Outcome: sign-in, personal invite, reminder and submission receipt render correctly in the
three clients Mihai checks, pass the writing scan, and carry the link as text.

## Acceptance criteria
1. Four templates in src/lib/mail/templates/ from docs/copy/emails.md: 600 px, one column,
   the mark at 22 px, one violet button, the link as plain text under it, the footer with the
   company name, the registered address (COMPANY_ADDRESS, set at the launch gate) and the
   privacy link; system font stack
   (design system, Email). Each has a plain-text part.
2. `npm run scan:copy` runs over the templates and passes.
3. Rendered samples are written to docs/design-notes/prototype-01/email-*.html by a script
   so they can be opened without sending; Mihai sends each to himself through Mailpit's
   release feature or a personal SMTP and checks Gmail, Outlook web and Apple Mail (decision
   0004); the result per client is recorded in the story.
4. Every placeholder is filled from the app's data with a unit test per template that renders
   it and finds no "[" left.
5. The sign-in minutes (15), reply-to and sender name, and receipt contents are decided
   (decision 0031) and the templates follow docs/copy/emails.md as written.

## Out of scope
- Marketing emails, digests: none (docs/copy/emails.md, Not sent).

## Open questions
- None.

## Technical notes
React Email (react.email, licence and release checked with the research rule) or plain
template strings; decided in the story and recorded here. The templates read the same N and
dates the app uses, so they cannot drift.

Built 2026-10-05 (design note 79, decision 0044). Plain template strings, no library: the five
emails share one frame of about 70 lines, and a library would add a dependency and a renderer
for no output the strings cannot give.
- Acceptance 1: src/lib/mail/templates/layout.ts is the frame (600 px, one column, the mark as
  a 22 px PNG from public/assets/brand/mark-44.png beside the wordmark, one violet button with
  the link as text under it, the footer, the system stack); sign-in.ts, invite.ts,
  reminder.ts, receipt.ts and deletion.ts (email 6, E11-2, now with the privacy link) fill it. Each returns a plain-text
  part built from the same lines. The button is violet, as docs/design-system.md and
  docs/copy/emails.md have it; "ink" in this story's first draft was the PM app's rule
  (decision 0031, item 4), not the email's (docs/review-list.md). The registered address is
  COMPANY_ADDRESS, left out while unset.
- Acceptance 2: `npm run scan:copy` covers src/ and docs/, the templates and the samples
  included.
- Acceptance 3: `npm run email:samples` writes docs/design-notes/prototype-01/email-sign-in,
  -invite, -reminder, -receipt and -deletion.html; `-- --send ADDRESS` also sends them through
  MAIL_SMTP_URL (Mailpit locally) for Mihai to release to his own inbox. The mark loads from
  the app's address, so a real client shows it once the app is public (--origin). Results per
  client: Mihai's, to be recorded here.
- Acceptance 4: src/lib/mail/templates/templates.test.ts renders the samples
  (src/lib/mail/templates/samples.ts) and every branch of each template (65 cases) and finds no
  "[", "undefined", "null" or "NaN"; it also checks the committed samples match.
- Acceptance 5: decision 0031 (items 9 and 10) and SIGN_IN_LINK_MINUTES = 15, which the magic
  link's expiry reads too (src/lib/auth.ts).
