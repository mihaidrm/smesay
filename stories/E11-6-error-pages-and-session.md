# E11-6 Error pages, maintenance page, session expiry

User: anyone who hits a wrong address, a server failure, or a long lunch
Status: ready
Outcome: 404, 500 and maintenance each have a page in the product's words, and an expired
session keeps what was typed.

## Acceptance criteria
1. 404: "This page does not exist. Check the address, or go to your projects." with the
   button; 500: "The server could not finish this request. It has been logged. Try again in a
   minute; if it keeps failing, email [SUPPORT EMAIL]."; maintenance (when MAINTENANCE=1):
   "SMEsay is being updated and is back within [MINUTES] minutes. Respondent links keep their
   saved answers." (docs/copy/errors.md, Everything else).
2. Respondent pages have their own 404 and 500 in the respondent layout (no PM navigation).
3. Session expired on a PM form: the banner "You were signed out after [HOURS] hours. Sign in
   again; what you typed on this page is kept." and the form's draft is kept in session
   storage and restored after sign-in (one Playwright test on the project context box).
4. Server validation messages follow the rule "[FIELD] [what is wrong]. [What to enter.]" and
   never "invalid input"; the copy scan runs on src/ for the phrase.

## Out of scope
- A status page: the gate.

## Open questions
- None.

## Technical notes
Next.js not-found.tsx and error.tsx per layout (nextjs.org/docs/app/api-reference/file-
conventions/not-found and /error, read when the story starts). SUPPORT_EMAIL variable with a
placeholder until the gate.
