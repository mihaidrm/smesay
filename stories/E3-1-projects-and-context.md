# E3-1 Project list, new project, and the project context box

User: a PM starting a validation
Status: ready
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
Columns project.context_goal and project.context_terms (docs/schema.md). The stepper is one
component (src/components/app/stepper.tsx) used by every step page. Status is derived: Draft
until an instrument is published, Open while a link is open, Closed after the close date or
revocation, Sample when is_sample.
