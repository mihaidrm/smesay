# E3-6 Set versioning and the import log

User: a PM whose list changed after the first import
Status: ready
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
`imported_by` (user id, set null on delete) in migration 0002.
