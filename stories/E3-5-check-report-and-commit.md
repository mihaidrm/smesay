# E3-5 Import check report and commit

User: a PM about to turn rows into items
Status: built
Outcome: empty rows, exact duplicates and long items are listed before anything is imported,
then one click creates the items.

## Acceptance criteria
1. The check card (PM app board, Import) shows before commit: "[N] empty rows, skipped. [N]
   exact duplicates, imported once. [N] items over 1,000 characters, imported whole; consider
   splitting them in Shape." plus the unrecognised proposed values line from E3-3. Each count
   expands to the rows concerned.
2. Exact duplicate means identical text after trimming and collapsing whitespace, case kept;
   the duplicate rows fold into the first and their references are listed on the kept item
   (item.flags.duplicateOf is for E4's fuzzy duplicates; exact ones never become items).
3. Commit creates the item_set (version 1, source, filename, import_report as ImportReport in
   INTERFACES.md) and the items with position, source_ref, original_text, area, proposed value
   and custom fields, in one transaction. A failure mid-way imports nothing.
4. A unit test runs the report over a fixture with 3 empty rows, 2 duplicates and 1 long item
   and checks the counts and the kept references; a second test checks the transaction rolls
   back on a bad row.
5. After commit the stepper moves to Shape and the Results step shows "0 of 0" responses.

## Out of scope
- Versions after the first: E3-6.

## Open questions
- None.

## Technical notes
Owns, from E3-3: the "Import [N] items" button (disabled at 40 percent without a text column,
E3-3 acceptance 1), the import click between the two uploads of E3-3 acceptance 5 in
e2e/import.spec.ts, and the `{ [header]: value }` shape of item.custom (E3-3 acceptance 2).
From E3-4: the import click of its acceptance 5.
ImportReport gains `unrecognisedValues: number` and `duplicateRefs: { kept: string, folded:
string[] }[]`; INTERFACES.md first (CLAUDE.md). The report is computed once on preview and
stored with the set so the import log (E3-6) shows the same numbers.

Built 2026-10-02.

- src/lib/import/report.ts: the pure check over the data rows with the mapping (acceptance 1
  and 2): empty rows skipped, exact duplicates (trimmed, whitespace collapsed, case kept)
  folded into the first with their references, items over ITEM_LIMIT (1,000) kept whole,
  proposed values not recognised (src/lib/import/values.ts) kept as written and counted.
  report.test.ts runs the fixture of acceptance 4 (3 empty, 2 duplicates, 1 long, 1 not
  recognised) and checks the counts and the kept references.
- src/lib/imports.ts: checkUpload() re-reads the stored file (the preview keeps ten rows) and
  runs the check; commitUpload() runs it again and writes the set through
  src/db/queries/importCommit.ts: one transaction, the project row locked, version max + 1
  (E1-2: never renumbered), item_set.source from the upload's kind, source_filename (null for
  a pasted list), import_report, imported_by and upload_id (migration 0008), then the items
  with position, source_ref, original_text, area, proposed_value and custom
  (`{ [header]: value }`, E3-3 acceptance 2). importCommit.test.ts proves the rollback on a
  bad row (acceptance 4) and that another workspace gets nothing; imports.test.ts checks a
  stored csv end to end, a pasted list as version 2, and the two refusals.
- The check card and the Import button are design note 23; commitAction in
  projects/actions.ts. The stepper reads the latest set in the project frame: Import done,
  Shape current (acceptance 5); "0 of 0" is the project list's Responses cell.
- Playwright: e2e/import.spec.ts (the Marlow fixture: the counts, the import, the imported
  line, the stepper) and e2e/paste.spec.ts (six pasted lines imported), which also close the
  import clicks owed to E3-3 and E3-4.
- Audit of 2026-10-02 (fresh context, 21 findings), closed in the story's PR: the same upload
  could be committed again and again (now refused on the server with a message, and
  item_set.upload_id is unique, migration 0009; tested); the folded references were not on
  the kept item (item.flags.foldedRefs, shown on the version page); the item text was stored
  collapsed (now the cell's text, collapsed only for the duplicate key); csv blank lines were
  dropped so row numbers drifted (kept now); the header rule change recorded in E3-2; the
  "nothing to import" message has a next step; INTERFACES.md lists the helpers; the
  citation for `.for("update")` points at the drizzle types. Open for Mihai: acceptance 5's
  "Results step shows 0 of 0 responses" (design note 23).
