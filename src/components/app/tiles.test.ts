import { describe, expect, it } from "vitest";
import { gradientFor, initials } from "./tiles";

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
  it("is stable for a name and one of the four gradients", () => {
    expect(gradientFor("Clinic scheduling")).toBe(gradientFor("Clinic scheduling"));
    expect(gradientFor("Clinic scheduling")).toMatch(/^linear-gradient\(135deg,#[0-9A-F]{6},#[0-9A-F]{6}\)$/);
  });
  it("spreads names over the gradients", () => {
    const set = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map(gradientFor));
    expect(set.size).toBeGreaterThan(1);
  });
});
