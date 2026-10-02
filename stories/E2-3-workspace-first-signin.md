# E2-3 A workspace on first sign-in, naming it, switching between workspaces

User: a new PM who has just signed in; a PM who belongs to several workspaces
Status: built
Outcome: the first sign-in lands in a named workspace that already holds the sample project;
a second workspace appears in the switcher.

## Acceptance criteria
1. On the first sign-in with no membership, the app asks for a workspace name (default: the
   part of the email after the @, capitalised) and creates the workspace with the person as
   owner. The quickstart (E12-2) follows.
2. The new workspace holds the sample project "Sample project" with the Marlow Group rows
   from the seed (E1-4, decision 0027), marked is_sample, watermarked (E8-8). The project list
   shows it with the status "Sample" and "Created with the workspace" as its updated line (PM
   app board, Projects).
3. A person with two memberships sees a switcher in the sidebar header (workspace name with a
   chevron, as on the PM app board) and the current workspace in the breadcrumb. Switching
   changes every list on the next request; nothing from the other workspace stays on screen.
4. The current workspace is stored in the session, never in the URL alone (CLAUDE.md, Data and
   security; E1-3's `requireWorkspace()`). A URL with another workspace's id gets 404.
5. A person removed from a workspace while signed in lands on the switcher, or on the create
   page when it was their only one.
6. Playwright: sign in, name the workspace, see the sample project in the list.

## Out of scope
- Members and roles: E2-4. Settings: E2-5. Deleting a workspace: E11-2.
- The seed's "fixed workspace id" (E1-4) becomes a template: the seed inserts the sample under
  a new workspace id per workspace; E1-4's acceptance 4 is amended in that story's build.

## Open questions
- None.

## Technical notes
Built 2026-10-02.

- Tables workspace and workspace_member (docs/schema.md). Migration 0002 adds
  session.current_workspace_id, a better-auth additional field on the session
  (`session.additionalFields` in src/lib/auth.ts, better-auth.com/docs/concepts/database,
  "Extending core schema"; `input: false`, so no request body can set it). It is written only by
  `setCurrentWorkspace()` in src/lib/current-workspace.ts after `requireWorkspace()` has checked
  the membership, through the session adapter better-auth's organization plugin uses for its
  active organization (node_modules/better-auth/dist/plugins/organization/adapter.mjs). Every
  request reads it back and checks it against the memberships again (`getAppContext()`), so a
  switch changes every list on the next request and a removed membership drops out at once.
  No foreign key: a stale id is simply not current.
- First sign-in: src/app/app/new (the name defaults to the part of the email after the @,
  capitalised, src/lib/workspace-name.ts; validated on the server, 1 to 80 characters), the
  server action `createWorkspace` in src/app/app/actions.ts, which calls
  `createWorkspaceWithSample()` in src/db/queries/onboarding.ts: the workspace and its owner in
  one transaction, then the workspace's own copy of the sample through `seedSampleInto()`
  (src/db/seed/sample-seed.ts), named "Sample project", with fresh tokens; a failure removes the
  workspace again. The slug comes from the name; a taken one (SQLSTATE 23505) gets a 4 character
  suffix. The quickstart (E12-2) follows this step when it is built.
- The seed's fixed workspace id (E1-4) is now the test fixture only: `npm run db:seed` still
  creates "Marlow Group" with "New expense tool" for the tests and for a look at known rows, and
  every workspace made in the app gets its own copy. E1-4's acceptance 4 is amended accordingly.
- The shell is a route group, src/app/app/(shell): the sidebar's workspace block shows the name,
  or the design system's Select as the switcher when the person belongs to more than one
  workspace (src/app/app/(shell)/workspace-switcher.tsx; picking submits `switchWorkspace`, whose
  id is checked by `requireWorkspace()`, so another workspace's id is 404), the member count, the
  project list; the content column carries the workspace name as the breadcrumb and the Projects
  table (name, Sample pill, status, "Created with the workspace"). src/app/app/switch is the
  chooser for a membership without a current workspace (first visit after an invite, or the
  current one removed, with its own line); no membership at all goes to the create page.
- Tests: src/lib/workspace-name.test.ts (default name, slug, validation); src/db/seed/
  seed.test.ts (a second workspace gets its own copy with fresh tokens; the fixture keeps its
  numbers); src/lib/auth.test.ts and src/db/queries/scoping.test.ts run on migration 0002;
  e2e/workspace.spec.ts (sign in, the default name, the server-side error, create, the sample
  row, the create page sends a member back). Screenshots in design note 16.
- Copy: docs/copy/app.md (Workspace step, Signed-in shell) and errors.md (the name error).
- Not in this story: members and invites (E2-4), settings (E2-5), the quickstart (E12-2),
  the project counts and New project (E3-1), deleting the sample (E8-8).
