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
  src/app/admin/confirm-form.tsx, shared with People). The first press shows the line with
  Confirm and Cancel in a tinted row and makes the form's fields inert until one is pressed, so
  the plan or amount sent is the one the line named; Confirm sends the form; the answer shows
  under it. The action runs from the submit handler in a transition, not as the form's action,
  so a refusal keeps what was typed; after a done line the fields go back to their defaults.
- A malformed form (an unknown plan, a budget that is not a whole number, ids that are not
  uuids, an empty or long note) is not an action and writes no audit row. Everything that
  depends on the workspace's state is decided inside the audited action, so it is a refused
  row: the plan or budget it already has, a workspace marked deleted, a restore of a live one, a
  link or invitation that is not this workspace's.
- A workspace marked deleted takes only Restore, the budget and a note: its plan, invitations
  and links stay as they are, as a PM can do nothing in it. Send again and Revoke are not shown
  there.
- Invitations waiting lists every invitation not accepted, the expired ones marked, so one that
  "did not work" an hour ago can be sent again. Revoke shows only where the product would do it;
  on the sample, an archived project or a replaced instrument the reason shows instead.
- An instrument's state: Draft until published; then its public link decides: Revoked, Closed
  (the close date passed) or Published. "Links" says public and the count of personal links.
- The actions go through the product's helpers: workspaces.setPlan (a deleted workspace keeps
  its plan until restored), internal.setAiBudgetEur through setAiBudget in the admin module, a
  resend that shares inviteMember's sender and limit (sendWorkspaceInvite) and keeps the first
  sender (the earlier sign-in link still works until it expires: it is its own better-auth
  verification row), revokeLink (E6-4's refusals hold: an already revoked link is refused) and a
  new workspaces.restoreDeleted, which works only while the row is still marked deleted; members
  who left the deleted workspace do not come back with it. A note's
  text stays out of the audit row, which records its length.
- The plans' names are written in the copy file, with a test that they equal src/lib/plans.ts,
  because the confirm form is a client component and plans.ts reaches the database.

## Why

Story E14-2 asks for everything an admin needs to answer "why can't I..." and the few actions
that help, each audited, with the product's rules holding for admins too.

## Rejected

- Editing a workspace's content: out of scope in the story.
