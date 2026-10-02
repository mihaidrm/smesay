# Design note 16: the workspace step, the switcher and the project list, 2026-10-02

Story E2-3. Built from the PM app board (Projects, the sidebar header) and docs/design-system.md.
Screenshots beside the boards: workspace-new-desktop.png (1440), workspace-new-phone.png (390),
workspace-new-error-desktop.png, projects-desktop.png, workspace-switcher-desktop.png,
workspace-switch-desktop.png. The dark circle bottom left is Next's dev tools badge, dev server
only.

## Name your workspace (/app/new)

The sign-in column (448 px, centred): the lockup, "Name your workspace" at 24 px, one line, the
"Workspace name" field prefilled with the email's domain capitalised, the primary button
"Create workspace", then "Signed in as [EMAIL]." with a small secondary Sign out, so a wrong
address has a way out. The server validates (1 to 80 characters) and the field shows the danger
line from docs/copy/errors.md. A phone layout because the magic link often opens there.

## Choose a workspace (/app/switch)

Same column: "Choose a workspace", one line (a different one when the workspace the person was
in is no longer theirs), the workspaces as full-width secondary buttons, the signed-in footer.
A fresh session with one membership never sees it: that workspace is selected without asking.

## The shell and the project list (/app)

The PM app board's frame. Sidebar: lockup; "Workspace" label; the name, or the switcher when
the person belongs to more than one workspace (the design system's Select with its trigger
stripped to the name and the chevron, 32 px, no border; the list opens below); "[N] members";
"Projects" with "All" in teal; one row per project with the Sample pill. Footer: the email and
Sign out. Content: the workspace name as the 12 px breadcrumb, "Projects" at 24 px weight 400,
one line, then the table: Project (name plus the Sample pill), Status, Updated. Header 32 on
grey-50 at 12 px muted (docs/design-system.md, Table), rows 36. The sample's status pill and the
Sample pill are the new NeutralPill (src/components/ui/status-pill.tsx): a new neutral token,
grey-100 (#F0F0EE, the board's pill fill; the same hex as the Disagree tint), with ink-soft
text; the token has its row in docs/design-system.md. Empty state per the design system when no
project is left. The 404 page (src/app/not-found.tsx) and the error and loading states of the
/app segment use the sign-in column.

E3-1 adds New project, the Items and Responses columns, Open and the per-row actions; E2-5
adds the Settings link beside the workspace name.

## Checked

Rendered in Chromium at 1440 by 900 and 390 by 844 (the create page). The flow is run by
e2e/workspace.spec.ts (browser plus Mailpit, in CI); the switcher and the chooser were
exercised against the dev server with two memberships (screenshots above).
