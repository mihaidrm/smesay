# E2-3 A workspace on first sign-in, naming it, switching between workspaces

User: a new PM who has just signed in; a PM who belongs to several workspaces
Status: ready
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
Tables workspace and workspace_member (docs/schema.md). The sample is inserted by the same
function the seed uses (src/db/seed/sample.ts), called with the new workspace id. The switcher
is a shadcn Select restyled per docs/design-system.md. Slugs are derived from the name and
made unique with a short suffix.
