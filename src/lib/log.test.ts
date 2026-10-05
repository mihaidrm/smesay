// The logger's allow-list (stories/E11-5, acceptance 3): only the listed fields are printed,
// whatever a caller passes.
import { describe, expect, it, vi } from "vitest";
import { formatLine, log, type LogFields } from "./log";

describe("log", () => {
  it("prints the sentence and the allowed fields only", () => {
    const fields = { workspace: "w1", count: 3, email: "ana@firma.ro", name: "Ana", reason: undefined } as LogFields;
    expect(formatLine("jobs:purge removed a workspace.", fields)).toBe("jobs:purge removed a workspace. workspace=w1 count=3");
    expect(formatLine("A line.")).toBe("A line.");
    expect(formatLine("A line.", { detail: "two\nlines" })).toBe("A line. detail=two lines");
    // A value goes through the error report's scrub (src/lib/scrub.ts).
    expect(formatLine("It failed.", { error: "No invite for ana@firma.ro", count: 2 })).toBe("It failed. error=No invite for [removed] count=2");
  });
  it("sends errors to stderr and the rest to stdout", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    log("error", "It failed.", { step: "rows" });
    log("info", "It ran.");
    expect(error).toHaveBeenCalledWith("It failed. step=rows");
    expect(info).toHaveBeenCalledWith("It ran.");
    error.mockRestore(); info.mockRestore();
  });
});
