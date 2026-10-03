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

// The figures printed in docs/design-system.md, Colour (design v2). If a token changes, these
// change.
describe("design system figures", () => {
  const L = tokens.light;
  const D = tokens.dark;
  const cases: [string, string, string][] = [
    [L.ink, L.ground, "17.06"],
    [L.inkMuted, L.surface, "6.60"],
    [L.inkMuted, L.ground, "6.14"],
    [L.inkSoft, L.surface, "10.84"],
    [L.violet, L.surface, "5.25"],
    [L.violetText, L.surface, "6.69"],
    ["#FFFFFF", L.violet, "5.25"],
    [L.violetText, L.violetSoft, "5.69"],
    [L.coralText, L.coralSoft, "6.12"],
    [L.mintText, L.mintSoft, "5.75"],
    [L.sunText, L.sunSoft, "5.37"],
    [L.danger, L.surface, "7.53"],
    [L.hairlineStrong, L.surface, "1.58"],
    [D.ink, D.ground, "15.98"],
    [D.inkMuted, D.surface, "6.82"],
    [D.inkMuted, D.raised, "6.07"],
    [D.violet, D.surface, "5.67"],
    [D.violetText, D.surface, "7.89"],
    [D.violetText, D.violetSoft, "6.33"],
    [D.coralText, D.coralSoft, "6.31"],
    [D.mintText, D.mintSoft, "7.69"],
    [D.sunText, D.sunSoft, "9.27"],
    [D.danger, D.surface, "7.16"],
    [D.ground, D.violet, "6.17"],
  ];
  it.each(cases)("%s on %s is %s", (fg, bg, expected) => {
    expect(contrastLabel(fg, bg)).toBe(expected);
  });

  it("every text pair of both modes passes 4.5, the strong hairline aside (never text)", () => {
    for (const [fg, bg] of cases) {
      if (fg === L.hairlineStrong) continue;
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("every status text passes 4.5 on its tint and, on dark, on the surface", () => {
    for (const s of Object.values(tokens.status)) {
      expect(contrastRatio(s.text, s.tint)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(s.dark.text, s.dark.tint)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(s.dark.text, D.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("matches the status table", () => {
    expect(contrastLabel(tokens.status.agree.text, tokens.status.agree.tint)).toBe("6.25");
    expect(contrastLabel(tokens.status.pushedBack.text, tokens.status.pushedBack.tint)).toBe("6.15");
    expect(contrastLabel(tokens.status.unclear.text, tokens.status.unclear.tint)).toBe("8.20");
    expect(contrastLabel(tokens.status.missing.text, tokens.status.missing.tint)).toBe("7.27");
    expect(contrastLabel(tokens.status.disagree.text, tokens.status.disagree.tint)).toBe("7.82");
    expect(contrastLabel(tokens.status.agree.dark.text, tokens.status.agree.dark.tint)).toBe("6.91");
    expect(contrastLabel(tokens.status.pushedBack.dark.text, tokens.status.pushedBack.dark.tint)).toBe("6.96");
    expect(contrastLabel(tokens.status.unclear.dark.text, tokens.status.unclear.dark.tint)).toBe("5.93");
    expect(contrastLabel(tokens.status.missing.dark.text, tokens.status.missing.dark.tint)).toBe("5.54");
    expect(contrastLabel(tokens.status.disagree.dark.text, tokens.status.disagree.dark.tint)).toBe("5.94");
  });
});
