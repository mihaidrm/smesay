# 0020 PM side desktop only in R1; project context box on Import, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01.

1. The PM side ships for desktop only in R1. No phone board and no phone layout for the PM app
   until a release after R1. Decision 0015 (every design for desktop and phone) applies to the
   landing page and the respondent side; the PM side is the exception. A read-only results view
   on a phone is a candidate for R2.

2. The PM gets a context box when setting a project up: "About this project", on the Import
   step above the column mapping. One short text ("What is this about?") and an optional line
   of terms to keep as written, capped at 2,000 characters together. The AI reads it when it
   groups and rewrites the items (E4) and when it writes the actions (E9). It is not shown to
   respondents; their intro is set in Build. The Shape step shows "Context used" once. This is
   decision 0011's field, placed.

Consequence: PM app board updated; plan step 1.3 loses the phone board; CLAUDE.md names the
exception; docs/context.md next steps updated.
