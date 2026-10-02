# E5-1 Create an instrument from a set version; intro text; respondent fields

User: a PM deciding what respondents are asked before they rate
Status: ready
Outcome: an instrument draft exists on the current set version with an intro and the fields
respondents fill in, and the preview refuses to start until the mandatory ones are filled.

## Acceptance criteria
1. Build (PM app board) opens an instrument draft on the latest set version, or on the one
   chosen in E3-6. Title defaults to the project name; intro is a textarea with "Write one or
   two lines so respondents know what the list is for. They see this first." when empty
   (docs/copy/errors.md).
2. Respondent fields: a list with label, type (text or dropdown with options), mandatory
   toggle; Name and Role are there by default. Removing the last field shows "Keep at least
   one field, so you can tell answers apart. Name is the usual one." and is refused. An
   optional Email field type exists so the submission receipt can be sent (docs/copy/emails.md,
   email 4).
3. The preview's About you page (E5-6) shows the fields; Start stays disabled at 40 percent
   until the mandatory ones are filled, with "Fill in your name and role to start." (the
   respondent board's note).
4. Every field validates on the server: label 1 to 60 characters, up to 8 fields, dropdown
   needs 2 to 20 options.
5. Playwright: add a dropdown field, see it in the preview.

## Out of scope
- Publishing: E6-1. Scoring, layout, closing: E5-2, E5-3, E5-5.

## Open questions
- None.

## Technical notes
instrument.respondent_fields as RespondentFieldSpec[] (INTERFACES.md), with `type: "email"`
added to the union before the migration. Field keys are slugs of the label, unique per
instrument.

Owed from E3-6 (acceptance 3, recorded 2026-10-02): "Build on version N+1" when a newer set
exists than the one the instrument was built from, creating a new instrument draft; the old
instrument keeps its version. The "Version N" header on Results belongs to E8's results page.
