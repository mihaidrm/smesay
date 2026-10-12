# 0066 The project tile takes an icon and a colour the PM picks, 2026-10-12

Mihai, 2026-10-12, after the initials tiles of design note 126: "maybe letting the user put
an icon or something? to choose from something fun? or think of a nice interaction". Claude
proposed stories/E3-8 and design note 131 (PR 194) and asked for a yes or no. Mihai: "yes".

Decision:
- E3-8 is built as written: the tile on each row of the Projects list is a button that opens
  a popover with 24 Lucide icons and the eight gradients of design note 126; a press sets
  either and saves at once; "Back to the initials" drops the icon; the project header shows
  the tile at 24 px beside the name; the icon and the colour travel with the whole-project
  export.
- The icon set and the colour names are Claude's picks under decision 0044, recorded in
  docs/review-list.md: the 24 icons are the ones of design note 131, and the colours are
  named by their stops ("Coral to sun", "Sun to lavender", and the two soft ones "Coral,
  soft" and "Mint, soft").
- The popover stays open after a pick, so the PM sets the icon and the colour in one visit;
  Escape, Tab, a press outside or the tile again closes it. Claude's reading of "a nice
  interaction", recorded in the review list.
- updated_at does not move on a pick: the Updated column keeps reading the last context
  save, archive or unarchive (docs/copy/app.md).

Consequences: migration 0039 (project.icon, project.tile), src/lib/project-icons.ts,
src/lib/tile-picker.ts, src/components/app/tiles.tsx, the picker in src/app/app/(shell)/
project-tile-picker.tsx, setTile in src/lib/projects.ts and setTileAction, the whole-project
export and import, e2e/projects.spec.ts, docs/copy/app.md and errors.md,
docs/design-system.md, docs/assets.md, INTERFACES.md, docs/schema.md, stories/E3-8, design
note 131, the review list.
