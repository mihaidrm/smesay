# 0006 Local and personal until the product is validated, 2026-10-01

Decided by Mihai.

1. No domain, no company accounts and no hosting until the product is validated. Mihai has set
   up company infrastructure for products that failed before and does not want to again.
2. Everything runs on Mihai's laptop: the app at localhost:3000, Postgres and file storage in
   Docker, emails in a local mailbox (Mailpit) instead of being sent.
3. Accounts that are needed are personal (Gmail) and paid with personal funds. In R1 that is one
   account: Anthropic Console, for E4, with a few euros of credit. Google and Microsoft sign-in
   can be tested with free personal developer accounts and localhost redirect URLs.
4. Git is local from day one. A private repository on Mihai's personal GitHub is optional and
   recommended as a backup; Mihai decides.
5. When outside people should try it, a free vercel.app address on a personal Vercel account
   comes first; the domain, Resend, the company accounts and the legal pages follow the name
   decision and the launch gate (see 0005 and docs/accounts.md).

Consequence: the E1 story "Deploy to Vercel fra1" and the E2 email sending move to the launch
gate. "Accepted on a laptop and a phone" means Mihai's laptop and his phone on the same network.
