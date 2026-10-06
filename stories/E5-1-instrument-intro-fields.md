# E5-1 Create an instrument from a set version; intro text; respondent fields

User: a PM deciding what respondents are asked before they rate
Status: built
Outcome: an instrument draft exists on the current set version with an intro and the fields
respondents fill in, and the preview refuses to start until the mandatory ones are filled.

Amended 2026-10-06 (E5-7, design note 100): under Names hidden and Anonymous the respondent
fields can only be dropdowns; a text or email field is refused on save with a message naming
it (saveFields reads the level under the instrument row's lock). The fields still save once
published. A personal invite carries no name or role into About you under those levels.

## Acceptance criteria
1. Build (PM app board) opens an instrument draft on the latest set version, or on the one
   chosen in E3-6. Title defaults to the project name; intro is a textarea with "Write one or
   two lines so respondents know what the list is for. They see this first." when empty
   (docs/copy/errors.md).
2. Respondent fields: a list with label, type (text or dropdown with options), mandatory
   toggle; Name and Role are there by default. Removing the last field shows "Keep at least
   one field, so you can tell answers apart. Name is the usual one." and is refused. An
   optional Email field type exists so the submission receipt can be sent (docs/copy/emails.md,
   email 4). (Amended 2026-10-04 by E7-5: the receipt goes only to a personal invite's
   address; an email typed on a public link gets none, docs/review-list.md.)
3. The preview's About you page (E5-6) shows the fields; Start stays disabled at 40 percent
   until the mandatory ones are filled, with "Fill in your name and role to start." (the
   respondent board's note) while the mandatory fields are exactly Name and Role, and "Fill
   in the required fields to start." for any other set (decision 0043).
4. Every field validates on the server: label 1 to 60 characters, up to 8 fields, dropdown
   needs 2 to 20 options.
5. Playwright: add a dropdown field, see it in the preview.

## Out of scope
- Publishing: E6-1. Scoring, layout, closing: E5-2, E5-3, E5-5.

## Open questions
- None. The two from design note 38 (the hint under Start, Role as text by default) are
  decision 0043, 2026-10-03.

## Technical notes
instrument.respondent_fields as RespondentFieldSpec[] (INTERFACES.md), with `type: "email"`
added to the union before the migration. Field keys are slugs of the label, unique per
instrument.

Owed from E3-6 (acceptance 3, recorded 2026-10-02): "Build on version N+1" when a newer set
exists than the one the instrument was built from, creating a new instrument draft; the old
instrument keeps its version. The "Version N" header on Results belongs to E8's results page.

Built 2026-10-03 (design note 38):
- Acceptance 1: /app/projects/[id]/build (src/app/app/(shell)/projects/[projectId]/build/)
  opens the newest instrument of the project, or creates one on the latest set with the
  project's name as its title (openDraft in src/lib/instruments.ts); the Intro card has the
  title and the intro with the errors.md hint while it is empty. "Build on version N" is the
  card above the forms when a newer set exists; it copies the draft onto that set.
- Acceptance 2: the Respondent fields card, one row per field with Label, Type (Text,
  Dropdown with its options one per line, Email), the Required switch and Remove; Add a field
  up to eight; Remove refused on the last one with the line. Name and Role, both text and
  required, are the defaults (Role as text: nothing can guess a PM's roles).
- Acceptance 3: the preview panel on the right renders the About you page from
  src/components/respondent/about-you.tsx, the component E7-1 mounts at /r/[token]: Start
  disabled at 40 percent with the hint of decision 0043 until every required field is
  filled. Since E5-6 the panel is the respondent app itself in an iframe, with the Desktop
  toggle and "Open full size" (note 65).
- Acceptance 4: parseFields in src/lib/respondent-fields.ts (label 1 to 60, 1 to 8 fields,
  dropdown 2 to 20 different options; keys are label slugs, -2, -3 on a clash), with
  src/lib/respondent-fields.test.ts (6 tests) and src/lib/instruments.test.ts (4 tests: one
  draft per project, the rule on the server, the sample and another workspace refused, Build
  on version 2).
- Acceptance 5: e2e/build.spec.ts adds a Team dropdown with three options and sees the select
  with "Choose one, Sales, Finance, HR" in the preview, then fills Name and Role and sees
  Start enabled.
- `type: "email"` is in INTERFACES.md and src/db/types.ts; the column is jsonb with no check
  on the type, so no migration was needed.
- Audit of 2026-10-03 (22 findings, none blocking): one draft per project and set under the
  project lock (instruments.createOnSet), edits and "Build on version N" refused on a draft
  that is no longer the newest, the cross-workspace read test, per-row accessible names and
  focus moves on the fields card, aria-required and the hint linked to Start, the ring on
  the fields block, non-string input refused, the secondary Save buttons, and the doc rows.
  The hint wording (question 1) stays as the story wrote it until Mihai decides.

