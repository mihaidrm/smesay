# 0049 The question bubble's words, address and promise, 2026-10-05

Mihai, answering the three open questions of stories/E12-5 (decision 0046): "they can go to
[his own address] - 1 working day sounds good", and to the word "AI": "yes" (no "AI").

Decision:
- No "AI" anywhere in the bubble or its panel. The button's name and the panel's title are
  "Ask us a question"; nothing on the landing page suggests an assistant that answers.
- Until the launch gate buys the domain, the questions go to Mihai's own address, set as
  NEXT_PUBLIC_SUPPORT_EMAIL in .env.local only (never committed, CLAUDE.md). At the launch
  gate it becomes hello@smesay.app (docs/accounts.md).
- The panel promises "We read every message and reply by email within one working day."

Consequences: stories/E12-5 is ready to build (its open questions answered); the E12 row of
docs/plan-steps.md no longer waits on Mihai; docs/copy/landing.md and docs/copy/emails.md
carry the words as decided. The same variable names the address on the 500 pages (E11-6),
so until the launch gate those pages show Mihai's address too; nothing is public before the
launch gate (decision 0006).
