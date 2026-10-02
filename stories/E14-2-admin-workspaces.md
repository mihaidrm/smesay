# E14-2 Workspaces: what a workspace has, and the support actions

User: Mihai, answering "why can't I..." from a workspace owner
Status: ready
Outcome: one page per workspace with everything an admin needs to see to help, and the few
actions that help, each audited.

## Acceptance criteria
1. /admin/workspaces lists every workspace: name, slug, plan, created, owners' emails,
   members, projects, published instruments, responses this month, AI cost this month, last
   activity, deleted_at when set; searchable by name, slug or a member's email; sorted by last
   activity. Numbers come from E2-6's usage functions.
2. /admin/workspaces/[id] shows the workspace's settings as the owner sees them (name, accent,
   whether a logo is set, AI budget and spend, plan), the members with roles and the date
   they joined, the open invitations with their expiry, the projects with their status, item
   count and latest version, each project's instruments with state (draft, published, closed,
   revoked), link kind and dates, the uploads with size and date, and the last 20 product
   events of the workspace (E13-1). No respondent names and no answers on this page.
3. Actions, each with a confirm line and an audit row (E14-1): change the plan (E2-6's column
   change), set the AI budget, resend an open invitation, revoke a link (E6-4's kill switch,
   by the admin), restore a workspace marked deleted within the 24 hours (E11-2), and add a
   support note (free text, shown only here).
4. Every action runs through the same helpers the product uses (src/lib/members.ts,
   src/lib/plans.ts, the kill switch), never a direct table write, so the product's rules
   hold for admins too.
5. Tests: the list and the detail for a workspace with members, projects and an instrument;
   each action writes its audit row; a non-admin gets 404. Playwright: open a workspace, change
   its plan, see the audit row.

## Out of scope
- Editing a workspace's content (items, instruments, answers): never from the admin area.
- Billing and invoices: R3.

## Open questions
- None.

## Technical notes
The detail page composes the product's own query helpers with the admin's workspace id, so a
bug in a helper shows the same way to the owner and the admin. Support notes live in a small
admin_note table (workspace_id, admin user id, text, created_at). Written 2026-10-02
(decision 0035).
