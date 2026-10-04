# Design note 70: a whole project out and in, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E10-2, under decision 0044.

## What was decided

- One JSON file, "smesay.project" version 1, read and written by code that names every field;
  the import checks the file with zod, strict objects, so a field the file should not have is
  refused rather than ignored. The JSON columns are checked too, each with the shape
  src/db/types.ts gives it, and the rules the database holds the rows to (unique versions and
  emails, text that is not blank, answers on their response's list, an action's state and date)
  are checked in code before the transaction, so the PM reads the damaged-file sentence, not
  the error page. A refusal no check foresaw rolls back: an integrity or data error (SQLSTATE
  classes 23 and 22) gets the same sentence, anything else (a lost connection) the error page;
  the log gets one line with the SQLSTATE, never the rows' values. Text is as long as the list
  import keeps it, with no NUL character; dates fall between 1970 and 9999; a dropdown has 2 to
  20 options, a personal invite a valid address, an instrument a title, as the app's forms
  require.
- Ids in the file are the old rows' ids, used as keys inside the file only; the import makes new
  ids and maps every reference, and refuses a file whose references point at rows it does not
  hold, before writing anything. The whole import is one transaction.
- No token, no passcode hash and no device token leaves the workspace. A personal invite's email
  and name do (the PM typed them), and the privacy policy says so (E11-3).
- The public link comes in revoked, so an imported project is not published until the PM
  publishes it. A personal invite keeps its state with a new token nobody has; after publishing,
  Remind sends a new link to the people who have not submitted, and Revoke then New link sends
  one to anyone.
  Revoking the personal invites too would drop the people not started yet from Results.
- An action's closer is written as their email and comes in with no closer (the person may not
  be a member of the new workspace); its date stays.
- The sample's file is refused: imported, its invented data would show without the watermark.
- The file limit is 5 MB, as an upload; the server action's 6 MB leaves room for the form's
  framing, so a larger file gets the app's sentence. The export is one line with no
  indentation, about 20 KB for the seed; at roughly 190 bytes an answer, a project of about
  25,000 answers is the largest that moves by file (docs/review-list.md).
- A response keeps only the fields its instrument asks for. Responses first submitted this
  month count toward the plan's monthly responses; a file that would pass them is refused.
- The board's project list gains Import a project beside New project; the import page is the
  app's one-field form layout (New project's), so it has no board of its own.

## Components added

- The Import a project page (projects/import), a file field and a button; the Whole project card
  on the Export tab. No new design-system component.

## Checks

- src/lib/export/project.test.ts, src/db/queries/projectTransfer.test.ts, e2e/project-transfer.spec.ts.
