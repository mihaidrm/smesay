# Design note 86: the admin Workspaces pages, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E14-2, under decision 0044.

## What was decided

- The list shows every workspace, the deleted ones too with "Deleted [date]" under the name,
  so an owner who deleted by mistake can be found and restored. Search is a GET form (?q=)
  matching the name, the slug or a member's email; % and _ are matched as typed.
- The workspace page is one column of cards: Marked deleted (only then, with Restore), Settings
  and AI budget side by side, Members, Open invitations, Projects with their instruments,
  Uploads, the last 20 product events, Support notes. No respondent names and no answers.
- Every action is a small form with a confirm line (new to the design system: the confirm form,
  src/app/admin/workspaces/[id]/confirm-form.tsx). The first press shows the line with Confirm
  and Cancel in a tinted row; Confirm sends the form; the answer shows under it. The line names
  what was picked, so a plan chosen in the select is the plan named. A prevented submit does not
  run the form's action (react-dom, the form action's listener checks defaultPrevented).
- An instrument's state: Draft until published; then its public link decides: Revoked, Closed
  (the close date passed) or Published. "Links" says public and the count of personal links.
- The actions go through the product's helpers: workspaces.setPlan (a deleted workspace keeps
  its plan until restored), internal.setAiBudgetEur through setAiBudget in the admin module, a
  resend that shares inviteMember's sender and limit (sendWorkspaceInvite) and keeps the first
  sender, revokeLink (E6-4's refusals hold: an already revoked link is refused) and a new
  workspaces.restoreDeleted, which works only while the row is still marked deleted. A note's
  text stays out of the audit row, which records its length.
- The plans' names are written in the copy file, with a test that they equal src/lib/plans.ts,
  because the confirm form is a client component and plans.ts reaches the database.

## Why

Story E14-2 asks for everything an admin needs to answer "why can't I..." and the few actions
that help, each audited, with the product's rules holding for admins too.

## Rejected

- Linking a deleted workspace's members to People: People arrives with E14-3.
- Editing a workspace's content: out of scope in the story.
