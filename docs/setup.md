# Setup: how to run the app and what the scaffold contains

Written 2026-10-01 (plan step 2.2). The app is empty: one placeholder page, no tables, no
sign-in. Everything below runs on a laptop with Node 22 and Docker (decision 0006).

## Run it

```
npm run hooks            # once per clone: the pre-commit hook (decision 0022)
cp .env.example .env.local
docker compose up -d     # Postgres 5432, MinIO 9000 (console 9001), Mailpit 8025 (SMTP 1025)
npm install
npm run dev              # http://localhost:3000
```

Checks, the same ones CI runs on every push (.github/workflows/ci.yml):

```
npm run lint             # ESLint, next/core-web-vitals and next/typescript
npm run typecheck        # tsc --noEmit
npm run scan:copy        # WRITING.md scan over docs, stories, evals, src, e2e, scripts
npm run check:status     # status, retired terms, references (decision 0022)
npm test                 # Vitest, unit tests for logic
npm run build
npm run test:e2e         # Playwright, one test per user-facing flow
```

On a machine with a preinstalled Chromium and no download access, set
`PLAYWRIGHT_CHROMIUM_PATH` to its path before `npm run test:e2e`.

## What is in the scaffold and where each choice comes from

The documentation sites (nextjs.org, orm.drizzle.team, better-auth.com, playwright.dev,
min.io, mailpit.axllent.org, ui.shadcn.com) were blocked by the build session's network policy,
so every API fact below is taken from the installed package's own type file or README, named
with its path. Versions are the latest on npm on 2026-10-01.

- Next.js 15.5.27 with the App Router, TypeScript, Tailwind 4, ESLint 9, Turbopack, `src/`
  directory, `@/*` alias. Created with `create-next-app@15.5.27` and its flags (`--help`
  output). The generated package.json uses `eslint` as the lint script, not `next lint`.
  Next 16.3.8 is the current major; CLAUDE.md names 15, so 15 it is, see "Open" below.
- Drizzle ORM 0.45.3 with the postgres-js driver (`postgres` 3.4.9) and drizzle-kit 0.31.11.
  `drizzle(client, { schema })`: node_modules/drizzle-orm/postgres-js/driver.d.ts.
  `postgres(url)`: node_modules/postgres/types/index.d.ts. Config fields dialect, schema, out,
  dbCredentials.url: node_modules/drizzle-kit/index.d.mts. Files: src/db/index.ts,
  src/db/schema.ts (empty until E1), drizzle.config.ts, migrations will land in drizzle/.
- better-auth 1.7.7 installed, not wired. Exports used in E2: `betterAuth` from
  `better-auth`, `toNextJsHandler` from `better-auth/next-js`, `drizzleAdapter(db, { provider:
  "pg" })` from `better-auth/adapters/drizzle` (node_modules/better-auth/package.json exports,
  node_modules/@better-auth/drizzle-adapter/dist/index.d.mts). Reads `BETTER_AUTH_SECRET` and
  `BETTER_AUTH_URL` (node_modules/@better-auth/core/dist/types/init-options.d.mts), so
  .env.example names those; the old `AUTH_SECRET` is gone.
- Vitest 5.0.3: vitest.config.ts, `defineConfig` from `vitest/config`
  (node_modules/vitest/dist/config.d.ts). Needs `@types/node` 22 (its peer range; the install
  with `^20` failed with ERESOLVE and was fixed by moving to `^22`, which matches Node 22).
  First test: scripts/copy-rules.test.mjs, 6 tests on the WRITING.md rules.
- Playwright 1.63.0: playwright.config.ts with `webServer` and `use.launchOptions`
  (node_modules/playwright/types/test.d.ts). First test: e2e/home.spec.ts.
- The copy scan: scripts/copy-rules.mjs holds the rules, scripts/scan-copy.mjs walks files,
  `npm run scan:copy` runs it. The pre-commit hook (scripts/githooks/pre-commit) runs the
  status check and the scan.
- docker-compose.yml: postgres:16-alpine, minio/minio, axllent/mailpit. Docker is not available
  in the build session, so the image settings (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB;
  MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, `server /data --console-address ":9001"`; Mailpit
  ports 1025 and 8025) are unverified. The first `docker compose up` on Mihai's laptop
  (step 2.5) is the check; if a container fails, its log names the variable.
- CI: .github/workflows/ci.yml runs lint, typecheck, scan, status check, unit tests, build,
  then installs Chromium and runs the Playwright test. No database job yet; E1 adds Postgres
  as a service when the first migration exists.

## Not done, and why

- shadcn/ui is not initialised. `npx shadcn@4.21.1 init` fetches its configuration and every
  component from ui.shadcn.com, which the session's network policy denies. Mihai runs on the
  laptop, from the repository root: `npx shadcn@latest init -d` then `npx shadcn@latest add
  button`. Both write files only (components.json, src/lib/utils.ts, src/components/ui/) and
  install clsx, tailwind-merge, class-variance-authority and lucide-react. Or the host is
  added to the environment's allowed domains and Claude runs it.
- No sign-in, no tables, no mail sending: E2, E1, E12.

## Open

- Next 15 or 16. CLAUDE.md says 15 and that is what is installed, but 16.3.8 is current and no
  code depends on 15 yet. Moving an empty scaffold is one session; moving a built app is more.
  Recommendation: decide before E1. Claude will look at the 16 release notes once nextjs.org
  is reachable and report what changes.
