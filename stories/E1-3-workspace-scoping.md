# E1-3 Workspace scoping and the cross-workspace test

User: Claude, writing every query after this; the reviewer, auditing against SECURITY.md
Status: built
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
Built 2026-10-02.

- src/db/queries/scoped.ts is the one place the workspace filter is written: `scoped(table)`
  returns list, get, count, create, update and remove, each with `where workspace_id = $1`
  (get, update and remove add the id). One file per table builds on it: projects, itemSets,
  items, instruments, invites, responses, answers, missingItems, insights, aiRuns. Later
  epics add their specific queries to these files. Rows are Drizzle's plain objects, typed
  `typeof table.$inferSelect`.
- workspaces.ts is scoped by membership (list and get take the user id and join
  workspace_member; deleted_at hides a workspace everywhere); members.ts is keyed by
  (workspace_id, user_id). `workspaces.create` inserts the workspace and its owner in one
  transaction.
- src/lib/workspace.ts: `requireWorkspace(userId, workspaceId)` checks membership and throws
  NotFoundError (404) for a non-member or a missing workspace, SignedOutError (401) for no
  user. `requireWorkspaceFromRequest(headers, workspaceId)` reads the session with better-auth's
  `auth.api.getSession({ headers })` (better-auth.com/docs/integrations/next) and calls it; E2
  wires the routes and the Playwright test of the signed-in path.
- The lint rule is in eslint.config.mjs: no-restricted-imports with a regex for "@/db",
  "@/db/schema", "@/db/auth-schema" and their relative forms, and a group for drizzle-orm and
  postgres, on src/**/*.{ts,tsx} except src/db/** and src/lib/auth.ts (the adapter needs the
  client). "@/db/queries/*" and "@/db/types" stay allowed. src/db/queries/lint-rule.test.ts
  proves it with ESLint's Node API (lintText).
- Tests: vitest.config.mts points every test at "<database>_test" (DATABASE_URL rewritten,
  the given value kept as DATABASE_ADMIN_URL to create the test database) and runs test files
  one at a time (`fileParallelism: false`, vitest.dev/config/fileparallelism), because
  src/db/schema.test.ts drops and recreates the schema. src/db/test-db.ts refuses a database
  whose name does not end in _test or whose host is not local. src/db/queries/scoping.test.ts
  builds workspace A and B with one row in every table (through the helpers, their first
  caller) and checks every helper with A's id, then B's rows for equality; 14 tests.
