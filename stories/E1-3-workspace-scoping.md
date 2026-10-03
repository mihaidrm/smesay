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
Built 2026-10-02; hardened the same day after the reviewer's audit (16 findings, 3 blocking:
a patch could move a row to another workspace, nothing tied the id to the session, the lint
rule had bypass spellings).

- src/db/queries/scoped.ts is the one place the workspace filter is written: `scoped(table)`
  returns list, get, count, create, update and remove, each with `where workspace_id = $1`
  (get, update and remove add the id). Create and update drop `id` and `workspaceId` from what
  they are given at runtime, so a request body cannot move a row or plant one under another
  workspace; a parent id of another workspace is refused by the composite keys (E1-2). An id
  that is not a uuid returns null instead of a database error. One file per table builds on
  it: projects, itemSets, items, instruments, invites, responses, answers, missingItems,
  insights, aiRuns. Later epics add their specific queries to these files. Rows are the plain
  objects Drizzle's select returns, typed `typeof table.$inferSelect` (the ready story's
  "plain objects, not Drizzle rows" meant exactly this: no ORM entity, no lazy loading).
- The workspace id is `WorkspaceId` (src/db/types.ts), a branded string that only
  src/lib/workspace.ts produces from the session, so a route cannot hand a URL or body value
  to a helper without a type error; `x as WorkspaceId` and `x as never` fail lint outside
  test files. `unsafeWorkspaceId()` in scoped.ts exists for the seed and the tests; lint
  refuses importing scoped.ts and internal.ts anywhere outside src/db (internal.ts also from
  src/lib/workspace.ts). Create and update keep only the table's columns (getTableColumns), so
  a body with unknown keys cannot produce an empty `set`; a non-uuid parent id is 404.
- workspaces.ts is scoped by membership (listForUser and getForUser join workspace_member and
  skip deleted_at, so requireWorkspace never hands out a deleted workspace's id); update takes
  a WorkspaceId and changes name, slug, accent and logo only (the AI budget is
  internal.setAiBudgetEur, decision 0036); markDeleted starts the
  removal; the owner-only role check is E2-4's. members.ts is keyed by (WorkspaceId, user_id).
  `workspaces.create` inserts the workspace and its owner in one transaction
  (orm.drizzle.team/docs/transactions). The helpers that take no session (getWorkspaceById,
  createEmptyWorkspace, hardDeleteWorkspace, for the seed and E11-2's job) live in
  internal.ts, outside the index barrel.
- src/lib/workspace.ts: `requireWorkspace(headers, workspaceId)` reads the session with
  better-auth's `auth.api.getSession({ headers })` (better-auth.com/docs/integrations/next)
  and calls `requireWorkspaceForUser` (internal.ts), which checks membership and returns the
  WorkspaceId; NotFoundError (404) for a non-member, a missing workspace or a non-uuid id,
  SignedOutError (401) for no session. The session path itself has no unit test: E2-1 signs
  in for real and its Playwright test covers it; E2 maps the errors to responses.
- The lint rules are a local plugin, eslint-rules/db-access.mjs: `db-access` resolves every
  import, export-from, dynamic import (string or template literal) and require call against
  the importing file and refuses anything that lands in src/db/ (except src/db/queries/<table>,
  src/db/queries and src/db/types), plus drizzle-orm, postgres, createRequire and
  `module.require`, and casts to WorkspaceId or never, on
  src/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts} outside src/db/** and src/lib/auth.ts;
  `no-db-reexport` refuses `export { db }` under any name, `export * from "@/db"`, a default
  export and `export const x = db` inside src/db/queries/. A function that returns the client
  would get past it: that is what the reviewer's reading of the folder is for (acceptance 5).
  src/db/queries/lint-rule.test.ts tries 30 refused and 10 allowed spellings through ESLint's
  lintText.
- Tests: vitest.config.mts points every test at "<database>_test" (DATABASE_URL rewritten,
  the given value kept as DATABASE_ADMIN_URL to create the test database) and runs test files
  one at a time (`fileParallelism: false`, vitest.dev/config/fileparallelism), because
  src/db/schema.test.ts drops and recreates the schema. src/db/index.ts refuses any database
  not named *_test while VITEST is set; src/db/test-db.ts also checks both hosts are local.
  src/db/queries/scoping.test.ts finds every scoped helper exported from index.ts by shape (a
  helper added later is checked, and needs a patch entry), builds workspace A and B with one
  row in every table through the helpers, snapshots every table of B, checks every helper with
  A's id (list, get, count, update, remove, non-uuid ids, a patch carrying id and workspaceId,
  create with a foreign parent, members, unknown keys, non-uuid parent ids), and compares B's
  snapshot afterwards; 24 tests.
