# E2-4 Invite a member by email; owner and member roles

User: the workspace owner adding a colleague; the colleague joining
Status: built
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
Built 2026-10-02.

- Permission check in one place, src/lib/permissions.ts: `can(role, action)` over the sixteen
  actions of acceptance 3, nine of them owner-only; `requireRole()` in src/lib/members.ts reads
  the actor's membership and throws ForbiddenError (403, src/lib/errors.ts). The three actions
  (invite, remove, change a role) live in src/lib/members.ts and are called by the server
  actions in src/app/app/(shell)/settings/actions.ts, which turn a refusal or a message into
  form state; src/lib/members.test.ts calls each one as a member and gets 403.
- The pending invitation is its own table, workspace_invite (migration 0003, docs/schema.md
  through the generator), not columns on workspace_member as this story first said: a member row
  is keyed by a user id and the invitee has none until they sign in. One open invitation per
  address and workspace; inviting again replaces the row and sends a new link. The invite email
  is E2-1's, sent through `auth.api.signInMagicLink` (node_modules/better-auth/dist/plugins/
  magic-link/index.d.mts). An invitation is valid for 15 minutes, as long as the link
  (`INVITE_VALID_MINUTES` in src/lib/invites.ts); after that the "Invited" row is gone
  and the owner invites again.
- On the invitee's first signed-in request, `acceptPendingInvites()` (src/db/queries/
  onboarding.ts, called from src/lib/current-workspace.ts with the session's own email) turns
  every open invitation for that address into a membership in one transaction; with one
  membership the workspace is selected without asking (E2-3), so the invitee lands on its
  project list.
- Settings, Members (src/app/app/(shell)/settings): the list (name or "No name yet", email, role,
  joined), the "Invited" rows, the invite form (button at 40 percent until the field holds an
  address, the same zod rule as the server), a native select for the role and Remove on each row
  for owners; the last owner's row has neither. A member sees the list only. E2-5 adds the rest
  of the settings page above the section; a second owner is made by changing a role here.
- Tests: src/lib/permissions.test.ts; src/lib/members.test.ts (invite writes the row and sends
  the email; bad and duplicate addresses as messages; 403 for a member on all three actions;
  404 for an outsider; acceptance once and an expired invitation ignored; the last owner kept;
  a removed person has no workspace on the next request); scoping.test.ts covers the new table;
  e2e/members.spec.ts (owner invites from Settings, the invitee signs in through Mailpit and
  lands in the workspace, appears as a member, is removed and lands on the create page).
  Design note 17 has the screenshots.
- Copy: docs/copy/app.md (Settings, Members) and errors.md.
