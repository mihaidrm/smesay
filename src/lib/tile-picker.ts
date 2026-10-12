// The tile picker's list and keyboard (stories/E3-8, acceptance 1): the 24 icons in rows of
// eight, the eight colours in one row, then "Back to the initials"; one flat list, so the
// arrow keys walk it as the menu pattern asks (w3.org/WAI/ARIA/apg/patterns/menu/): Right and
// Left one item with wrap, Down and Up one row where a row is there and the last or first item
// where not, Home and End the ends. Pure, for the unit test; the component holds the focus.
import { PROJECT_ICONS } from "@/lib/project-icons";
import { TILE_NAMES } from "@/components/app/tiles";

export const PICKER_COLUMNS = 8;

export type PickerItem = { kind: "icon"; key: string; label: string } | { kind: "tile"; index: number; label: string } | { kind: "reset"; label: string };

export function pickerItems(reset: string): PickerItem[] {
  return [
    ...PROJECT_ICONS.map((i) => ({ kind: "icon" as const, key: i.key, label: i.label })),
    ...TILE_NAMES.map((label, index) => ({ kind: "tile" as const, index, label })),
    { kind: "reset", label: reset },
  ];
}

export function moveFocus(at: number, key: string, total: number, cols = PICKER_COLUMNS): number {
  if (total <= 0) return 0;
  const last = total - 1;
  switch (key) {
    case "ArrowRight": return at >= last ? 0 : at + 1;
    case "ArrowLeft": return at <= 0 ? last : at - 1;
    case "ArrowDown": return at + cols <= last ? at + cols : last;
    case "ArrowUp": return at - cols >= 0 ? at - cols : 0;
    case "Home": return 0;
    case "End": return last;
    default: return at;
  }
}
