# 0064 The domain is smesay.com, 2026-10-08

Mihai, 2026-10-08: "i purchased the domain, its on cloudflare" and, asked for the exact name,
"smesay.com". The plan (docs/accounts.md step 2) and the copy assumed smesay.app.

Decision:
- The product's domain is smesay.com, bought at Cloudflare Registrar on 2026-10-08, auto-renew
  on. Every address is on it: the site, hello@smesay.com for support and the privacy contact,
  and the mail subdomain mail.smesay.com for Resend (step 5).
- "smesay.app" is a retired term (docs/retired-terms.md). Decision 0049, the dated design notes
  of 2026-10-04 and 2026-10-05 and the LandingD board keep it as history.
- The legal pages name hello@smesay.com (version 4 stays: the address is a fact, not a clause,
  and no version 4 was shown to a user; docs/legal/lawyer-review.md L2 records it).
- hello@smesay.com stays plain text on the landing page and the legal pages until its inbox
  exists (step 11c), as decision 0049 planned.

Consequences: 23 files changed in one pull request (src, e2e config, CI env, .env.example,
docs/copy/landing.md, the LandingE, LandingF and Logo boards, stories/E12-5, the legal pages,
docs/accounts.md steps 2 and 5, the launch gate line of docs/plan-steps.md, the review list).
