# Design note 24: the import log and the read-only version, 2026-10-02

Story E3-6. The PM app board has no import log (its Import step shows one list), so the card
is composed from the design system here. Screenshots beside the boards:
import-log-desktop.png (two versions of the Marlow list, the diff line under the table),
version-readonly-desktop.png (version 1 opened read-only).

## The Versions card

A hairline card under the imported line with the title "Versions" and the design system's
table: Version (a link, "Version 1"), Source (xlsx, csv, pasted), File (the file name, or
"Pasted list"), Imported (the date), Items (mono), Checks ("0 empty, 0 duplicates, 0 long, 0
values" in muted 13 px), By (the importer's name). Newest first. Under the table, when there
are two or more versions, the diff line in muted 13 px: "Version 1 to 2: 11 items unchanged,
1 changed, 0 new, 0 gone."

## The read-only version

Inside the project frame: "Version [N]" as the title, one line with the file, the date, the
item count, "Read-only." and a "Back to Import" link, then the table of items: #, Ref, Item,
Area, Proposed value, in position order. Nothing on it edits.

## Decisions taken here

- The log sits on Import under the imported line, above the cards of the next version, so
  the PM sees what exists before importing again.
- "Build on version N+1" (acceptance 3) belongs with the Build step (E5-1); nothing here
  describes it.
