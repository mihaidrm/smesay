# 119 The list card shows the attached file as a tile, 2026-10-08

Mihai, 2026-10-08, with the open list card pasted: "make it more obvious that there is a file
attached already - maybe show a bigger thumbnail in that empty space".

What was wrong: with a file attached, the card's body read "Upload another file" over the file
picker and "Paste a list instead", and the only sign of the file was its name on the title
row, right-aligned and small. The right half of the body was empty.

Decided:
- A tile in that space, beside the upload form from 768 px and under it below: a 64 px
  violet-soft square with a 32 px Lucide icon (FileSpreadsheet for an xlsx or csv, FileText for
  a pasted list), the heading "The list in use", the file's name (truncated, the full name on
  hover), "[kind] file, [size]" or "A pasted list, [N] items", "Uploaded [date]" or "Pasted
  [date]", and "The cards below read this list. Uploading or pasting another one replaces it
  here."
- An icon, not a picture of the sheet: the Preview card right under it shows the rows, and a
  drawn thumbnail would be imagery of Claude's own (decision 0041).
- The title-row summary keeps the file name, so the closed card still says it.
- Nothing changes before the first upload: the form alone, with "Your file".

The tile is a new piece of the design system (docs/design-system.md). Copy in docs/copy/app.md.
