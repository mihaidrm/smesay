import { describe, expect, it } from "vitest";
import { contrastLabel, contrastRatio, hexToRgb } from "./contrast";
import { tokens } from "./tokens";

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for a colour on itself", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#0E6B63", "#0E6B63")).toBe(1);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#16181C", "#FFFFFF")).toBe(contrastRatio("#FFFFFF", "#16181C"));
  });

  it("rejects anything that is not #RRGGBB", () => {
    expect(() => hexToRgb("#abc")).toThrow();
    expect(() => hexToRgb("teal")).toThrow();
  });
});

// The figures printed in docs/design-system.md, Colour. If a token changes, these change.
describe("design system figures", () => {
  const cases: [string, string, string][] = [
    [tokens.ink, tokens.white, "17.77"],
    [tokens.inkMuted, tokens.white, "6.32"],
    [tokens.inkMuted, tokens.greige, "5.26"],
    [tokens.teal700, tokens.white, "6.36"],
    [tokens.teal700, tokens.greige, "5.29"],
    [tokens.teal300, tokens.ink, "10.02"],
    [tokens.teal700, tokens.ink, "2.79"],
    [tokens.hairlineStrong, tokens.white, "1.69"],
  ];
  it.each(cases)("%s on %s is %s", (fg, bg, expected) => {
    expect(contrastLabel(fg, bg)).toBe(expected);
  });

  it("every status text passes 4.5 on its tint", () => {
    for (const s of Object.values(tokens.status)) {
      expect(contrastRatio(s.text, s.tint)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("matches the status table", () => {
    expect(contrastLabel(tokens.status.agree.text, tokens.status.agree.tint)).toBe("6.25");
    expect(contrastLabel(tokens.status.pushedBack.text, tokens.status.pushedBack.tint)).toBe("6.15");
    expect(contrastLabel(tokens.status.unclear.text, tokens.status.unclear.tint)).toBe("8.20");
    expect(contrastLabel(tokens.status.missing.text, tokens.status.missing.tint)).toBe("7.27");
    expect(contrastLabel(tokens.status.disagree.text, tokens.status.disagree.tint)).toBe("7.82");
  });
});
