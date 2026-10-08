# E2-1 Sign in with a magic link

User: a PM signing in for the first time or again, with nothing to remember
Status: built
Outcome: enter an email, click the link in the email, be signed in; nothing else to set up.

## Acceptance criteria
1. The sign-in page has one field (email) and one button. An empty or malformed address shows
   "Enter the email address you signed up with." under the field (docs/copy/errors.md).
2. After submitting, the page shows the banner "Check your email. The link works once and stops
   working in 15 minutes." The email arrives within 30 seconds: locally in Mailpit at
   localhost:8025 (decision 0006), at the launch gate through Resend. Its text is email 1 in
   docs/copy/emails.md, with N = 15.
3. The link signs the person in once. Opened a second time, or after 15 minutes, it shows the
   page "This sign-in link has already been used or has expired. Ask for a new one." with a
   "Send a new link" button. The link is bound to the email it was requested for
   (SECURITY.md, Auth and sessions).
4. The session cookie is httpOnly, Secure (off on http://localhost only), SameSite=Lax; the
   session lasts 30 days of inactivity and is rotated on sign-in. A test reads the Set-Cookie
   header and checks the three flags.
5. A signed-out person opening any app page is sent to the sign-in page and back to the page
   they wanted after signing in. Sign out exists in the sidebar footer.
6. Playwright: request a link, read it from Mailpit's API, open it, land on the app, sign out.

## Out of scope
- Google sign-in: E2-2 (Microsoft and Apple after launch, decision 0034). Workspace creation on first sign-in: E2-3.
- The five-attempt limit on auth routes: E11-1 (SECURITY.md names it; the story that builds
  rate limiting covers it).
- Sending through Resend: the launch gate (decision 0006). The transport is behind one
  function so the switch is configuration.

## Open questions
- None. The 15 minute expiry is the recommendation in docs/copy/emails.md, taken as decided
  unless Mihai objects.

## Technical notes
Built 2026-10-02.

Changed 2026-10-08: every page reads the session through readSession() (src/lib/session.ts).
better-auth refuses with "Failed to get session" (UNAUTHORIZED) when the session row is gone
by the time of its daily refresh write, after expiring the cookies; that read now counts as
signed out and the page sends the person to sign in instead of an error page (Mihai saw the
error page that day). src/lib/session.test.ts covers it.

- src/lib/auth.ts: better-auth with the magic link plugin (better-auth.com/docs/plugins/magic-
  link; options in node_modules/better-auth/dist/plugins/magic-link/index.d.mts: `expiresIn`
  in seconds, set to 15 minutes; `sendMagicLink` gets email and url; `storeToken: "hashed"`, so
  a database read does not yield working links; the plugin ships a limit of 5 requests per
  minute that better-auth enforces only with NODE_ENV=production, in memory per process, so
  E11-1 sets the real auth limits) and `nextCookies()`. Sessions last 30 days and refresh once
  a day (`session.expiresIn`, `updateAge`, in node_modules/@better-auth/core/dist/types/
  init-options.d.mts); the cookie is httpOnly and SameSite=Lax; Secure and the `__Secure-` name
  prefix follow the scheme of BETTER_AUTH_URL (node_modules/better-auth/dist/cookies/index.mjs,
  createCookieGetter), and `readAuthEnv()` refuses to start a production process with an http
  base URL other than localhost, or without BETTER_AUTH_URL and BETTER_AUTH_SECRET at all. The route handler
  is src/app/api/auth/[...all]/route.ts through `toNextJsHandler(auth)`
  (node_modules/better-auth/dist/integrations/next-js.d.mts). better-auth's verify endpoint
  consumes a token atomically on the first use (index.d.mts, allowedAttempts note), so a link
  works once; a second use is sent to /sign-in/link-used through errorCallbackURL.
- One transport, SMTP through nodemailer 10.0.13 (MIT-0, released 2026-09-30, own types in
  dist/esm; open issue count unverified: api.github.com answers 403 from the session and the
  session's GitHub access is scoped to this repository. Mihai can read it at
  github.com/nodemailer/nodemailer/issues).
  `MAIL_SMTP_URL` points at the compose Mailpit locally and at Resend's SMTP endpoint at the
  launch gate (resend.com/docs/send-with-smtp), so the switch is a variable, not a driver.
  `memory:` keeps messages in an outbox for the unit test. The sign-in email is email 1 of
  docs/copy/emails.md with N = 15, as text and a one-column HTML (src/lib/mail/templates/sign-in.ts).
  The footer's privacy policy link is absolute and points at /legal/privacy, which E11-3
  builds; until then it opens the 404 page. The mark as a 22 px inline image needs a hosted
  PNG and checks in real clients, so the HTML carries the text wordmark until E12-3 makes the
  four emails shared templates.
- Screens: /sign-in (one field, one button, the inline message and the "Check your email"
  status box), /sign-in/link-used (the used-or-expired page with "Send a new link"), and the
  signed-in shell under /app: a 240 px sidebar with the lockup, the workspace block (E2-3 fills
  it), the signed-in email and Sign out (which shows a message if the request fails), plus the
  loading and error states of the segment (src/app/app/loading.tsx, error.tsx; the support
  address in the error copy comes with E11-6). A signed-out request under /app is sent by
  src/proxy.ts to /sign-in with the full path in `next`, and every page under /app verifies the
  session again through `requireSession()` (src/lib/session.ts), because a layout alone does not
  guard its pages (node_modules/next/dist/docs/01-app/02-guides/authentication.md). `next` must
  be a path inside the site: src/lib/safe-path.ts applies better-auth's own relative-URL rule
  (no "//", no backslash, no control character, no encoded slash, same origin after parsing),
  with src/lib/safe-path.test.ts. Every string on these screens is in docs/copy/app.md or
  errors.md; a refused request shows the matching copy line, never the library's text
  (src/lib/sign-in-copy.ts). Design note 15 has the screenshots.
- Tests: src/lib/auth.test.ts runs the sign-in through better-auth's handler on the test
  database with the memory outbox (link once, cookie flags, Secure and the prefix on an https
  base URL, a link opened after 16 minutes refused, a new session token per sign-in, an
  off-site callback refused with the origin check on, a missing variable named, 15 and 30 day
  values); e2e/sign-in.spec.ts does the whole path in a browser against Mailpit's API
  (mailpit.axllent.org/docs/api-v1: GET /api/v1/search?query=to:address, GET
  /api/v1/message/{ID}); CI runs a Mailpit service container for it. Variables: BETTER_AUTH_SECRET
  (generated into .env.local, never shared), BETTER_AUTH_URL, MAIL_SMTP_URL, EMAIL_FROM
  (.env.example); the Vitest and CI values are placeholders for throwaway databases.
- Not in this story: the five-attempt auth limit (E11-1), Google (E2-2), the
  quickstart after the first sign-in (E12-2), the workspace (E2-3).
- Audit of 2026-10-02 (fresh context, 19 findings): the four blocking ones (a tab in `next`
  resolving to another host, Secure unproven, library text on screen, EMAIL_FROM defined twice
  in .env.example) and the seven should-fix ones were closed the same day in the pull request
  after the story's; the notes are recorded above where they changed a claim.
