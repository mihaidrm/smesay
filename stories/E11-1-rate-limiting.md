# E11-1 Rate limiting on public links, auth routes and passcodes

User: Claude, keeping the public side safe; a respondent who should never notice it
Status: ready
Outcome: respondent routes take 100 requests per minute per IP, auth attempts stop after 5,
passcode guesses are throttled, all with plain pages.

## Acceptance criteria
1. Respondent routes (/r/*, the answers and state routes): 100 requests per minute per IP
   (SECURITY.md); over it, 429 with a page "Too many requests from your connection. Wait a
   minute and try again." (added to docs/copy/errors.md). Autosave retries after the window
   without losing answers (E7-3's queue).
2. Auth routes: 5 attempts (magic link requests or failed provider callbacks) per email or
   IP, then backoff doubling from one minute; the page "Too many sign-in attempts. Wait
   [MINUTES] minutes, then try again."
3. Passcode: 5 wrong attempts per token and IP, then "Too many passcode attempts. Wait
   [MINUTES] minutes and try again."
4. Limits are enforced in the database or in memory per instance in a way that works on
   plain Postgres with `docker compose up` (CLAUDE.md): a table of buckets, or an in-memory
   store with a note that a multi-instance deploy needs the table. Decided in the story and
   recorded here.
5. Unit tests drive each limiter past its threshold and across the window.

## Out of scope
- A web application firewall: the host's business at the launch gate.

## Open questions
- None.

## Technical notes
Implemented in Next.js 16 `proxy` (decision 0024; nextjs.org/docs/app/api-reference/file-
conventions/proxy, read when the story starts) for the route match, with the bucket logic in
src/lib/ratelimit.ts so it is testable without HTTP.
