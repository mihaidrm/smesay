# 0048 The PDF summary's registers stop at 20 rows, 2026-10-05

Mihai, answering the conflict between E10-3's outcome (about three pages for 200 items and 50
responses) and its acceptance 1 (every register row): "Pdf go with what you recommend."

Decision: in the PDF summary, each register (Different priority, Disagree, Unclear, Missing
items) shows its first 20 rows. Its heading keeps the full count, and under the table a line
says how many more there are and which CSV on the Export tab holds them ("And 27 more in the
Answers CSV on the Export tab."). The CSV files follow the same filter as the PDF, so every row
is still one click away. The item tables are not capped.

Consequences: the generated case of 200 items and 50 responses goes from 245 pages to 27, under
the 30 a deck takes; the over-30 note stays for longer lists and is tested in
export-download.test.ts. stories/E10-3 acceptance 1 amended; src/lib/export/summary.ts
(REGISTER_ROWS_MAX, register), summary-html.ts, summary.test.ts, e2e/export-summary.spec.ts;
design note 71 amended; docs/review-list.md rows answered.
