# E3-4 Type or paste a list instead of uploading a file

User: a PM with a list in an email, a document or their head
Status: built
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
Built 2026-10-02.

- src/lib/import/paste.ts: the line parser (markers "1. ", "1) ", "(1) ", "a) ", hyphen,
  asterisk, bullet, dashes, middle dot, stacked, then whitespace; "text | area | value"),
  tested on the story's four markers and more in paste.test.ts. The rows have the shape of a
  file with three columns (Item, Area, Proposed value) and no header row, so the preview
  (src/lib/import/preview.ts, kind "pasted"), the mapping (guessed from those three names) and
  the import (E3-5, ImportRow in INTERFACES.md) read a pasted list like a file.
- src/lib/uploads.ts savePaste(): the sample refused, the 5 MB and 2,000-row limits of the
  upload, then the text stored as text/plain under uploads/<workspace id>/<16 hex>.txt and an
  upload row of kind "pasted" (UPLOAD_KINDS, migration 0008; the item_set source "pasted" is
  E3-5's) with the file name "Pasted list" for the log. Tested in uploads.test.ts.
- The box is src/app/app/(shell)/projects/[projectId]/import/paste-form.tsx under the file
  input (design note 22); pasteAction in projects/actions.ts. The preview shows "Pasted list,
  [N] items." and no pickers for a pasted upload.
- Lines over 1,000 characters are counted by the check report (E3-5, src/lib/import/
  report.ts, ITEM_LIMIT), which reads the same rows.
- Playwright: e2e/paste.spec.ts, six lines to the preview with the three columns and the
  guessed mapping; the import click of acceptance 5 joins the test with E3-5.
