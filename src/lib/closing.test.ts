// The closing rule (stories/E5-5, acceptance 2 and 4): confidence off is refused, the
// lengths, the em dash in the PM's words, the question absent when empty, the default
// sign-off.
import { describe, expect, it } from "vitest";
import { CLOSING_ERRORS, DEFAULT_CLOSING, DEFAULT_SIGN_OFF, parseClosing, signOffFor } from "./closing";

describe("parseClosing", () => {
  it("keeps the question out when empty, stores the sign-off as written, reads the switch", () => {
    expect(parseClosing("", "1", " I agree. ", "1")).toEqual({ closing: { confidence: true, missingForm: true, signOffText: "I agree." } });
    expect(parseClosing(" Anything else? ", "0", DEFAULT_SIGN_OFF, "on")).toEqual({ closing: { confidence: true, missingForm: false, signOffText: DEFAULT_SIGN_OFF, closingQuestion: "Anything else?" } });
    expect(parseClosing(undefined, undefined, "Yes.", true)).toEqual({ closing: { confidence: true, missingForm: false, signOffText: "Yes." } });
    // A form part that is not text reads as empty.
    expect(parseClosing(new Blob(["x"]), "1", "Yes.", "1")).toEqual({ closing: { confidence: true, missingForm: true, signOffText: "Yes." } });
    expect(parseClosing("", "1", new Blob(["x"]), "1")).toEqual({ error: CLOSING_ERRORS.badSignOff });
  });
  it("refuses confidence off, a long question, a bad sign-off and an em dash", () => {
    expect(parseClosing("", "1", "Yes.", "0")).toEqual({ error: CLOSING_ERRORS.confidenceOff });
    expect(parseClosing("", "1", "Yes.", undefined)).toEqual({ error: CLOSING_ERRORS.confidenceOff });
    expect(parseClosing("x".repeat(201), "1", "Yes.", "1")).toEqual({ error: CLOSING_ERRORS.longQuestion });
    expect(parseClosing("x".repeat(200), "1", "Yes.", "1")).toMatchObject({ closing: { closingQuestion: "x".repeat(200) } });
    expect(parseClosing("", "1", "", "1")).toEqual({ error: CLOSING_ERRORS.badSignOff });
    expect(parseClosing("", "1", "y".repeat(301), "1")).toEqual({ error: CLOSING_ERRORS.badSignOff });
    expect(parseClosing("", "1", `Yes ${String.fromCharCode(8212)} no.`, "1")).toEqual({ error: CLOSING_ERRORS.emDash });
    expect(parseClosing(`Why ${String.fromCharCode(8212)} how?`, "1", "Yes.", "1")).toEqual({ error: CLOSING_ERRORS.emDash });
  });
  it("reads the default sentence for an empty sign-off", () => {
    expect(signOffFor(DEFAULT_CLOSING)).toBe(DEFAULT_SIGN_OFF);
    expect(signOffFor({ ...DEFAULT_CLOSING, signOffText: "Mine." })).toBe("Mine.");
  });
});
