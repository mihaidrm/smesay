// The two sides of the accent control (design note 104): the hex field as typed to the
// picker's value, and a picked value back to the hex the app writes.
import { describe, expect, it } from "vitest";
import { DEFAULT_ACCENT, pickedHex, pickerValue } from "@/lib/brand-rules";

describe("the accent picker and the hex field", () => {
  it("gives the picker a 7-character lowercase hex for a valid field", () => {
    expect(pickerValue("#1F4F7A")).toBe("#1f4f7a");
    expect(pickerValue("  #1f4f7a ")).toBe("#1f4f7a");
  });
  it("gives the picker the default violet when the field is empty", () => {
    expect(pickerValue("")).toBe("#6d4cf5");
    expect(pickerValue("   ")).toBe(DEFAULT_ACCENT.toLowerCase());
  });
  it("gives null for a partial or invalid field, so the picker keeps its last colour", () => {
    expect(pickerValue("#1F4")).toBeNull();
    expect(pickerValue("1F4F7A")).toBeNull();
    expect(pickerValue("blue")).toBeNull();
    expect(pickerValue("#1F4F7A1")).toBeNull();
  });
  it("writes a picked value in upper case, as the server stores it", () => {
    expect(pickedHex("#1f4f7a")).toBe("#1F4F7A");
    expect(pickedHex("#6d4cf5")).toBe(DEFAULT_ACCENT);
  });
  it("round-trips", () => {
    expect(pickedHex(pickerValue("#AbCdEf")!)).toBe("#ABCDEF");
    expect(pickerValue(pickedHex("#abcdef"))).toBe("#abcdef");
  });
});
