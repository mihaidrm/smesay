# E11-5 Sentry wired, no personal data in events; security headers

User: Mihai, finding out about errors without collecting personal data
Status: ready
Outcome: errors reach Sentry with emails scrubbed and the security headers score A; both
switched on only at the launch gate. Visitor analytics moved to E13-3 (decision 0030).

## Acceptance criteria
1. Sentry: initialised only when SENTRY_DSN is set; a before-send hook removes emails, names,
   respondent field values and free text from every event (a unit test feeds an event with an
   email in the message and sees it scrubbed); EU region (docs/accounts.md step 10).
2. Security headers on every response (SECURITY.md): HSTS, CSP with nonces, X-Content-Type-
   Options, Referrer-Policy, Permissions-Policy; a Playwright test reads them on the home page;
   the grade A on securityheaders.com is checked at the gate (E1-5).
3. Logs carry no personal data (SECURITY.md, Data): the logger has an allow-list of fields.
4. Locally Sentry stays off and the app runs unchanged (decision 0006).

## Out of scope
- Uptime monitoring: a host feature at the gate. Plausible: E13-3.

## Open questions
- None.

## Technical notes
@sentry/nextjs after the research check; CSP nonces per request through Next.js 16's proxy
(nextjs.org/docs/app/guides/content-security-policy, read when the story starts).
The builder's preview frames the app's own /r/ pages (E5-6, design note 65): the CSP keeps
frame-ancestors 'self' (and X-Frame-Options SAMEORIGIN if it is set), or the preview goes
blank; e2e/preview.spec.ts would catch it.
