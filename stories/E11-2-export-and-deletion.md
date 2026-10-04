# E11-2 Data export and deletion per workspace, self-serve

User: a workspace owner leaving, or asked by their client to remove everything
Status: built
Outcome: one click exports everything a workspace holds; one confirmed click deletes it all
within 24 hours and emails a confirmation.

## Acceptance criteria
1. Settings, Data: "Export everything" produces one zip with every project's JSON export
   (E10-2), the workspace settings, the members list and the logo; the download is logged.
2. "Delete this workspace": owner only through `can()` (E2-4, workspace.delete; a test calls
   it as a member and gets 403); a confirm that asks the workspace name to be typed;
   sets deleted_at, signs every member out of it, and shows the page "This workspace was
   deleted on [DATE, HH:MM] UTC. Its data is removed within 24 hours. Contact [OWNER EMAIL] if
   you did not expect this." to anyone opening it (docs/copy/errors.md; no contact sentence when
   the deleting owner's account is gone).
3. A removal job (`npm run jobs:purge`, run by cron at the launch gate and by hand locally)
   deletes every row and every object in the bucket under the workspace within 24 hours of
   deleted_at, in the order decision 0028 sets (responses first, then projects, then the
   workspace), and sends the owner one email: "Everything in [WORKSPACE] was deleted on
   [DATE]." A test creates a full workspace, deletes it, runs the job and finds zero rows and
   zero objects.
4. Respondent links of a deleted workspace show the inactive page from the moment of
   deletion.
5. The privacy policy (E11-3) describes both actions and the 24 hours.

## Out of scope
- Deleting a single project: archived instead (decision 0028). Deleting a user account across
  workspaces: better-auth's user row is removed when the last membership goes, decided in
  E11-3's policy text.

## Open questions
- None.

## Technical notes
workspace.deleted_at (docs/schema.md). Object deletion lists the workspace's segment under
each prefix in the bucket: logos/<workspace id>/ (E2-5) and uploads/<workspace id>/ (E3-2);
a new prefix adds a line here. The job is idempotent and logs counts.

Built 2026-10-04 (design note 73, decision 0044):
- Acceptance 1: Settings, Data (owners only) has Export everything: GET /api/workspace/export
  returns one zip (src/lib/export/zip.ts, written on Node's zlib, no new package) with
  projects/[NNN]-[PROJECT].json for every project (E10-2's file), workspace.json, members.csv
  and logo/[FILE]; the download writes an export_log row with file "workspace" and no project
  (migration 0026 makes project_id nullable). src/lib/workspace-data.test.ts reads the zip back.
- Acceptance 2: Delete this workspace asks for the workspace's name; the server checks the role
  (can(), workspace.delete; a member is refused, tested) and the name, then sets deleted_at and
  deleted_by (migration 0026). Every member loses the workspace from every read at once and,
  whatever workspace they were in and in any new session, sees the deleted page (/app/deleted,
  src/lib/current-workspace.ts) with the date and the deleting owner's email until they press Go
  to your workspaces, which ends their membership of it. The sessions are not ended: the member
  keeps their other workspaces. A deleted workspace takes no new member from an open invitation.
- Acceptance 3: `npm run jobs:purge` (scripts/jobs-purge.ts, src/lib/workspace-removal.ts)
  deletes the objects under logos/[ID]/ and uploads/[ID]/, then the rows in decision 0028's
  order in one transaction, and emails the owner who deleted it inside that transaction, so a
  failed email puts the rows back for the next run (docs/copy/emails.md, email 6). A workspace
  that fails is logged with its id and the step and the job goes on to the next.
  src/db/queries/removal.test.ts builds a full workspace, deletes it, runs the job and finds zero
  rows in every table and zero objects, one email, and nothing on a second run.
- Acceptance 4: links.byToken reads a deleted workspace's links as revoked from the moment of
  deletion, and the writes' re-read under the invite lock does the same, so every respondent
  page shows the inactive page (the sample's link too) and every write is refused
  (e2e/workspace-data.spec.ts).
- Acceptance 5: the privacy policy is E11-3's; its story already names the 24 hours, and this
  story's two actions are listed there (docs/review-list.md).
- Playwright: e2e/workspace-data.spec.ts exports the zip, deletes by the typed name, sees the
  deleted page and the inactive link, and leaves to the create page.
