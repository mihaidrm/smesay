# E3-3 Column mapping, remembered per workspace

User: a PM telling the import which column is which
Status: ready
Outcome: the requirement text, area, proposed value, reference and up to five custom fields
are mapped once, and the next file with the same headers maps itself.

## Acceptance criteria
1. The mapping card (PM app board, Import) lists every column with a select: Item text,
   Area, Proposed value, Reference, Custom field, Ignore. Item text is required; without it,
   "Pick the column that holds the requirement text. Without it there is nothing to import."
   and the Import button is disabled at 40 percent.
2. Up to five custom fields; a sixth select offering Custom field is disabled with "Up to
   five custom fields". Custom values land in item.custom as `{ [header]: value }`.
3. The mapping is saved per workspace keyed by the sorted list of headers. A later file with
   the same headers opens with the mapping applied and the line "Mapping remembered from
   [DATE]" above the card.
4. Proposed value accepts MoSCoW words and letters (Must, M, Should, S, Could, C, Won't, W,
   Not needed), 1 to 5, and keep, change, drop; anything else is kept as text and shown in the
   check report (E3-5) as "[N] proposed values not recognised, kept as written". The mapping
   from words to the scale is a unit test.
5. Playwright: map the Marlow fixture, import, open the project again with a second copy of
   the file, see the mapping remembered.

## Out of scope
- Shaping areas when no area column exists: E4-2 does that.

## Open questions
- None.

## Technical notes
Table workspace_mapping (workspace_id, headers_key, mapping jsonb, updated_at) in migration
0002; INTERFACES.md gets ColumnMapping before the migration. The recognised proposed values
are the ScoringMethod scales (INTERFACES.md).
