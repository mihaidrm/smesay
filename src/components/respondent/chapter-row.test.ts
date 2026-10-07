// The chapter row's two-row rule (design note 115): one row while the pills fit, otherwise
// the width of the wider half, so the list wraps onto two rows and never more.
import { describe, expect, it } from "vitest";
import { twoRowWidth } from "./chapter-row";

describe("twoRowWidth", () => {
  it("keeps one row while the pills and their 6 px gaps fit the room", () => {
    expect(twoRowWidth([100, 100, 100], 312)).toBeNull();
    expect(twoRowWidth([100, 100, 100], 311)).not.toBeNull();
    expect(twoRowWidth([500], 100)).toBeNull();
    expect(twoRowWidth([], 100)).toBeNull();
  });
  it("takes the wider half of the pills, plus a pixel, so the first half fills the first row", () => {
    // 5 pills: the first half is 3 (100 + 100 + 100 + 2 gaps = 312), the second 2 (200 + 200 + 1 gap = 406).
    expect(twoRowWidth([100, 100, 100, 200, 200], 500)).toBe(407);
    // 4 equal pills: each half is 206.
    expect(twoRowWidth([100, 100, 100, 100], 400)).toBe(207);
    // Fractions round up before the pixel.
    expect(twoRowWidth([100.4, 100.4, 50, 50], 300)).toBe(208);
  });
});
