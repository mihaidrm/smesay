# Design note 70: a whole project out and in, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E10-2, under decision 0044.

## What was decided

- One JSON file, "smesay.project" version 1, read and written by code that names every field;
  the import checks the file with zod, strict objects, so a field the file should not have is
  refused rather than ignored.
- Ids in the file are the old rows' ids, used as keys inside the file only; the import makes new
  ids and maps every reference, and refuses a file whose references point at rows it does not
  hold, before writing anything. The whole import is one transaction.
- No token, no passcode hash and no device token leaves the workspace. A personal invite's email
  and name do (the PM typed them), and the privacy policy says so (E11-3).
- The public link comes in revoked, so an imported project is not published until the PM
  publishes it. A personal invite keeps its state with a new token nobody has; reminders need
  the public link live, so none go out; after publishing, the PM sends each person a new link.
  Revoking the personal invites too would drop the people not started yet from Results.
- An action's closer is written as their email and comes in with no closer (the person may not
  be a member of the new workspace); its date stays.
- The sample's file is refused: imported, its invented data would show without the watermark.
- The file limit is 6 MB, the server action's body limit.

## Components added

- The Import a project page (projects/import), a file field and a button; the Whole project card
  on the Export tab. No new design-system component.

## Checks

- src/lib/export/project.test.ts, src/db/queries/projectTransfer.test.ts, e2e/project-transfer.spec.ts.
