# E4-2 Group items into areas and order the areas, with a one-line rationale each

User: a PM whose list has no structure, or a structure that does not read well
Status: built
Outcome: every item lands in exactly one area, the areas are ordered with a reason each, and
the PM can move items between areas.

## Acceptance criteria
1. Shape (PM app board) shows the areas in order, each with its rationale ("This comes first, because
   every claim starts here.") and its items. Every item is in exactly one area; a test on the
   golden set output checks the partition.
2. When the import carried an area column, the model keeps those areas and names, and only
   proposes an order and rationale; items without an area are placed and marked "placed by
   AI". When no column exists, the model proposes 3 to 8 areas.
3. The PM can drag an item to another area, or use a "Move to" menu (keyboard reachable); the
   change is saved within one second and shown in the preview panel (E5-6). Moves are the
   PM's: a later re-run of shaping does not undo them.
4. "Shape with AI" runs once per set version by default; "Run again" exists and replaces
   suggested, not accepted, values (E4-3 rules apply to text; areas are replaced only for items
   the PM has not moved).
5. The golden set runner (E4-6) reports areas matched by name or alias for all ten specs.

## Out of scope
- Reader versions: E4-3. Flags: E4-4.

## Open questions
- None.

## Technical notes
Output schema in evals/schema.json (INTERFACES.md, AI shaping output): `{ areas: [{ name,
rationale, items: [ref] }], items: [{ ref, reader, flags }] }`. Area names are stored on
item.area and item.area_rationale per item in v1; an areas table is not needed until R2.
Drag and drop: the browser's own API with a "Move to" select as the keyboard path, no library
(design note 27 has the research check on dnd-kit; Mihai decides whether a library comes with
E5's builder). One answer carries at most 400 items (design note 27).

Amended 2026-10-07 (stories/E4-8, design note 113, decision 0044): while a run is pending
the thinking state shows under the button ("Reading [N] items", "Grouping them into areas",
"Writing a readable version of each"); a refusal shows in the danger tint with an alert
icon, and the developer menu's "Off" adds its own refusal; after a run by the menu's
stand-in the grouped line ends with "These areas and readable versions came from the
stand-in, not the AI."; a refusal for "Off" writes no shape_failed event, so the rescue tip
(E15-4) does not fire for it.
