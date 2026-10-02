# Security checklist (reviewer audits against this)

Auth and sessions
- Magic links single-use, 15 minute expiry, bound to the requesting email, stored hashed.
- OAuth state and PKCE verified; providers matched to one user by verified email only.
- Sessions httpOnly, Secure, SameSite=Lax; rotation on privilege change. A production process
  refuses an http base URL other than localhost.

Multi-tenancy
- Every query scoped by workspace id from the session, never from the request body.
- Row ownership tested: a user in workspace A cannot read, write or enumerate workspace B.

Public links and respondents
- Instrument tokens 128-bit random; respondent tokens separate from instrument tokens.
- Revoked and closed instruments return a page, not data. Passcode attempts rate-limited.
- Rate limits: respondent routes 100/min/IP; auth routes 5 attempts then backoff.

Data
- Uploads validated by type and size (5 MB, 2,000 rows); parsed server-side in a worker.
- Exports and deletion per workspace; deletion removes rows and objects within 24 hours.
- No personal data in logs, Sentry events or analytics.

AI
- Anthropic key server-side only; per-workspace and per-request token budgets enforced.
- Uploaded text passed as data, separated from instructions; output validated against a JSON
  schema before display; model may not add items, additions flagged as suggestions.

Headers and transport
- HSTS, CSP with nonces, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- securityheaders.com grade A on the production domain.

Dependencies and backups
- `npm audit` clean of high and critical at release; lockfile committed.
- Nightly backups; one restore into a fresh database performed and documented before launch.
