# PM app copy

Strings on the signed-in side that are not errors (those are in errors.md). Written 2026-10-02
with E2-1; each story that adds a screen adds its strings here first, then in the code. Scan with
`node scripts/scan-copy.mjs docs/copy` before adding a line.

## Sign-in (E2-1)

| Where | Text |
|---|---|
| Title | Sign in |
| Help line under the title | Enter your email and we send you a link. No password to remember. |
| Field label | Email |
| Button | Send me a link |
| Status box after sending | Check your email. The link works once and stops working in [N] minutes. |
| Link-used page title | This sign-in link has already been used or has expired. |
| Link-used page line | Ask for a new one. |
| Link-used page button | Send a new link |

## Signed-in shell (E2-1, filled in by E2-3)

| Where | Text |
|---|---|
| Sidebar, workspace block label | Workspace |
| Sidebar, no membership yet | No workspace yet |
| Sidebar footer button | Sign out |
| Landing title until E2-3 | Signed in |
| Landing line until E2-3 | You are signed in as [EMAIL]. |
| Loading state of any page | Loading. |
| Error state of any page, title | The server could not finish this request. |
| Error state of any page, line | It has been logged. Try again in a minute. |
| Error state button | Try again |
