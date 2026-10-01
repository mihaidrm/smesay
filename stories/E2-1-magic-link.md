# E2-1 Sign in with a magic link

User: a PM signing in for the first time or again, with nothing to remember
Status: ready
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
- Google and Microsoft sign-in: E2-2. Workspace creation on first sign-in: E2-3.
- The five-attempt limit on auth routes: E11-1 (SECURITY.md names it; the story that builds
  rate limiting covers it).
- Sending through Resend: the launch gate (decision 0006). The transport is behind one
  function so the switch is configuration.

## Open questions
- None. The 15 minute expiry is the recommendation in docs/copy/emails.md, taken as decided
  unless Mihai objects.

## Technical notes
better-auth with the magic link plugin (better-auth.com/docs/plugins/magic-link; the page is
read when the story starts and the expiry option name confirmed then, unverified until then).
The route handler at src/app/api/auth/[...all]/route.ts (better-auth.com/docs/installation).
Email transport in src/lib/mail.ts: `sendMail({ to, subject, text, html })` with a Mailpit SMTP
driver (localhost:1025, docker-compose.yml) and a Resend driver chosen by `MAIL_PROVIDER`;
missing variables are named and the app refuses to send. Templates for the four emails are
E12-3's; this story ships the sign-in email as plain text plus a minimal HTML version using the
design system's email rules (600 px, system stack). The session rules are SECURITY.md's.
