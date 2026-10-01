# E1-3 Workspace scoping and the cross-workspace test

User: Claude, writing every query after this; the reviewer, auditing against SECURITY.md
Status: ready
Outcome: no query can reach another workspace's rows, and a test proves it on every run.

## Acceptance criteria
1. Every data access goes through a helper in src/db/queries/ that takes `workspaceId` as its
   first argument and adds `where workspace_id = $1` (or the join to a scoped parent) itself.
   No route or page builds a query on `db` directly; an ESLint rule (no-restricted-imports of
   `@/db` outside src/db/) fails lint when one does.
2. The workspace id comes from the session, never from the request body or the URL alone:
   `requireWorkspace()` reads the session, checks membership, and returns the id the helpers
   use. A request for a workspace the user is not a member of gets 404, not 403, so the
   workspace's existence is not leaked.
3. A Vitest test creates workspace A and workspace B with one project, one item set, one
   instrument, one invite and one response each, then proves with A's id that every helper
   returns nothing from B: list, get by id, update, delete, and the count. The test runs in CI
   against a Postgres service container.
4. The same test proves B's rows are untouched after A's update and delete calls (counts and
   contents compared before and after).
5. The reviewer agent's checklist (SECURITY.md, Multi-tenancy) is satisfied by reading
   src/db/queries/ alone.

## Out of scope
- Sessions and sign-in themselves: E2. Until then the test and the seed create sessions by
  inserting rows; `requireWorkspace()` has the real implementation in E2 and a test double
  here.
- Respondent-side access by token: E7, with its own rule (token, not session).

## Open questions
- None.

## Technical notes
Helpers return plain objects, not Drizzle rows, so later layers do not depend on the ORM
shape. One file per table (workspaces.ts, projects.ts, itemSets.ts, items.ts, instruments.ts,
invites.ts, responses.ts, answers.ts, insights.ts). Counting and aggregation stay in SQL
(CLAUDE.md, dashboard rules). CI: .github/workflows/ci.yml adds a `services: postgres:
16-alpine` block with the same user, password and database as docker-compose.yml, and
DATABASE_URL already points at it. Vitest gets a `globalSetup` that runs the migrations once.
