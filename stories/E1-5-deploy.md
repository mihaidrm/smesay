# E1-5 Deploy from main with preview deploys

User: Mihai, showing the app to an outside person
Outcome: a hello page at the domain over HTTPS, built from main on every merge, with a
preview address per branch.

Status: deferred to the launch gate (decision 0006). Written so the E1 list matches the
business plan (page 9); not built in Phase 3 until Mihai opens the gate.

## Acceptance criteria
1. A merge to main deploys to the domain within five minutes; a push to any branch gets a
   preview address posted on its pull request.
2. The hello page answers over HTTPS with the security headers in SECURITY.md (HSTS, CSP with
   nonces, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) and
   securityheaders.com grades it A.
3. The deployed app runs against a managed Postgres and an S3-compatible bucket named in
   docs/accounts.md, with every secret in the host's environment settings and none in the
   repository (`git log -p` grep for the key names finds only .env.example).
4. docs/accounts.md steps 2 to 4 and 8 are done by Mihai and ticked in that file.

## Out of scope
- Email sending, the domain purchase, legal pages: their own launch-gate items.

## Open questions
- Host. The plan says Vercel fra1; decision 0006 says a free vercel.app address on a personal
  account comes first. Nothing in the app depends on Vercel (CLAUDE.md: `docker compose up`
  with plain Postgres must run it), so the choice waits for the gate.

## Technical notes
Not started. When the gate opens: the host's Next.js 16 adapter, the RustFS endpoint replaced
by the managed bucket's, `BETTER_AUTH_URL` set to the domain, and the CI workflow unchanged
(the host builds from main itself).
