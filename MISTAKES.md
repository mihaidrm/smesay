# Mistakes log

Format: date, agent, what was invented or assumed, what caught it, what changed.

| Date | Agent | What was invented or assumed | What caught it | What changed |
|---|---|---|---|---|
| 2026-10-02 | main session (E2-1) | Assumed Next encodes the slash in a redirect query (`next=%2Fapp`). It does not. | CI run 36991708091, e2e/sign-in.spec.ts line 39 | The test accepts both forms; the proxy now encodes the value itself. |
| 2026-10-02 | main session (E2-1) | Assumed better-auth's Secure cookie flag follows NODE_ENV. It follows the scheme of the base URL (node_modules/better-auth/dist/cookies/index.mjs). | Reviewer audit, finding 2 | src/lib/auth.ts reads BETTER_AUTH_URL and refuses http (other than localhost) in production; the test sees Secure on an https instance. The first version refused localhost too and broke `next build`, caught by running the build before the push. |
| 2026-10-02 | main session (E2-1) | Assumed a leading slash made `next` safe. A tab inside the path resolves to another host. | Reviewer audit, finding 1 | src/lib/safe-path.ts applies better-auth's relative-URL rule; src/lib/safe-path.test.ts. |
| 2026-10-02 | main session (E2-3) | Assumed a Postgres unique violation reaches the server action with `code` on the error. Drizzle wraps it (DrizzleQueryError, the PostgresError as `cause`), so the slug retry never ran. | Running the flow a second time against the dev server before the push | The check walks the cause chain (src/app/app/actions.ts). |
| 2026-10-02 | main session (E2-3) | src/db/schema.test.ts asserted the migration count as the literal 2, so migration 0002 broke it. | CI run 36995337180 | The test counts the .sql files in drizzle/. |
| 2026-10-02 | main session (E2-4) | Assumed better-auth's magic link limit (5 per minute) counted per client. In CI's production server no client address is known, so every test shared one bucket and the sixth link in a minute got 429. | CI run 36997812648, e2e/workspace.spec.ts line 46 | Each spec file sends its own x-forwarded-for; the real limits are E11-1's. |
| 2026-10-02 | main session (E2-4) | Assumed a server-side `auth.api.signInMagicLink` call goes through better-auth's rate limiter. It runs in the request handler only, so invites were unlimited. | Reviewer audit, finding 1 | The workspace's own invite limit in src/lib/invites.ts and src/lib/members.ts, tested. |
