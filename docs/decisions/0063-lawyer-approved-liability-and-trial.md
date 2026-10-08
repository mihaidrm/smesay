# 0063 The lawyer approved the liability cap and the free trial paragraph, 2026-10-08

Mihai, 2026-10-08, on the two terms paragraphs changed earlier that day (PR 171: liability
capped at the fees paid in the 12 months before the event, nothing to claim on the free plan,
paying after a free trial as acceptance of every section): "yes lawyer agreed".

Decision:
- The two "[LAWYER: ...]" markers on docs/legal/terms.md are removed. The text stays as
  written. docs/legal/lawyer-review.md records the approval under L24 and L28.
- The terms stay version 4, dated 2026-10-08: no version 4 was ever shown to a user, so the
  day's three changes (company details, the cap, the trial) are one version.
- The identity paragraph of E5-7 (decision 0059) still keeps its marker until the lawyer reads
  it. `npm run legal:markers` lists 0 on the four pages on main.

Consequences: docs/accounts.md step 12; stories/E11-3; scripts/legal-markers.mjs;
src/lib/legal.test.ts expects no marker on any page; docs/review-list.md row.
