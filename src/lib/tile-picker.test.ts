// E3-8, acceptance 1 and 5: the picker's list is the 24 icons, the eight colours and Back to
// the initials, and the arrow keys walk it as the menu pattern asks.
import { describe, expect, it } from "vitest";
import { moveFocus, PICKER_COLUMNS, pickerItems } from "./tile-picker";

describe("pickerItems", () => {
  it("lists 24 icons, 8 colours and the reset, in that order", () => {
    const items = pickerItems("Back to the initials");
    expect(items).toHaveLength(33);
    expect(items.map((i) => i.kind)).toEqual([...Array<string>(24).fill("icon"), ...Array<string>(8).fill("tile"), "reset"]);
    expect(items[24]).toEqual({ kind: "tile", index: 0, label: "Coral to sun" });
    expect(items[32]).toEqual({ kind: "reset", label: "Back to the initials" });
  });
});

describe("moveFocus", () => {
  const n = 33;
  it("moves one item with Right and Left, wrapping at the ends", () => {
    expect(moveFocus(0, "ArrowRight", n)).toBe(1);
    expect(moveFocus(32, "ArrowRight", n)).toBe(0);
    expect(moveFocus(1, "ArrowLeft", n)).toBe(0);
    expect(moveFocus(0, "ArrowLeft", n)).toBe(32);
  });
  it("moves one row with Down and Up, the last or first item where no row is there", () => {
    expect(PICKER_COLUMNS).toBe(8);
    expect(moveFocus(0, "ArrowDown", n)).toBe(8);
    expect(moveFocus(20, "ArrowDown", n)).toBe(28);
    expect(moveFocus(28, "ArrowDown", n)).toBe(32);
    expect(moveFocus(32, "ArrowDown", n)).toBe(32);
    expect(moveFocus(32, "ArrowUp", n)).toBe(24);
    expect(moveFocus(9, "ArrowUp", n)).toBe(1);
    expect(moveFocus(3, "ArrowUp", n)).toBe(0);
  });
  it("jumps with Home and End and stays on any other key", () => {
    expect(moveFocus(17, "Home", n)).toBe(0);
    expect(moveFocus(17, "End", n)).toBe(32);
    expect(moveFocus(17, "a", n)).toBe(17);
    expect(moveFocus(17, "Enter", n)).toBe(17);
  });
});
