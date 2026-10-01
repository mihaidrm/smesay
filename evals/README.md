# Golden set for the AI shaping feature

Ten messy requirement documents from invented domains (no client material, decision 0002), each
with the areas, the items and the "must not invent" list the shaping step is expected to
produce. Written 2026-10-01 (plan step 1.6). The runner (run.ts) and the output schema
(schema.json) are written in E4; until then the set is read by people.

## Files

- specs/NN-domain.md: the document as a PM would paste it, with its format quirks, a one-line
  format note, the project context block where one exists (04 and 06, decision 0011), and the
  expectation in words.
- expected/NN.json: the exact expectation, one object per spec (format below).
- golden-generator.py: the source of both; edit the data there and rerun it (Python 3.12 or
  later), never the generated files.
- golden-board-generator.py: writes docs/design-notes/prototype-01/GoldenSet.dc.html, the canvas
  board that shows each spec as received next to what Shape must produce. Rerun it after
  golden-generator.py.

## The ten

| Spec | Domain | Source rows | Distinct items | Areas | Context | Ambiguous | Duplicates |
|---|---|---|---|---|---|---|---|
| 01 | Bakery chain ordering | 18 | 17 | 4 | no | 2 | 1 |
| 02 | Veterinary clinic scheduling | 14 | 14 | 4 | no | 1 | 0 |
| 03 | Municipal library catalogue | 14 | 14 | 4 | no | 0 | 0 |
| 04 | Ski resort lift ticketing | 15 | 15 | 4 | yes | 1 | 0 |
| 05 | Community choir management | 10 | 10 | 3 | no | 2 | 0 |
| 06 | Wind farm maintenance logging | 14 | 14 | 4 | yes | 1 | 0 |
| 07 | University course registration | 13 | 13 | 3 | no | 0 | 0 |
| 08 | Car wash subscription billing | 13 | 12 | 4 | no | 0 | 1 |
| 09 | Theatre box office | 13 | 13 | 5 | no | 2 | 0 |
| 10 | Beekeeping cooperative traceability | 10 | 10 | 4 | no | 1 | 0 |

Formats covered: Word list with meeting notes (01), email thread with revisions (02),
misaligned spreadsheet with a Romanian duplicate (03), wiki bullets with product names (04),
prose with no list (05), technician shorthand with corrections appended (06), ticket export with
bugs and a Won't do (07), chat with mid-chat changes (08), tender numbering with a contradiction
(09), list plus forwarded message plus open questions (10).

## Expected JSON

- item_count and item_count_tolerance: distinct items after duplicates are merged; a result
  within the tolerance passes the count check.
- areas: name, aliases (names that also pass), items (refs). Every item is in exactly one area.
- items: ref, meaning (one plain sentence of what the item must still say), must_keep (tokens
  that must appear in the reader version: numbers, names, negatives), area, and flags:
  proposed (the value as given in the source, kept as written), ambiguous (an ambiguity flag is
  expected), duplicate_of (the ref it folds into; merged or separate both pass if must_keep
  survives).
- must_not_invent: things a model is likely to add; any of them in the output is an invented
  item.
- notes: what makes the spec hard and what the runner accepts.

## Scoring (for run.ts in E4)

Per spec: items found (meaning matched by a judge call, must_keep tokens present), items missed,
items invented (not matched to any expected item, or on the must_not_invent list), wording that
changed meaning (matched item with a must_keep token missing or a negative dropped), areas
matched (name or alias), ambiguity flags expected and raised, glossary terms kept (04, 06).
Passing: no invented items, no missed items, no changed meaning; counts within tolerance; the
two context specs keep every glossary term. Runs in CI on any change to a prompt file.
