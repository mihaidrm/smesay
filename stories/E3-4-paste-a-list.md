# E3-4 Type or paste a list instead of uploading a file

User: a PM with a list in an email, a document or their head
Status: ready
Outcome: paste one item per line and get the same import as a file (decision 0010).

## Acceptance criteria
1. Import offers "Paste a list" beside the upload. A textarea takes one item per line;
   leading numbers, bullets and dashes are stripped (unit test with "1. ", "- ", "• ", "a)").
2. Fewer than two non-empty lines: "Paste at least two lines, one item per line." Lines over
   1,000 characters are imported whole and counted in the check report (E3-5).
3. A pasted line of the form "text | area | value" (pipe separated) fills area and proposed
   value; this is explained in one line under the box. Everything else is item text only.
4. The pasted set is stored as source "pasted" with the pasted text kept as the source file in
   the bucket, so the import log can show it.
5. Playwright: paste six lines, see them in the preview, import.

## Out of scope
- Rich text, tables from Word: the file path.

## Open questions
- None.

## Technical notes
Shares the preview and check report with E3-2 and E3-5: pasting produces the same row shape
(`ImportRow { ref?, text, area?, value?, custom? }`, added to INTERFACES.md) that the file
parser produces.
