# E2-4 Invite a member by email; owner and member roles

User: the workspace owner adding a colleague; the colleague joining
Status: ready
Outcome: a member can create and run projects; only an owner can change the workspace itself.

## Acceptance criteria
1. Settings, Members (PM app board): a list of name, email, role, joined date; an email field
   with "Invite"; the button is disabled at 40 percent until the field holds an address. An
   address already in the workspace shows "[EMAIL] is already a member of this workspace."
2. An invited address gets a sign-in link (E2-1's email) and, on sign-in, joins the workspace
   as a member. Until then the row shows "Invited". The invite expires with the link; inviting
   again sends a new one.
3. Roles: owner and member (INTERFACES.md, MemberRole). A member can create projects, import,
   shape, build, share, read results and export. A member cannot rename or delete the
   workspace, change the accent, logo or AI budget, invite or remove members, or change
   billing when it exists. The server refuses, not only the UI: a test calls each owner action
   as a member and gets 403.
4. An owner can remove a member (not themselves while they are the last owner). The removed
   person's sessions lose the workspace on the next request (E2-3, acceptance 5).
5. Playwright: owner invites, the invitee signs in through Mailpit, appears as a member.

## Out of scope
- Team roles beyond owner and member: R2 (docs/plan-steps.md, Phase 5).
- Transferring ownership: not in R1; a second owner can be made by changing a role in
  Settings, which this story includes.

## Open questions
- None.

## Technical notes
Permission check in one place, src/lib/permissions.ts: `can(role, action)` with the action list
above; every owner-only route calls it. The invite is a better-auth magic link sent to the
address with a pending membership row (workspace_member with role and a `joined_at` null is
not in schema v1; add `invited_at` and nullable `joined_at` in migration 0002 and record it in
docs/schema.md through the generator).
