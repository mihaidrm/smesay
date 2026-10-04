# Setup: how to run the app and what the scaffold contains

Written 2026-10-01 (plan step 2.2), updated 2026-10-02. The app has its tables (E1-2), the
query helpers (E1-3) and the sample seed (E1-4); sign-in comes with E2. Everything below runs on
a machine with Node 22.9 or newer (the seed uses --env-file-if-exists, nodejs.org/api/cli.html)
and Docker (decision 0006).

## Run it

```
npm run hooks            # once per clone: the pre-commit hook (decision 0022)
cp .env.example .env.local
docker compose up -d     # Postgres 5432, RustFS 9000 (console 9001), Mailpit 8025 (SMTP 1025)
npm install
npm run db:migrate       # creates the tables (drizzle/, stories/E1-2); a second run changes nothing
npm run db:seed          # the Marlow Group test fixture (stories/E1-4); a second run changes nothing. Your own
                         # workspace, with its own sample project, is made on your first sign-in (stories/E2-3)
# Sign in (stories/E2-1): open http://localhost:3000/sign-in, enter any address, open the email at
# http://localhost:8025 (Mailpit) and click Sign in. Needs BETTER_AUTH_SECRET, BETTER_AUTH_URL,
# MAIL_SMTP_URL, EMAIL_FROM and the four S3_* values in .env.local (.env.example has the local
# values; the logo upload in Settings creates the bucket in RustFS on first use). The secret is
# the one value you type: paste the output of the next line into BETTER_AUTH_SECRET= (crypto.randomBytes,
# nodejs.org/api/crypto.html).
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npm run dev              # http://localhost:3000
```

Checks, the same ones CI runs on every push (.github/workflows/ci.yml):

```
npm run lint             # ESLint, next/core-web-vitals and next/typescript
npm run typecheck        # tsc --noEmit
npm run scan:copy        # WRITING.md scan over docs, stories, evals, src, e2e, scripts
npm run check:status     # status, retired terms, references (decision 0022)
npm run check:bundle     # after a build: no client bundle carries the AI key name or the SDK (stories/E4-1)
npm run ai:smoke         # one real call to the model with the key in .env.local (docs/accounts.md step 9)
npm test                 # Vitest: logic, and the database tests against smesay_test on the compose Postgres (created by the tests, never the dev database)
npm run build
npm run test:e2e         # Playwright, one test per user-facing flow; export DATABASE_URL first (e2e/results-conflict.spec.ts adds respondents to the sample)
```

On a machine with a preinstalled Chromium and no download access, set
`PLAYWRIGHT_CHROMIUM_PATH` to its path before `npm run test:e2e`.

## What is in the scaffold and where each choice comes from

Versions are the latest on npm on 2026-10-01. Each fact names its source: the documentation
page, or the installed package's type file where the page did not say.

- Next.js 16.3.8 with the App Router, TypeScript, Tailwind 4, ESLint 9, `src/` directory,
  `@/*` alias. Created with `create-next-app@15.5.27` and its flags (`--help` output), then
  moved to 16 the same day (decision 0024) with `npm install next@16.3.8
  eslint-config-next@16.3.8`. Turbopack is the default for dev and build in 16, so the
  `--turbopack` flags are gone from the scripts (nextjs.org/docs/app/guides/upgrading/
  version-16, "Turbopack by default"). The lint script is `eslint`; the same guide lists
  "Migrate from next lint to the ESLint CLI", already the case here.
- shadcn/ui 4.21.1, initialised with `npx shadcn@4.21.1 init -d` (defaults: template next,
  style base-nova, neutral, lucide) and `add button`. Wrote components.json, src/lib/utils.ts
  (`cn` from the `cn` package), src/components/ui/button.tsx, and the imports of
  tw-animate-css and shadcn/tailwind.css in src/app/globals.css.
- Drizzle ORM 0.45.3 with the postgres-js driver (`postgres` 3.4.9) and drizzle-kit 0.31.11.
  The get-started page (orm.drizzle.team/docs/get-started-postgresql) shows both
  `drizzle(process.env.DATABASE_URL)` and the client form; src/db/index.ts uses the client
  form so the pool is one named object. Config fields dialect, schema, out, dbCredentials.url:
  node_modules/drizzle-kit/index.d.mts. Files: src/db/index.ts, src/db/schema.ts (empty until
  E1), drizzle.config.ts; migrations will land in drizzle/.
- better-auth 1.7.7 installed, not wired. The installation page (better-auth.com/docs/
  installation) sets `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`, builds the adapter with
  `drizzleAdapter(db, { provider: "pg" })` from `better-auth/adapters/drizzle`, and mounts
  `toNextJsHandler(auth)` from `better-auth/next-js` at app/api/auth/[...all]/route.ts. E2 does
  that; .env.example already names the two variables and the old `AUTH_SECRET` is gone.
- Vitest 5.0.3: vitest.config.ts, `defineConfig` from `vitest/config`
  (node_modules/vitest/dist/config.d.ts). Needs `@types/node` 22 (its peer range; the install
  with `^20` failed with ERESOLVE and was fixed by moving to `^22`, which matches Node 22).
  First test: scripts/copy-rules.test.mjs, 6 tests on the WRITING.md rules.
- Playwright 1.63.0: playwright.config.ts with `webServer` (command, url,
  reuseExistingServer set to `!process.env.CI`, timeout; playwright.dev/docs/test-webserver)
  and `use.launchOptions` (node_modules/playwright/types/test.d.ts). First test:
  e2e/home.spec.ts.
- The copy scan: scripts/copy-rules.mjs holds the rules, scripts/scan-copy.mjs walks files,
  `npm run scan:copy` runs it. The pre-commit hook (scripts/githooks/pre-commit) runs the
  status check and the scan.
- docker-compose.yml. Postgres: `POSTGRES_PASSWORD` is the one required variable;
  `POSTGRES_USER` creates that superuser and a database of the same name; `POSTGRES_DB` names
  the database (postgres image description on hub.docker.com). RustFS (decision 0025; the store named in the plan before it now needs a registry login to pull):
  image rustfs/rustfs:1.0.0, `RUSTFS_ACCESS_KEY`, `RUSTFS_SECRET_KEY`, `RUSTFS_ADDRESS ":9000"`,
  `RUSTFS_CONSOLE_ADDRESS ":9001"`, data in /data (docs.rustfs.com/installation/docker).
  Mailpit:
  axllent/mailpit, web UI 8025, SMTP 1025 (mailpit.axllent.org/docs/install/docker). Docker is
  not available in the build session, so `docker compose up` itself was not run here; the
  first run on Mihai's PC (step 2.5, 2026-10-01) was that check: all three containers started.
- CI: .github/workflows/ci.yml runs lint, typecheck, scan, status check, unit tests, build,
  then installs Chromium and runs the Playwright test. First run on PR 8: green. No database
  job yet; E1 adds Postgres as a service when the first migration exists.

## Decided while setting up

- Next 16, not 15 (decision 0024, Mihai, 2026-10-01). The upgrade guide
  (nextjs.org/docs/app/guides/upgrading/version-16) asks for Node 20.9 or newer, TypeScript
  5.1 or newer, the ESLint CLI instead of `next lint`, proxy instead of middleware, and async
  request APIs. The empty app had none of the old forms, so the move was the install plus a
  check run.
