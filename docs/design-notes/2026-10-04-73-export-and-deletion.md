# Design note 73: export everything and delete a workspace, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E11-2, under decision 0044.

## What was decided

- Export everything is owner only (a new permission, workspace.export), as Delete is: the zip
  holds the members' emails and every project. It is built in memory with a ZIP writer on
  Node's zlib (deflate and crc32, the PKWARE APPNOTE layout), so no package is added; a
  workspace's export is far under ZIP's 4 GB without ZIP64.
- Delete marks the workspace (deleted_at, deleted_by). It leaves every read at once; members
  keep their sessions and other workspaces. A member whose current workspace it was lands on
  the deleted page until they choose to leave it, so nobody is moved silently into another
  workspace.
- The removal job deletes objects first, then rows, so a stopped job leaves the marked row for
  the next run; it is idempotent. It emails only the owner who deleted the workspace.
- A deleted workspace's links read as revoked in one place (links.byToken), so every
  respondent page and write already handles them; a revoked sample link is inactive too.

## Components added

- Settings, Data: a card with the export download (the Export tab's download component) and a
  form with the typed name and a destructive button. The deleted page uses the chooser's frame.

## Checks

- src/lib/export/zip.test.ts, src/lib/workspace-data.test.ts, src/db/queries/removal.test.ts,
  e2e/workspace-data.spec.ts.
