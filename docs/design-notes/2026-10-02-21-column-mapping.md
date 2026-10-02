# Design note 21: the column mapping card, 2026-10-02

Story E3-3. Built from the PM app board (Import, "Column mapping": one row per column with
the header, "Column [LETTER]", "maps to" and a select; the footer line) and docs/design-system.md.
Screenshot beside the boards: import-mapping-desktop.png (the Marlow fixture mapped by its
headers, the Import button at the bottom right).

## The card

A hairline card with a header row ("Column mapping" left, "Mapping remembered from [DATE]"
right when the workspace already had a mapping for these headers), one row per column (140 px
label column with the header in weight 500 and "Column A" in 12 px muted, "maps to" in muted,
the native select 36 px with the hairline-strong border and radius 6), then a footer row with
the board's line on the left and the primary "Import [N] items" pill on the right. The sixth
"Custom field" option is disabled and carries its reason in the option text, because a native
option cannot show a tooltip on every platform.

## Decisions taken here

- The roles are the board's five plus "Custom field" from the story; the last option keeps
  the board's "Do not import" rather than the story's "Ignore" (decision 0017, the board and
  the copy say the same thing). Flagged to Mihai on 2026-10-02.
- A change in any select submits the whole form: the server keeps one column per single role
  and five custom fields at most, and the row re-renders from what was saved. No Save button.
- The default mapping is guessed from the header names (Ref, Requirement, Module, Priority
  and the usual synonyms, src/lib/import/mapping.ts); unknown headers start as "Do not
  import". Without a header row, column A starts as the item text.
- The Import button is rendered here at 40 percent when no text column is mapped (acceptance
  1) and does nothing until E3-5 wires the check report and the commit; its title says so.
