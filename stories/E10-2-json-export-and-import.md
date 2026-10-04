# E10-2 JSON export of the whole project, re-importable into another workspace

User: a consultancy moving a project to the client's workspace; Mihai, keeping a backup
Status: built
Outcome: one JSON file holds everything about a project, and importing it into another
workspace recreates it.

## Acceptance criteria
1. "Whole project" export: items in every set version, the instrument(s), invites (tokens
   excluded, emails included), responses with answers, sign-offs, missing items, insights with
   state, closed_at and closed_by (E9-2, acceptance 4), the import log, the project context; a schema version at the top. Documented in
   INTERFACES.md as ProjectExport.
2. "Import a project" on the project list takes the file and recreates the project under the
   current workspace with new ids and new tokens; respondent fields and answers are kept;
   links are not published (the PM republishes). A test exports the seed, imports it into a
   second workspace and compares counts and the agreement numbers.
3. A file from a newer schema version is refused with its version named; a file from an
   older one is migrated by code or refused with a message, decided per version.
4. Personal data in the export (names, emails, free text) is listed in the privacy policy
   (E11-3) as "exports you make"; the download is logged as in E10-1.

## Out of scope
- Merging into an existing project: not in R1.

## Open questions
- None.

## Technical notes
Export built from the same query helpers; import runs inside one transaction and uses the
E1-3 helpers so every row carries the new workspace id.
As built, writeProject inserts the rows itself inside the transaction, each with the importing
workspace's id from the session, and the composite (id, workspace_id) keys hold every
reference to that workspace; the seed's file is about 20 KB (one line, no indentation).

Built 2026-10-04 (design note 70, decision 0044):
- Acceptance 1: Whole project on the Export tab downloads ProjectExport (INTERFACES.md; built by
  src/lib/export/project.ts from src/db/queries/projectTransfer.ts readProject): "format":
  "smesay.project" and "version": 1 at the top, the project and its context, every list version
  with its items and import report (the import log), the instruments, the invites with their
  emails and without tokens or passcodes ("hadPasscode" says one was set), the responses with
  their answers, sign-offs and closing answers, the missing items, the actions with state,
  closed_at and the closer's email. The sample's file is marked ("sample": true and the
  watermark line).
- Acceptance 2: Import a project on the project list takes the file (5 MB at most, as an
  upload; the server action's 6 MB leaves room for the form's framing) and
  recreates it under the current workspace in one transaction (writeProject) with new ids and
  new tokens; fields and answers are kept; the public link comes in revoked, so nothing is
  published until the PM publishes again, and personal invites keep their state with new
  tokens nobody has (Remind sends a new link to those who have not submitted; Revoke then New
  link sends one to anyone). A response keeps only the fields its instrument asks for. Responses
  submitted this month count toward the plan's monthly responses, and a file that would pass
  them is refused. project.test.ts exports the seed, imports it into
  a second workspace (its sample mark taken off: a sample file is refused) and finds the same
  numbers on the strip and the same agreement per item.
- Acceptance 3: a newer version is refused with its number; version 1 is the only one, so
  nothing older exists to migrate. A file that is not JSON, not a project file, or damaged (a
  field that does not read as written, a JSON column of a shape the app cannot read, a
  reference to a row it does not hold, or a row the database's own rules would refuse: a
  repeated list version, blank text, an answer on another list's item, a repeated personal
  email, an action's state and date that disagree) is refused with a sentence that says so,
  before anything is written. A database refusal no check foresaw rolls back and gives the
  same sentence, and its error, which carries the rows' values, is not logged.
- Acceptance 4: E11-3's privacy policy criterion now names "exports you make"; the download is
  logged as in E10-1 (export_log.file "project", migration 0024).
- Playwright: e2e/project-transfer.spec.ts downloads the sample's file, sees it refused, imports
  it as a PM's project and finds the same agreement tile.

