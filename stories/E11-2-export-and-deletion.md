# E11-2 Data export and deletion per workspace, self-serve

User: a workspace owner leaving, or asked by their client to remove everything
Status: ready
Outcome: one click exports everything a workspace holds; one confirmed click deletes it all
within 24 hours and emails a confirmation.

## Acceptance criteria
1. Settings, Data: "Export everything" produces one zip with every project's JSON export
   (E10-2), the workspace settings, the members list and the logo; the download is logged.
2. "Delete this workspace": owner only; a confirm that asks the workspace name to be typed;
   sets deleted_at, signs every member out of it, and shows the page "This workspace was
   deleted on [DATE]. Its data is removed within 24 hours. Contact [OWNER EMAIL] if you did not
   expect this." to anyone opening it (docs/copy/errors.md).
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
workspace.deleted_at (docs/schema.md). Object deletion lists the workspace prefix in the
bucket. The job is idempotent and logs counts.
