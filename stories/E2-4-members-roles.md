# E2-4 Invite a member by email; owner and member roles

User: the workspace owner adding a colleague; the colleague joining
Status: built
Outcome: a member can create and run projects; only an owner can change the workspace itself.

## Acceptance criteria
1. Settings, Members (PM app board): a list of name, email, role, joined date; an email field
   with "Send invite"; the button is disabled at 40 percent until the field holds an address. An
   address already in the workspace shows "[EMAIL] is already a member of this workspace."
2. An invited address gets a sign-in link (E2-1's email) and, on sign-in, joins the workspace
   as a member. Until then the row shows "Invited". The invite expires with the link; inviting
   again sends a new one.
3. Roles: owner and member (INTERFACES.md, MemberRole). A member can create projects, import,
   shape, build, share, read results and export. A member cannot rename or delete the
   workspace, change the accent or logo, invite or remove members, or change billing when it
   exists. (The AI budget is nobody's in the workspace: the admin area, E14-2, decision 0036.) The server refuses, not only the UI: a test calls each owner action
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

- Permission check in one place, src/lib/permissions.ts: `can(role, action)` over the fifteen
  actions of acceptance 3, eight of them owner-only (the budget left with decision 0036); `requireRole()` in src/lib/members.ts reads
  the actor's membership and throws ForbiddenError (403, src/lib/errors.ts). The three actions
  (invite, remove, change a role) live in src/lib/members.ts and are called by the server
  actions in src/app/app/(shell)/settings/actions.ts, which turn a refusal or a message into
  form state; src/lib/members.test.ts calls each one as a member and gets 403.
- The pending invitation is its own table, workspace_invite (migration 0003, docs/schema.md
  through the generator), not columns on workspace_member as this story first said: a member row
  is keyed by a user id and the invitee has none until they sign in. One open invitation per
  address and workspace; inviting again replaces the row and sends a new link. The invite email
  is E2-1's, sent through `auth.api.signInMagicLink` (node_modules/better-auth/dist/plugins/
  magic-link/index.d.mts). That server call bypasses better-auth's own rate limiter, which runs
  in the request handler only, so a workspace sends at most 5 invitations per 10 minutes
  (src/lib/invites.ts); above that the form says so. An invitation is valid for 15 minutes, as
  long as the link (`INVITE_VALID_MINUTES` in src/lib/invites.ts); after that the "Invited" row
  is gone and the owner invites again. Open for Mihai (raised 2026-10-02): a longer validity
  and a dedicated invite email; both are one constant and one entry in docs/copy/emails.md.
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
- The last owner is kept inside one transaction with the workspace's member rows locked
  (members.removeKeepingOwner and setRoleKeepingOwner, src/db/queries/members.ts), so two
  owners demoting each other at once cannot leave none. Of the eight owner-only actions, this
  story enforces the three it builds (invite, remove, role); rename, accent and logo
  are enforced by E2-5, delete by E11-2 and billing by R3, each through can() with a test that
  calls the action as a member and gets 403 (the criterion is in those stories).
- Tests: src/lib/permissions.test.ts; src/lib/members.test.ts (invite writes the row and sends
  the email; empty, bad and duplicate addresses as messages; a repeated invite replaces the
  row; the limit; 403 for a member on all three actions; 404 for an outsider; acceptance once
  and an expired invitation ignored; the last owner kept; a removed person has no workspace on
  the next request and is "no longer a member" to a second removal); scoping.test.ts covers the
  new table; e2e/members.spec.ts (owner invites from Settings, the invitee opens the link from
  the invite email, lands in the workspace, appears as a member, is removed and lands on the
  create page). Design note 17 has the screenshots.
- Audit of 2026-10-02 (fresh context, 14 findings): the blocking one (the invite bypassed
  better-auth's rate limiter) and the should-fix ones (the last owner only kept between
  sequential actions; emails.md still said the sign-in email went to nobody else; the browser
  test did not open the invite email; six owner-only actions had no story carrying the 403
  rule; refusals other than 403 became the error page; copy and field details) were closed the
  same day in the pull request after the story's. Left open for Mihai: the 15 minute validity
  and the invite email (above); whether SECURITY.md's "rotation on privilege change" covers a
  workspace role (roles are read from the database on every action, so nothing goes stale);
  an invitation is accepted on any signed-in request of the invited address, not only at
  sign-in, which matters more if the validity grows.
- Copy: docs/copy/app.md (Settings, Members) and errors.md.
