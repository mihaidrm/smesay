# Design note 19: the project list, New project, the stepper and the Import step, 2026-10-02

Story E3-1. Built from the PM app board (Projects, the project header and stepper, the Import
step's About card) and docs/design-system.md. Screenshots beside the boards:
projects-empty-desktop.png (a new workspace: the sample row and the empty state),
project-new-desktop.png, project-import-desktop.png (the About card, saved),
projects-list-desktop.png (the sample and a draft). The dark circle bottom left is Next's dev
tools badge, dev server only.

## Projects (/app)

The board's table: Project (name as a link, the Sample pill), Items and Responses in mono,
Status as a pill (Open in the agree tint, Draft, Closed and Sample neutral), Updated, and on
the right Open as a small secondary button, or Delete sample on the sample's row. "New project"
is the primary button top right. While the workspace has no project of its own the empty state
box (dashed, "No projects yet", one line, the button) sits under the table so the sample row
stays visible. "Show archived" under the table switches to the archived view ("Archived
projects", the rows with their archive date, "Back to projects").

## New project (/app/projects/new)

The breadcrumb, "New project", one line, the Project name field (448 px) and "Create project".

## The project frame and the stepper

Breadcrumb "[Workspace]" (the sample: "[Workspace] · sample project"), the project name at
20 px weight 500 with an "Archived" pill when archived, the stepper in the same header row to
its right, and a small secondary "Archive project" or "Unarchive" at the end (the board's
header menu has one entry so far). The stepper, new to the design system: five pills, 36 px,
radius 999, on a grey 50 track with 4 px padding and a hairline border, each pill a 22 px
numbered circle and a label. The current step is an ink pill with a white circle and an ink
number; a done step has an ink circle with a white number and ink text; a coming step is muted
with a hairline-strong circle. A step with no page yet is not a link. Component:
src/components/app/stepper.tsx. The first build (2026-10-02, before the audit) had the title at
24 px weight 400 and the stepper on its own row without the track; the audit's finding 9
brought it back to the board the same day. Delete sample on the list shows a confirm line
(errors.md) with Cancel before the real button.

## Import (/app/projects/[id]/import)

"Import the list" at 20 px, then the About this project card (hairline, radius 6, 16 px
padding): the title, the muted explanation from decision 0020, the "What is this about?"
textarea (two rows), the "Terms to keep as written, optional" field with the live count on its
right ("[N] of 2,000 characters", danger red above 2,000, when Save is also disabled), the
inline refusal from errors.md and "Saved." in green. The sample's card is read-only with the
line "The sample project cannot be edited." The upload and the mapping follow in E3-2.

## Checked

Rendered in Chromium at 1440 by 900. The flow is run by e2e/projects.spec.ts (Mailpit, in CI);
archive, Show archived, unarchive, Delete sample and a foreign project id (404) were exercised
against the dev server (screenshots above).
