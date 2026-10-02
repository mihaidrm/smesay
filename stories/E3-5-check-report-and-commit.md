# E3-5 Import check report and commit

User: a PM about to turn rows into items
Status: ready
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
ImportReport gains `unrecognisedValues: number` and `duplicateRefs: { kept: string, folded:
string[] }[]`; INTERFACES.md first (CLAUDE.md). The report is computed once on preview and
stored with the set so the import log (E3-6) shows the same numbers.
