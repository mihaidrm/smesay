# Design note 79: the email templates, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E12-3, under decision 0044.

## What was decided

- One frame for every email, src/lib/mail/templates/layout.ts: the paragraphs before the
  button, the button and the link as text, the paragraphs after, the footer. The five emails
  (sign-in, invite, reminder, receipt, deletion) are now only their words. The plain-text part
  is built from the same paragraphs, so it cannot say something the HTML does not.
- Plain template strings rather than React Email: no new dependency, no renderer in the send
  path, and the output is the same table markup the emails already had.
- The mark is a 44 px PNG shown at 22 px, rendered from the mark's own paths by
  scripts/mark-png.mjs and served from public/assets/brand/ (the proxy skips /assets/). PNG
  because Gmail rasterises SVG and PNG works in Gmail, Outlook.com and Apple Mail
  (caniemail.com/features/image-png/ and /image-svg/, tested 2026-09-16). Its address is
  absolute on the email link's own origin. Until the app has a public address, a real inbox
  shows an empty 22 px space there (alt="").
- The button stays violet (#6D4CF5), as the design system's Email section says. The story's
  first draft said ink, which is the PM app's rule for primary actions (decision 0031, item 4);
  the story now says violet.
- The registered address is an environment variable, COMPANY_ADDRESS. Unset, the footer
  leaves the line out: the old footer sent "[REGISTERED ADDRESS, lawyer confirms in E11]" to
  real people.
- The deletion email gets the frame too, with no button. It now carries the privacy link like
  the others (the copy file's email 6 ends in the footer, which has it; the old file left it
  out). The removal job passes BETTER_AUTH_URL for the mark and the link; without it the email
  goes with the wordmark alone and no link, so a missing variable never holds up a deletion.
- `npm run email:samples` writes the five filled emails to docs/design-notes/prototype-01/,
  always on http://localhost:3000, and a unit test checks the files match the templates. With
  --send it also sends them through MAIL_SMTP_URL for Mihai's client checks (--origin sets the
  address the sent ones use). The samples use the Marlow fixture, minutesFor and a token of the
  app's shape; the PM's name is made up (the fixture has none).
- Every opened email asks the app's host for the mark, so a client that does not proxy images
  leaves the reader's address in the host's request log. The address is the same for every
  email, so it does not tell which email was opened (docs/review-list.md, for the lawyer).

## Why

Five files carried the same 12 lines of markup each; a change to the footer meant five edits,
and the address placeholder had already gone out in every email.
