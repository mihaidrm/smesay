import { describe, expect, it } from "vitest";
import { isRecognised, normaliseValue } from "./values";

describe("normaliseValue (stories/E3-3, acceptance 4)", () => {
  it("maps MoSCoW words and letters to the scale, whatever the case", () => {
    for (const [raw, value] of [["Must", "Must"], ["m", "Must"], ["SHOULD", "Should"], ["S", "Should"], ["could", "Could"], ["C", "Could"], ["Won't", "Won't"], ["wont", "Won't"], ["W", "Won't"], ["Not needed", "Won't"], ["Must have", "Must"], ["Won’t", "Won't"]]) {
      expect(normaliseValue(raw), raw).toEqual({ value, scale: "moscow" });
    }
  });
  it("maps 1 to 5 to the fit scale and keep, change, drop to kcd", () => {
    expect(normaliseValue(" 3 ")).toEqual({ value: "3", scale: "fit" });
    expect(normaliseValue("Keep")).toEqual({ value: "keep", scale: "kcd" });
    expect(normaliseValue("DROP")).toEqual({ value: "drop", scale: "kcd" });
  });
  it("keeps anything else as written, and counts it as not recognised", () => {
    expect(normaliseValue(" High ")).toEqual({ value: "High", scale: null });
    expect(normaliseValue("6")).toEqual({ value: "6", scale: null });
    expect(isRecognised("High")).toBe(false);
    expect(isRecognised("")).toBe(true);
    expect(isRecognised("Must")).toBe(true);
  });
});
