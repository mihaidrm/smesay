# Mistakes log

Format: date, agent, what was invented or assumed, what caught it, what changed.

| Date | Agent | What was invented or assumed | What caught it | What changed |
|---|---|---|---|---|
| 2026-10-02 | main session (E2-1) | Assumed Next encodes the slash in a redirect query (`next=%2Fapp`). It does not. | CI run 36991708091, e2e/sign-in.spec.ts line 39 | The test accepts both forms; the proxy now encodes the value itself. |
| 2026-10-02 | main session (E2-1) | Assumed better-auth's Secure cookie flag follows NODE_ENV. It follows the scheme of the base URL (node_modules/better-auth/dist/cookies/index.mjs). | Reviewer audit, finding 2 | src/lib/auth.ts reads BETTER_AUTH_URL and refuses http (other than localhost) in production; the test sees Secure on an https instance. The first version refused localhost too and broke `next build`, caught by running the build before the push. |
| 2026-10-02 | main session (E2-1) | Assumed a leading slash made `next` safe. A tab inside the path resolves to another host. | Reviewer audit, finding 1 | src/lib/safe-path.ts applies better-auth's relative-URL rule; src/lib/safe-path.test.ts. |
