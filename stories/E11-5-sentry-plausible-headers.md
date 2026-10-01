# E11-5 Sentry and Plausible wired, no personal data in events; security headers

User: Mihai, finding out about errors and visits without collecting personal data
Status: ready
Outcome: errors reach Sentry with emails scrubbed, visits reach Plausible with no cookie
banner, and the security headers score A; all switched on only at the launch gate.

## Acceptance criteria
1. Sentry: initialised only when SENTRY_DSN is set; a before-send hook removes emails, names,
   respondent field values and free text from every event (a unit test feeds an event with an
   email in the message and sees it scrubbed); EU region (docs/accounts.md step 10).
2. Plausible: the script in the layout only when PLAUSIBLE_DOMAIN is set, on the marketing
   pages and the PM app, never on respondent pages; no cookies, so no banner (plausible.io
   documentation read when the story starts; unverified until then).
3. Security headers on every response (SECURITY.md): HSTS, CSP with nonces, X-Content-Type-
   Options, Referrer-Policy, Permissions-Policy; a Playwright test reads them on the home page;
   the grade A on securityheaders.com is checked at the gate (E1-5).
4. Logs carry no personal data (SECURITY.md, Data): the logger has an allow-list of fields.
5. Locally both stay off and the app runs unchanged (decision 0006).

## Out of scope
- Uptime monitoring: a host feature at the gate.

## Open questions
- None.

## Technical notes
@sentry/nextjs after the research check; CSP nonces per request through Next.js 16's proxy
(nextjs.org/docs/app/guides/content-security-policy, read when the story starts).
