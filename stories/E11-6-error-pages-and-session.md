# E11-6 Error pages, maintenance page, session expiry

User: anyone who hits a wrong address, a server failure, or a long lunch
Status: built
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
The signed-in segment already has src/app/app/error.tsx with the 500 copy up to "Try again in a
minute." and a "Try again" button (E2-1); this story adds the support address to it and builds
the pages.
Next.js not-found.tsx and error.tsx per layout (nextjs.org/docs/app/api-reference/file-
conventions/not-found and /error, read when the story starts). SUPPORT_EMAIL variable with a
placeholder until the gate.

Built 2026-10-05 (design note 77, decision 0044):
- Acceptance 1: src/app/not-found.tsx (404 with "Go to your projects"); src/app/error.tsx,
  src/app/app/error.tsx and src/app/global-error.tsx (500, through src/components/app/
  server-error.tsx, naming NEXT_PUBLIC_SUPPORT_EMAIL); MAINTENANCE=1 makes src/proxy.ts answer
  every request with the maintenance page or JSON, 503 with Retry-After, the minutes from
  MAINTENANCE_MINUTES. Copy in src/lib/error-pages-copy.ts and docs/copy/errors.md.
- Acceptance 2: src/app/r/[token]/not-found.tsx in the respondent frame, for notFound() under a
  link and any address below it (src/app/r/[token]/[...rest]/page.tsx); the link's 500 is its
  error.tsx (E6-1).
- Acceptance 3: the project context box. A save with no session answers signedOut; the form
  keeps its text and shows the banner, whose sign-in link opens in a new tab; the draft is in the
  tab's session storage and comes back after a reload with "What you typed before you were signed
  out is back. Save to keep it." The banner leaves out [HOURS] (docs/copy/errors.md). Other
  forms adopt the same hook when their story is next touched (docs/review-list.md).
- Acceptance 4: the copy scan flags "invalid input" in src/ (scripts/copy-rules.mjs,
  BANNED_IN_SRC); src/ has none.
- Tests: src/lib/error-pages-copy.test.ts, src/proxy.test.ts, scripts/copy-rules.test.mjs,
  e2e/error-pages.spec.ts, e2e/session-expiry.spec.ts.
