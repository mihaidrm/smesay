# 0037 The golden set scores imported rows; the E4 copy and defaults are accepted, 2026-10-03

Status: decided by Mihai on 2026-10-03 ("1 - yes to recommended", "5. ok", "6 7 8 9 yes to
all"), answering the open points of design notes 27 to 31.

1. Golden set rule (design note 27). Shaping never drops or merges an item: every imported row
   stays an item in exactly one area (checkShape, E4-2). The golden set is scored as imported
   rows: each expected item carries the row a PM would import, the rows that are not items
   (meeting notes, bugs, Won't do, closed duplicates, open questions, empty rows) are left out
   of the expectation files, a duplicate row stays a row with a duplicate_of expectation, and
   spec 05 (prose) is scored as the pasted list a PM would make from it. The documents as
   received stay in the spec files for people to read.
2. The Shape copy of E4-2 to E4-5 (docs/copy/app.md, Shape; docs/copy/errors.md, Shaping) is
   accepted as written.
3. Defaults kept: one banner per flag, not per item (note 29; story E4-4 reworded); no
   drag-and-drop library and the 400-item ceiling until E4-6 shows real token counts (note
   27); the usage line in the Plan card (note 31); the lint allowance for queries/internal
   per file, not per function (note 31).
4. E2-2 is accepted: Mihai signed in with the real Google button on his PC on 2026-10-03
   (decision 0034's check).

Consequences: stories E2-2 and E4-4, docs/context.md and the Stories board on 2026-10-03;
E4-6 is built on rule 1 (evals/README.md and the generator carry the rows).
