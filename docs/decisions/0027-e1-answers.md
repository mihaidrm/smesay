# 0027 E1 answers: migration acceptance and seed scope, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01 ("for both we go with what you
recommend"), on Claude's proposals in stories/E1-2 and E1-4.

1. The migration acceptance in the business plan (page 9), "applies to an empty database and
   rolls back", becomes: applies from an empty database; a second apply is a no-op; CI drops
   and recreates the test database on every run. drizzle-kit has no down-migration command,
   and a hand-written down script would be untested code on the critical path.
2. The seed carries the full Marlow Group sample: items, instrument, invites, the 7 responses
   with answers, reasons, questions and confidences, the missing item and the 4 insights. The
   dashboard (E8) and the exports (E10) are tested against these rows, and the reconciliation
   rule ("every number matches the CSV to the row") needs real rows.

Consequence: stories E1-2 and E1-4 have no open questions; Phase 2 is complete; E1-2 is the
first story to build.
