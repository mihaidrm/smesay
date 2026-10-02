# E10-2 JSON export of the whole project, re-importable into another workspace

User: a consultancy moving a project to the client's workspace; Mihai, keeping a backup
Status: ready
Outcome: one JSON file holds everything about a project, and importing it into another
workspace recreates it.

## Acceptance criteria
1. "Whole project" export: items in every set version, the instrument(s), invites (tokens
   excluded, emails included), responses with answers, sign-offs, missing items, insights with
   state, the import log, the project context; a schema version at the top. Documented in
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
E1-3 helpers so every row carries the new workspace id. 41 KB for the seed (PM app board).
