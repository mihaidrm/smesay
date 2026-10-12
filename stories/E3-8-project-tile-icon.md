# E3-8 Project tile: an icon and a colour the PM picks

User: a PM with several projects who wants to tell them apart at a glance
Status: deferred until Mihai decides (proposed 2026-10-12, design note 131)
Outcome: a project's tile shows an icon and a colour the PM chose, and until then its
initials on the colour its id picks (design note 126), everywhere the project is named with a
tile.

## Acceptance criteria
1. The tile in the Projects list is a button, "Choose the icon and colour of [PROJECT]". It
   opens a popover under the tile with two rows: 24 icons from Lucide (the set in
   src/lib/project-icons.ts, named in docs/assets.md; ISC, already in the app) and the eight
   gradients of design note 126, the current pick marked, plus "Back to the initials", which
   drops the icon. Arrow keys move, Enter picks, Escape closes (the menu pattern of the WAI-ARIA
   Authoring Practices, w3.org/WAI/ARIA/apg/patterns/menu/).
2. A pick saves at once through a server action that takes the workspace from the session (a
   project of another workspace answers 404, as every helper does) and shows on every tile of
   that project: the list, and the project header's title row, which gains the tile at 24 px
   beside the name. The tile pops once on a pick (scale 1 to 1.12 and back over 240 ms), not
   under reduced motion.
3. Without a pick the tile shows the initials on the gradient the id picks. The sample keeps
   its dashed outline and its initials and cannot be changed; its tile is not a button.
4. The icon and the colour travel with the project in the whole-project export and import
   (E10-2, ProjectExport in INTERFACES.md), optional on import.
5. Playwright: pick an icon and a colour on the list, see them on the row and in the header,
   reload, still there. Unit tests: every name in the curated set exists in lucide-react; the
   popover's keyboard moves; a user in workspace A cannot change a project of workspace B.

## Out of scope
- Uploading an image as the icon: the workspace's logo (E2-5) is the one uploaded image.
- Emoji as icons: they differ by operating system and are not from the assets list
  (decision 0041).
- A colour outside the eight gradients.

## Open questions
- Mihai decides whether to build it (the proposal of 2026-10-12, design note 131, which holds
  the alternatives). Nothing blocks building once he says yes.

## Technical notes
- Migration: project.icon text null (a name from the curated set), project.tile smallint
  null (0 to 7, the gradient's index); docs/schema.md follows from the snapshot.
- src/lib/project-icons.ts holds the 24 names and their plain-English labels for the
  popover's accessible names ("Briefcase", "Receipt", "Plane", ...).
- The popover is the app's own (no Popover in src/components/ui yet): a line in
  docs/design-notes/ when it is added, per the PM side's rule.
