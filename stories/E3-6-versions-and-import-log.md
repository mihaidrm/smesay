# E3-6 Set versioning and the import log

User: a PM whose list changed after the first import
Status: built
Outcome: re-importing creates version 2; version 1 stays readable and attached to its
instruments and responses.

## Acceptance criteria
1. "Import a new version" on a project with a set opens the same upload, mapping and check
   flow and commits item_set version N+1 (unique per project, never renumbered, E1-2).
2. The import log on Import lists every version: number, source, filename, imported date,
   item count, the check report counts, who imported it. Any version can be opened read-only.
3. An instrument stays on the version it was built from (E1-2, acceptance 4). After a new
   import, Build offers "Build on version N+1", which creates a new instrument draft; the old
   instrument and its responses stay readable on Results with "Version N" in their header.
4. The diff between versions is shown as counts only in R1: "[N] items unchanged, [N]
   changed, [N] new, [N] gone", matched by reference then by exact text. A unit test proves
   the counts on a fixture pair.
5. Playwright: import version 2 of the Marlow fixture with one changed row, see the counts.

## Out of scope
- Carrying answers from version 1 onto unchanged items of version 2: R2 ("set versioning with
  diffs between rounds", docs/plan-steps.md Phase 5).
- Showing the diff per item: R2.

## Open questions
- None. The import banner says a new version does not change the published instrument
  (decision 0031, docs/copy/errors.md).

## Technical notes
Version diff in src/lib/import/diff.ts, pure, tested. Who imported: item_set gets
`imported_by` (user id, set null on delete) and `upload_id` in migration 0008 (built with
E3-4 and E3-5; 0002 had gone to E2-3).

Built 2026-10-02.

- A new version is the same flow (acceptance 1): "Import a new version" in the imported line
  jumps to the upload card; another upload or paste, its mapping and check, then Import; commitImport (src/db/queries/importCommit.ts) takes the
  project row's lock and writes version max + 1, never renumbered.
- The import log (acceptance 2) is the Versions card on Import (design note 24):
  itemSets.versions() in src/db/queries/itemSets.ts (every set of the project with a SQL item
  count and the importer's name), each version opening read-only at
  /app/projects/[id]/import/versions/[setId] (a set of another project or workspace is 404).
- The diff (acceptance 4) is src/lib/import/diff.ts, matched by reference then by exact text
  (whitespace collapsed, case kept), shown as the line under the log for the two latest
  versions; diff.test.ts proves the counts on a fixture pair and the one-match rule.
- Owed to E5-1 (acceptance 3): "Build on version N+1" and the "Version N" header on Results;
  no instrument can be built yet, and the schema already pins an instrument to its set
  (E1-2). The published-list banner of errors.md waits for E6 too.
- Playwright (acceptance 5): e2e/import.spec.ts imports a second copy of the Marlow fixture
  with CL-05 reworded (e2e/fixtures/expense-requirements-v2.xlsx) and sees "Version 1 to 2:
  11 items unchanged, 1 changed, 0 new, 0 gone." and the read-only version 1.
- Audit of 2026-10-02 (with E3-5): the Versions card moved under the imported line as design
  note 24 says; tests for the log from another workspace; E5-1 and E6-1 now name what E3-6
  hands them; exact Playwright locators for "Version 1".
- Changed 2026-10-07 (design note 110): the Versions card is collapsible, open once the
  latest upload is imported with "Version [N], [N] items" on its title row, closed while a
  newer upload waits; every other card on Import is closed then, and "Import a new version"
  opens The list. e2e/import.spec.ts asserts Versions open and The list closed after the
  import, then The list opened by a click.
