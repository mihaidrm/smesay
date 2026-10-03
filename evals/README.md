# Golden set for the AI shaping feature

Ten messy requirement documents from invented domains (no client material, decision 0002), each
with the rows a PM would import from it, the areas, the items and the "must not invent" list
the shaping step is expected to produce. Written 2026-10-01 (plan step 1.6); rows added
2026-10-03 (decision 0037). The output schema (schema.json) is written from
src/lib/ai/shape-schema.ts by `npm run evals:schema` (E4-2); `npm run evals` runs run.ts
(E4-6) against the real model, about 5 to 15 cents per spec on Sonnet.

## Files

- specs/NN-domain.md: the document as received, with its format quirks, a one-line format
  note, the project context block where one exists (04 and 06, decision 0011), the rows as
  imported, and the expectation in words.
- expected/NN.json: the exact expectation, one object per spec (format below).
- run.ts, score.ts, judge.md: the runner, the scorer and the judge prompt (E4-6). run.test.ts
  runs the runner against a fetch that answers in place of the network. results/latest.json
  is the last run (ignored by git).
- golden-generator.py: the source of both; edit the data there and rerun it (Python 3.12 or
  later), never the generated files.
- golden-board-generator.py: writes docs/design-notes/prototype-01/GoldenSet.dc.html, the canvas
  board that shows each spec as received next to what Shape must produce. Rerun it after
  golden-generator.py.

## The ten

| Spec | Domain | Rows imported | Distinct items | Areas | Context | Ambiguous | Duplicates |
|---|---|---|---|---|---|---|---|
| 01 | Bakery chain ordering | 18 | 17 | 4 | no | 2 | 1 |
| 02 | Veterinary clinic scheduling | 14 | 14 | 4 | no | 1 | 0 |
| 03 | Municipal library catalogue | 15 | 14 | 4 | no | 0 | 1 |
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

## Rows as imported (decision 0037)

Shaping never drops or merges an item: every imported row stays an item in exactly one area
(checkShape, E4-2). So the set is scored as imported rows. Each expected item carries `row`,
the line a PM imports from the document: the source line as it stands, numbering and status
columns stripped, a correction from later in the document folded into its row, a prose
sentence cut out as its own row (05). Rows that are not items (meeting notes, bugs, Won't do,
closed duplicates, open questions, empty rows) have no entry and are never imported. A
duplicate row stays a row with a duplicate_of expectation (01, 03, 08). The runner numbers the
rows from 1 in order, with no area column, so the model proposes the areas.

## Expected JSON

- item_count and item_count_tolerance: the rows imported; tolerance 0, since shaping cannot
  drop or add one. area_count_tolerance: how far the number of areas may differ from the
  expected areas (1).
- areas: name, aliases (names that also pass), items (refs). Every item is in exactly one area.
- items: ref, row (as imported), meaning (one plain sentence of what the item must still say),
  must_keep (tokens that should appear in the reader version: numbers, names, negatives), area,
  and flags: proposed (the value as given in the source, kept as written), ambiguous (an
  ambiguity flag is expected), duplicate_of (the ref it duplicates; the flag in either
  direction passes).
- must_not_invent: things a model is likely to add; any of them in the output is an invented
  item.
- notes: what makes the spec hard and what the runner accepts.

## Scoring (run.ts and score.ts, E4-6)

Per spec, one line: found, missed, invented, meaning changed, tokens missing, areas named
(name or alias) and given, placed (items in the model area that matched their expected area,
over the items whose expected area was named), ambiguity flags expected, raised and matched,
duplicate flags the same, glossary terms kept (04 and 06), and the cost in euro cents.

- A reader version identical to its row is found without a model call. Every other one goes
  to the judge (judge.md, one call per spec, output schema-validated and every ref answered
  once): sameMeaning false is a changed meaning, added true is an invented item. A must_keep
  token missing from the reader version is counted and printed, and the judge decides whether
  the meaning survived without it; the count is there to read, not to fail on.
- Missed: a row absent from the answer. checkShape refuses such an answer before it is
  scored, so a miss shows as a refused spec.
- Glossary (04, 06): a term the row carries must be in the reader version exactly as written.
- Passing: no missed, no invented, no changed meaning, every glossary term kept. Flags,
  placement and the area count (printed with "over tolerance" beyond area_count_tolerance)
  are reported, not failed on: they tell how good the grouping is, not whether the list is
  safe. Area names match loosely (score.ts areaNamesMatch): the words of the expected name or
  an alias, small words aside and cut to a stem, all in the model's name or the reverse.

Exit 1 when any spec fails. CI runs the job on a change under src/lib/ai/prompts/, to the
output schema or the context module, or under evals/ (.github/workflows/evals.yml), with the
repository secret ANTHROPIC_API_KEY; without it the job prints that it skipped and passes.
The runs count against ANTHROPIC_MONTHLY_BUDGET_EUR like any other call, in a throwaway
workspace "evals" with a project "Golden set" that the runner creates once and reuses; it has
no members, so it is not on anyone's screen.
