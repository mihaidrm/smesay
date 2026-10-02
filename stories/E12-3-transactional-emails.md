# E12-3 The four transactional emails, rendered and tested in Gmail, Outlook web and Apple Mail

User: a PM and a respondent reading email on whatever client they have
Status: ready
Outcome: sign-in, personal invite, reminder and submission receipt render correctly in the
three clients Mihai checks, pass the writing scan, and carry the link as text.

## Acceptance criteria
1. Four templates in src/lib/mail/templates/ from docs/copy/emails.md: 600 px, one column,
   the mark at 22 px, one ink button, the link as plain text under it, the footer with the
   company name, the registered address placeholder and the privacy link; system font stack
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
