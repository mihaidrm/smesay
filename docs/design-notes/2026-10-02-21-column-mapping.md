# Design note 21: the column mapping card, 2026-10-02

Story E3-3. Built from the PM app board (Import, "Column mapping": one row per column with
the header, "Column [LETTER]", "maps to" and a select; the footer line) and docs/design-system.md.
Screenshot beside the boards: import-mapping-desktop.png (the Marlow fixture mapped by its
headers, the Import button at the bottom right).

## The card

"Mapping remembered from [DATE]" as a muted line above the card when the workspace already
had a mapping for these headers (acceptance 3), then a hairline card: the "Column mapping"
header, one row per column (140 px label column with the header in weight 500 and "Column A"
in 12 px muted, "maps to" in muted, the native select 36 px with the hairline-strong border
and radius 6), then the board's footer line. The primary "Import [N] items" pill joins the
footer row with E3-5. The sixth "Custom field" option is disabled and carries its reason in
the option text, because a native option cannot show a tooltip on every platform.

## Decisions taken here

- The roles are the board's five plus "Custom field" from the story; the last option keeps
  the board's "Do not import" rather than the story's "Ignore" (decision 0017, the board and
  the copy say the same thing). Flagged to Mihai on 2026-10-02; kept on 2026-10-03 (decision
  0040), and the story now says "Do not import".
- A change in any select submits the whole form: the server keeps one column per single role
  and five custom fields at most, and the row re-renders from what was saved. No Save button.
- The default mapping is guessed from the header names (Ref, Requirement, Module, Priority
  and the usual synonyms, src/lib/import/mapping.ts); unknown headers start as "Do not
  import". Without a header row, column A starts as the item text. A guess with a text column
  is remembered for the workspace at once, so accepting it counts as mapping.
- Two columns with the same header are told apart by their letter in the key and in the
  label ("Requirement (B)"); the audit of 2026-10-02 found them collapsing into one row.
