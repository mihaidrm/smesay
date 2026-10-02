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

## Workspace step (E2-3)

| Where | Text |
|---|---|
| Create page title | Name your workspace |
| Create page line | The sample project comes with it, so there is something to look at. |
| Field label | Workspace name |
| Button | Create workspace |
| Switch page title | Choose a workspace |
| Switch page line | Pick the workspace to work in. You can switch any time from the sidebar. |
| Switch page line when the current workspace was removed | The workspace you were in is no longer available to you. Pick another one to work in. |
| Signed-in line under both pages | Signed in as [EMAIL]. |

## Signed-in shell (E2-1, E2-3)

| Where | Text |
|---|---|
| Sidebar, workspace block label | Workspace |
| Sidebar, member count | 1 member / [N] members |
| Sidebar, projects label and link | Projects, All |
| Sidebar and list, sample pill | Sample |
| Sidebar footer button | Sign out |
| Projects page breadcrumb | [WORKSPACE NAME] |
| Projects page title | Projects |
| Projects page line | One project per validation. |
| Table headers | Project, Status, Updated |
| Status of the sample | Sample |
| Status of a project before E3-1 | Draft |
| Updated line of the sample | Created with the workspace |
| Empty state title | No projects yet |
| Empty state line | Your workspace has no projects. |
| Loading state of any page | Loading. |
| Error state of any page, title | The server could not finish this request. |
| Error state of any page, line | It has been logged. Try again in a minute. |
| Error state button | Try again |
