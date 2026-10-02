# Design note 23: the check card and the import, 2026-10-02

Story E3-5. Built from the PM app board (Import: "Check before import" with three counts in
a row) and docs/design-system.md. Screenshots beside the boards: import-check-desktop.png (the
Marlow fixture checked, the Import button), import-done-desktop.png (after the import: the
imported line under the title, the stepper on Shape, "Imported as version 1." in the card).

## The check card

A hairline card: the title, then the three counts of the board in one row (three cells
divided by hairlines, stacked on a narrow screen), each a plain line when zero and a
disclosure (the browser's details element) listing the rows concerned otherwise; a fourth
line for proposed values not recognised, only above zero. The footer row holds the primary
"Import [N] items" pill on the right (at 40 percent while disabled), or "Imported as version
[N]." once this upload is imported. A refused commit shows its message beside the button.

## After the import

The imported line under the "Import the list" title ("Imported 12 items as version 1 on 2
Oct 2026."), the stepper with Import done (ink circle, white number) and Shape current (an ink
pill that is not a link until E4 builds the page), the Versions card (design note 24), and
the cards still in place: another upload or paste starts the next version (E3-6).

## Decisions taken here

- The commit runs the check again on the server and stores that report; the card and the
  import log (E3-6) therefore show the same numbers.
- "The Results step shows 0 of 0 responses" (acceptance 5) is the Responses cell of the
  project list, which already counts the new set's instruments; the Results pill has no
  count of its own.
