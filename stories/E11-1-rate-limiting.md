# E11-1 Rate limiting on public links, auth routes and passcodes

User: Claude, keeping the public side safe; a respondent who should never notice it
Status: built
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

6. The public logo route, /brand/[workspaceId]/logo (E2-5), is in the same per-IP limit as the
   respondent routes.

## Out of scope
- A web application firewall: the host's business at the launch gate.

## Open questions
- None.

## Technical notes
Implemented in Next.js 16 `proxy` (decision 0024; nextjs.org/docs/app/api-reference/file-
conventions/proxy, read when the story starts) for the route match, with the bucket logic in
src/lib/ratelimit.ts so it is testable without HTTP.

Built 2026-10-04 (design note 72, decision 0044):
- Acceptance 1 and 6 (the logo): src/proxy.ts runs on /r and /brand and counts requests per
  address (the first X-Forwarded-For entry) in a 60 second window, 100 at most
  (src/lib/ratelimit.ts respondentLimit). Over it: 429 with Retry-After, the plain page "Too
  many requests" for a page request, JSON { error: [the sentence], code: "rateLimited",
  waitMinutes } for the respondent app's calls: the answer and Wrap up queues read 429 as
  "retry" and keep the answers (src/lib/answer-queue.ts outcomeOf), the link's state check
  waits for its next tick instead of reloading the page, and Start and Submit show the sentence.
  The passcode form, a server action, keeps its own limit. The address is the last
  X-Forwarded-For entry, the one the host's proxy appends. src/proxy.test.ts and
  e2e/ratelimit.spec.ts.
- Acceptance 2: better-auth's hooks (src/lib/auth.ts limitSignIn, countFailedCallback): a magic
  link request counts against its email and its address, a provider callback counts against
  its address when it fails; 5 in 15 minutes, then 429 for one minute, then two, four, up to an
  hour, and back to one after a quiet day (signInLimit). The app's own server calls (member
  invitations) are not counted. The sign-in form shows the wait from the 429's
  waitMinutes; a blocked callback goes to /sign-in/google-failed?wait=[N], which shows it.
  src/lib/auth-limit.test.ts and e2e/ratelimit.spec.ts.
- Acceptance 3: built in E6-1 (src/lib/link-access.ts: 5 wrong passcodes per link and address,
  60 per link, in 15 minutes, with its tests); unchanged.
- Acceptance 4, decided: in memory, per process (the app is one instance from `docker compose
  up`); a deploy with more instances needs a table of buckets (docs/review-list.md). A request
  with no X-Forwarded-For (a local run) is not limited by address, so one shared "local"
  bucket never locks everyone out; the email limit still applies.
- Acceptance 5 (unit tests): src/lib/ratelimit.test.ts drives the window and the backoff past
  their thresholds and across their windows with a test clock.
