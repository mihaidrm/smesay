// contextBlock() (stories/E4-5, acceptance 1): both parts, one part, none; whitespace folded;
// the instruction sentence names nothing from the context.
import { describe, expect, it } from "vitest";
import { CONTEXT_INSTRUCTION, contextBlock, hasContext } from "./context";

describe("contextBlock", () => {
  it("writes the goal and the terms as one data section", () => {
    expect(contextBlock({ goal: "Replace the lift ticket system before December.", terms: "SkiPass+, Valley Card" })).toBe("PROJECT CONTEXT\nGoal and audience: Replace the lift ticket system before December.\nTerms to keep as written: SkiPass+, Valley Card");
  });
  it("leaves out a missing part and folds whitespace", () => {
    expect(contextBlock({ goal: null, terms: "  Gate 7,\n RFID " })).toBe("PROJECT CONTEXT\nTerms to keep as written: Gate 7, RFID");
    expect(contextBlock({ goal: " A goal ", terms: "" })).toBe("PROJECT CONTEXT\nGoal and audience: A goal");
  });
  it("gives nothing for an empty context", () => {
    expect(contextBlock({ goal: null, terms: null })).toBeNull();
    expect(contextBlock({ goal: "  ", terms: "\n" })).toBeNull();
    expect(hasContext({ goal: "", terms: " x" })).toBe(true);
  });
  it("keeps the instruction free of the context's words", () => {
    expect(CONTEXT_INSTRUCTION).toContain("Terms to keep as written");
    expect(CONTEXT_INSTRUCTION).not.toContain("SkiPass");
  });
});
