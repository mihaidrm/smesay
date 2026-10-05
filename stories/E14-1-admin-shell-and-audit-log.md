# E14-1 Admin shell and the audit log

User: Mihai, helping a workspace that wrote in
Status: built
Outcome: one /admin area with a navigation, served only to the admin emails, where every
action an admin takes is recorded and listed.

## Acceptance criteria
1. /admin is served only to the emails in ADMIN_EMAILS (comma separated, the rule of E13-2);
   anyone else, signed in or not, gets 404, not 403. A missing variable means the area does
   not exist. The admin check is one function in src/lib/admin.ts, used by every admin page
   and action.
2. The shell has a left navigation with Overview (E13-2's funnel and usage), Workspaces
   (E14-2), People (E14-3) and Audit log (this story), the signed-in admin's email, and a
   "Back to the app" link. Each item arrives with its page (amended 2026-10-05, design note
   85), so the nav never links to a page that does not exist yet. It uses the PM app's design system; desktop only, like the PM
   side (decision 0020).
3. Every admin action (the ones E14-2 to E14-4 add) writes one row to an admin_audit table:
   admin user id, action name, target workspace id or user id, a short JSON of what changed
   (never a secret, never respondent text), created_at. The row is written before the action
   runs and the action runs only when the row is in, so an action without its row cannot
   happen; the row then records the outcome: done, refused or failed (amended 2026-10-05,
   design note 85: one transaction around the product's helpers could not take back an email
   already sent, and broke helpers that recover from a database error).
4. /admin/audit lists the rows newest first, 50 per page, with the admin's email, the action,
   the target's name (or "deleted") and the time; filter by workspace and by admin.
5. A test proves a non-admin email gets 404 on every admin route and that an admin action
   whose audit row is refused does not run. Playwright: an admin sees the shell and the audit page;
   another email gets 404.

## Out of scope
- Roles among admins (owner admin versus support admin): one level in R1.
- Alerts, email digests: not in R1.

## Open questions
- None.

## Technical notes
Queries in src/db/queries/admin.ts (started by E13-2), the one module that reads across
workspaces; the lint rule refuses it everywhere except the admin pages and actions. The
admin_audit table has no workspace_id of its own (the target is a column); the schema test
lists it as the one exception besides the auth tables. Written 2026-10-02 (decision 0035).
