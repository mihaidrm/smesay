# E1-1 Repository, lint, tests and CI

User: Mihai and Claude, building the app
Outcome: every push is checked the same way, on the PC and on GitHub, before anything is merged.

Status: done 2026-10-01 in Phase 2 (steps 2.1, 2.2 and 2.5; docs/setup.md). Kept here so the
E1 list matches the business plan (page 9).

## Acceptance criteria
1. `npm run lint` and `npm test` pass on the empty app. Checked: lint 0 problems, 19 unit
   tests, on Mihai's PC and in CI.
2. CI runs lint, typecheck, the copy scan, the status check, unit tests, build and the
   Playwright tests on every push and pull request. Checked: .github/workflows/ci.yml, runs 1
   to 19 green.
3. The pre-commit hook refuses a commit when status is stale, a retired term survives, a
   reference is broken or the copy scan fails. Checked: it refused the first attempt at the
   decision 0022 commit.
4. `npm install`, `docker compose up -d` and `npm run dev` give a running app on a machine
   with Node 22 or newer and Docker. Checked on Mihai's Windows PC, Node 26.

## Out of scope
- Deploy: E1-5, deferred to the launch gate (decision 0006).
- A database job in CI: E1-3 adds Postgres as a service when the first query runs in a test.

## Open questions
- None.

## Technical notes
Next.js 16.3.8, TypeScript, Tailwind 4, shadcn/ui 4.21, Drizzle 0.45, Vitest 5, Playwright
1.63, Postgres 16, RustFS, Mailpit (docs/setup.md). The CI workflow triggers on both push and
pull_request, so a branch with an open PR runs twice per commit; acceptable for now, revisit if
minutes matter.
