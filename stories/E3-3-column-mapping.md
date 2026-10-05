# E3-3 Column mapping, remembered per workspace

User: a PM telling the import which column is which
Status: built
Outcome: the requirement text, area, proposed value, reference and up to five custom fields
are mapped once, and the next file with the same headers maps itself.

## Acceptance criteria
1. The mapping card (PM app board, Import) lists every column with a select: Item text,
   Area, Proposed value, Reference, Custom field, Do not import. Item text is required; without it,
   "Pick the column that holds the requirement text. Without it there is nothing to import."
   and the Import button is disabled at 40 percent.
2. Up to five custom fields; a sixth select offering Custom field is disabled with "Up to
   five custom fields". Custom values land in item.custom as `{ [header]: value }`.
3. The mapping is saved per workspace keyed by the sorted list of headers. A later file with
   the same headers opens with the mapping applied and the line "Mapping remembered from
   [DATE]" above the card.
4. Proposed value accepts MoSCoW words and letters (Must, M, Should, S, Could, C, Won't, W,
   Not needed), 1 to 5, and keep, change, drop; anything else is kept as text and shown in the
   check report (E3-5) as "[N] proposed values were not recognised and are kept as written". The mapping
   from words to the scale is a unit test.
5. Playwright: map the Marlow fixture, import, open the project again with a second copy of
   the file, see the mapping remembered.

## Out of scope
- Shaping areas when no area column exists: E4-2 does that.

## Open questions
- None.

## Technical notes
Built 2026-10-02.

- Table workspace_mapping (workspace_id, headers_key, mapping jsonb, updated_at; unique per
  workspace and headers) and upload.mapping in migration 0007 (0002 had gone to E2-3);
  ColumnRole and ColumnMapping in INTERFACES.md and src/db/types.ts. The mapping is keyed by
  the column's header (its letter without one), so the same headers in another order still
  map; the headers key is the sorted headers.
- src/lib/import/mapping.ts: the roles, the guess from header names, the cleaning of a form
  mapping (one column per text, area, value and ref; five custom fields; unknown roles
  skipped), the missing-text message, the remembered mapping applied to another file's
  columns. Tested in mapping.test.ts.
- src/lib/import/values.ts: the proposed value scale (acceptance 4): MoSCoW words and letters,
  Not needed, 1 to 5 (fit), keep, change, drop (kcd); anything else kept as written with
  scale null, which E3-5 counts as "not recognised". Tested in values.test.ts. Nothing stores
  the normalised value yet; E3-5's commit writes it to item.proposed_value.
- src/lib/uploads.ts: saveUpload() and rechoose() set upload.mapping (remembered for the
  headers, else guessed); saveMapping() cleans, stores and remembers; rememberedFrom() gives
  the date for the line when the workspace mapping predates the upload. Tested in
  uploads.test.ts (the guess, a change, the same headers in another order in a csv, another
  workspace's own memory, another workspace refused).
- The card is src/app/app/(shell)/projects/[projectId]/import/mapping.tsx (design note 21);
  a select change submits the form to mapAction. The Import button, with its disabled state
  from acceptance 1, comes with the check report and the commit (E3-5), which also owns the
  import click of acceptance 5 and the `{ [header]: value }` shape of acceptance 2; until then
  the card shows the missing-text message alone.
- Custom values land in item.custom as `{ [header]: value }` at the commit (E3-5), which reads
  upload.mapping; nothing writes items in this story.
- Playwright: e2e/import.spec.ts continues from the E3-2 path: the guess, a change, the
  missing-text message, a second copy of the file opening with "Mapping remembered from". The
  "import" between the two uploads in acceptance 5 joins the test with E3-5, since the memory
  does not depend on it.
- Wording: the last role is the board's "Do not import" (design note 21; decision 0040 on
  2026-10-03, acceptance 1 updated).
- Audit of 2026-10-02 (fresh context, 13 findings), closed in the story's PR: two columns with
  the same header (or a header that reads like another column's letter) collapsed into one key,
  so the file could not be mapped (keys now carry the letter, "Requirement (B)", tested); a
  guessed mapping the PM accepted was never remembered (a guess with a text column is now
  remembered once the upload row exists; a mapping without one is never remembered); the
  remembered line sits above the card as acceptance 3 says; the Import button and its title
  text left for E3-5; the revalidated path comes from the row, not the form; both timestamps of
  "remembered from" come from the database clock; a test that one workspace's save leaves
  another's memory untouched. Open: picking a single role another column holds reverts the
  pick to "Do not import" without a message (the first column in file order keeps it); noted
  for E3-5's card.
