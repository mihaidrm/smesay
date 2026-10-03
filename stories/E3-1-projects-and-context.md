# E3-1 Project list, new project, and the project context box

User: a PM starting a validation
Status: built
Outcome: a project exists with a name and a short context the AI will read, and the list of
projects shows where each one stands.

## Acceptance criteria
1. Projects (PM app board): a table of name, items, responses ("5 of 7"), status (Draft, Open,
   Closed, Sample), updated date; "New project" button; the sample row carries its pill and
   "Delete sample" (E8-8). Empty state when only the sample exists: "No projects yet" with the
   button, per docs/design-system.md.
2. New project asks for a name only and opens the Import step. The stepper shows Import,
   Shape, Build, Share, Results with the current step filled, done steps numbered in ink,
   coming steps grey (PM app board, stepper after the canvas comment of 2026-10-01).
3. Import holds the "About this project" card above the mapping (decision 0020): one text
   "What is this about?" and one line "Terms to keep as written", counted live as
   "[N] of 2,000 characters"; over 2,000 the server refuses with the message in
   docs/copy/errors.md. Not shown to respondents.
4. Project rows are workspace scoped through the E1-3 helpers; archived projects (archived_at)
   are hidden behind "Show archived". Archive and unarchive exist on the project header menu;
   nothing is deleted (decision 0028).
5. Playwright: create a project, type a context, see the count, reload, the context is there.

## Out of scope
- Uploading the file: E3-2. Using the context in prompts: E4-5.

## Open questions
- None.

## Technical notes
Built 2026-10-02.

- Project creation calls `withinPlan(ws, "projects")` (E2-6) before inserting; always true on
  the free entry. src/lib/projects.ts holds create, the context save, archive and unarchive,
  and the sample deletion; every member may do them (projects.create is not owner-only).
- Columns project.context_goal and project.context_terms (docs/schema.md). The count and the
  2,000 limit are src/lib/project-context.ts, read by the form (live) and the server (refusal
  with the message from docs/copy/errors.md); the two fields are trimmed and stored, empty as
  null.
- The list is `projects.summaries(ws, { archived })` in src/db/queries/projects.ts: each project
  with the item count of its latest set, the submitted responses against the invite rows
  ("5 of 7" for the sample: 5 submitted of 7 invites, 6 personal and 1 public) and the links
  the status is derived from. Status is `projectStatus()` in src/lib/project-status.ts: Draft
  until an instrument has a link (E6 publishes by creating one), Open while a link is open (not
  revoked, opened, not yet closed), Closed otherwise, Sample when is_sample. Open shows in the
  agree tint, the others as the neutral pill.
- The stepper is one component, src/components/app/stepper.tsx (design note 19), used by the
  project frame src/app/app/(shell)/projects/[projectId]/layout.tsx; a step with no page yet is
  not a link, so Shape, Build, Share and Results are grey until their stories. A project id
  outside the workspace is 404 through projects.get(ws, id).
- Archive and unarchive are a button in the project header (the board's header menu has one
  entry so far); archived projects are hidden and listed behind "Show archived" (?archived=1).
  "Delete sample" on the sample's row is stories/E8-8 acceptance 3, built here because the row
  carries it: a confirm line first, then responses, then the project, in one transaction that
  rolls back if the row is not the sample (decision 0028); the sample cannot be edited (its
  About card is read-only, and the server refuses a context save or an archive on it), the rest
  of E8-8 stays with E8-8.
- The empty state "No projects yet" with New project sits under the table while the workspace
  has no project of its own, archived ones included; the sample row stays above it.
- project.updated_at (migration 0006) is set by the context save, archive and unarchive and is
  the list's Updated column. The invite, response and item counts are SQL counts per
  instrument or set; link rows are read for the listed projects only.
- Audit of 2026-10-02 (fresh context, 17 findings): the blocking one (a Playwright locator on a
  div) was closed in the story's own PR; findings 2, 3, 4, 7, 8, 9, 10 and the notes 11 to 16
  are closed by the audit-fix PR of the same day. Two were decided on 2026-10-03 (decision
  0040): Delete sample is the one hard delete of R1, the exception to decision 0028, and a
  project whose links open in the future reads Closed until E6 gives the date its own place.
- Tests: src/lib/project-status.test.ts, src/lib/project-context.test.ts, src/lib/projects.test.ts
  (the sample copy summarised as 6 items, 5 of 7, Sample; a draft; the latest set's items and
  Open from an open link; the context saved, trimmed and refused above 2,000; archive and
  Show archived; the sample deleted with its responses and nothing else; another workspace's
  project 404 on every action); e2e/projects.spec.ts (acceptance 5 plus the list). Design note
  19 has the screenshots.
- Copy: docs/copy/app.md (Projects and the project frame) and errors.md.
