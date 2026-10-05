# 0054 The legal pages get proposed values for the lawyer to check, 2026-10-05

Mihai, 2026-10-05: "checked with lawyer and everything seems good so go ahead and make the final
version on stuff that was pending on lawyer". Claude answered that about half of the 45 markers
asked for a fact or a number, not a confirmation, and listed them. Mihai: "i think you should
first do a version when you put everything with what you find online as guidance - and he will
check those final things - i think you can put everything except the company details".

Decision:
- Version 2 of the privacy policy, the terms, the DPA and the subprocessor list (dated
  2026-10-05) has a proposed value everywhere the lawyer had a question, from public sources
  read the same day. Only the company details (registered address, registration number, fiscal
  code) stay as markers to fill.
- Each proposed value carries "[LAWYER: check L#]", and docs/legal/lawyer-review.md gives each
  one its source and reason, so the lawyer checks them in one pass. The legal pages still mark
  every place a lawyer must confirm (CLAUDE.md).
- Where a period is promised, the code does it: the hourly job deletes ended sessions and
  expired sign-in links, usage events after 13 months and admin log entries after 12 months,
  and the in-memory rate-limit counts are swept every 10 minutes (src/lib/workspace-removal.ts,
  src/lib/ratelimit.ts, src/lib/link-access.ts; tests in src/db/queries/removal.test.ts and
  src/lib/ratelimit.test.ts).
- Facts version 1 had wrong, corrected from the providers' own pages: Resend keeps its records
  in the United States (only sending is in the EU); Neon belongs to Databricks; Anthropic
  contracts through Anthropic Ireland for EEA customers and processes in the United States;
  Google is a separate controller for sign-in, not a subprocessor. vercel.json now sets the
  Frankfurt region that docs/accounts.md step 4 said was set.

Consequences: docs/accounts.md steps 3, 4 and 5 amended (Neon's 7-day restore window at the
launch gate, the Vercel region, Resend's US records); src/lib/legal.test.ts expects version 2;
docs/plan-steps.md E11 row; docs/review-list.md rows. Open for the lawyer: the company details,
how to meet Civil Code art. 1203's express acceptance online, the Data Act and a free beta, and
consent for visit counts when Plausible is switched on.
