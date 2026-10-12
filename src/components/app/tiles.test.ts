import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb } from "@/lib/contrast";
import { gradientFor, initials, TILE_STOPS } from "./tiles";

describe("initials", () => {
  it("takes the first letter of the first two words, upper case", () => {
    expect(initials("Marlow Group")).toBe("MG");
    expect(initials("acme corp ltd")).toBe("AC");
  });
  it("takes two letters of a one-word name and W for an empty one", () => {
    expect(initials("Example.test")).toBe("EX");
    expect(initials("  ")).toBe("W");
  });
  it("keeps a code point whole", () => {
    expect(initials("🦊 Fox")).toBe("🦊F");
    expect(initials("🦊")).toBe("🦊");
  });
});

describe("gradientFor", () => {
  it("is stable for a key and one of the eight gradients", () => {
    expect(gradientFor("proj_01ABC")).toBe(gradientFor("proj_01ABC"));
    expect(gradientFor("proj_01ABC")).toMatch(/^linear-gradient\(135deg,#[0-9A-F]{6},#[0-9A-F]{6}\)$/);
    expect(TILE_STOPS).toHaveLength(8);
  });
  it("spreads keys over the gradients, the three names that shared one before included", () => {
    expect(new Set(["YES", "Test 1", "BBC"].map(gradientFor)).size).toBeGreaterThan(1);
    const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
    expect(new Set(letters.map(gradientFor)).size).toBe(8);
  });
});

describe("the initials' ink on the gradients", () => {
  // The midpoint as CSS blends two hex colours: channel by channel in sRGB (CSS Color 4,
  // w3.org/TR/css-color-4, Changes: "Interpolation between legacy sRGB colors is (once again)
  // in sRGB space, for compatibility.").
  const mid = (a: string, b: string) => {
    const [x, y] = [hexToRgb(a), hexToRgb(b)];
    return "#" + x.map((v, i) => Math.round((v + y[i]) / 2).toString(16).padStart(2, "0")).join("");
  };
  it("reads at 4.5 or better on every stop and every midpoint (WCAG 2.1, 1.4.3)", () => {
    for (const [a, b] of TILE_STOPS) {
      for (const colour of [a, b, mid(a, b)]) expect(contrastRatio("#15131F", colour), `${a} to ${b}: ${colour}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
