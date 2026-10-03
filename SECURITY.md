# Security checklist (reviewer audits against this)

Auth and sessions
- Magic links single-use, 15 minute expiry, bound to the requesting email, stored hashed.
- OAuth state and PKCE verified; providers matched to one user by verified email only.
- Sessions httpOnly, Secure, SameSite=Lax; rotation on privilege change. A production process
  refuses an http base URL other than localhost.

Multi-tenancy
- Every query scoped by workspace id from the session, never from the request body. The one
  read across workspaces is the product's AI spend sum for its monthly cap (decision 0036), in
  src/db/queries/internal.ts; outside src/db the lint rule lets only src/lib/workspace.ts
  (the membership check) and src/lib/ai/client.ts with its test import that module. Scripts
  outside src/ (scripts/ai-smoke.ts, evals/run.ts) read the database directly for their own
  throwaway rows; they never run in the app.
- Row ownership tested: a user in workspace A cannot read, write or enumerate workspace B.

Public links and respondents
- Instrument tokens 128-bit random; respondent tokens separate from instrument tokens.
- Revoked and closed instruments return a page, not data. Passcode attempts rate-limited.
- A personal link (E6-2) is its own 128-bit token, sent to one address; the address is the
  proof, so the public link's passcode does not apply to it. One personal invite per address
  on an instrument (partial unique index). The provider's failure reason is stored on the
  row and shown to the PM only, cut to 200 characters with every word that could carry a
  host or a credential (an @, a scheme, an IPv4 or IPv6 address, a dotted host name, a
  host:port, anywhere in the word) replaced by "[server]" first.
  At most 500 personal invites per workspace in 24 hours (src/lib/invitees.ts), since the
  PM names the sender and three lines of the body.
- The passcode is stored as a salted scrypt hash with its parameters (src/lib/passcode.ts)
  and remembered per device by a cookie scoped to the link's path that holds an HMAC under a
  key derived from the app's secret, never the passcode (src/lib/link-access.ts). Wrong
  attempts are limited in the process, counted as a post starts and given back on a right
  passcode: 60 per link and 5 per link and address in 15 minutes (E6-1); the shared store
  and the per-route limit are E11-1.
- Rate limits: respondent routes 100/min/IP; auth routes 5 attempts then backoff.

Data
- Uploads validated by type and size (5 MB, 2,000 rows); parsed server-side in the request,
  within those caps (decision 0040).
- Exports and deletion per workspace; deletion removes rows and objects within 24 hours.
- No personal data in logs, Sentry events or analytics.

AI
- Anthropic key server-side only; one product spend cap (ANTHROPIC_MONTHLY_BUDGET_EUR),
  per-workspace and per-request token budgets enforced (decision 0036).
- Uploaded text passed as data, separated from instructions; output validated against a JSON
  schema before display; model may not add items, additions flagged as suggestions.

Admin area (E13-2, E14)
- /admin served only to ADMIN_EMAILS; everyone else gets 404. The admin queries live in one
  module the product's pages never import.
- Every admin action writes an audit row in the same transaction; "view as" is read-only,
  shows a banner, expires after 60 minutes and is audited at start and stop.
- No respondent names or answers in the admin area except through "view as".

Headers and transport
- HSTS, CSP with nonces, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- securityheaders.com grade A on the production domain.

Dependencies and backups
- `npm audit` clean of high and critical at release; lockfile committed.
- Nightly backups; one restore into a fresh database performed and documented before launch.

Mode script
- src/app/layout.tsx puts one inline script in the head to set the dark class before paint.
  It is a fixed string, reads one localStorage key and compares it with one word. When the
  content security policy lands (E11-5), that script takes the nonce the Next.js guide
  describes (node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md).

