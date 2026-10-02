import { describe, expect, it } from "vitest";
import { CONTEXT_MAX, contextCount, contextError, contextLength } from "@/lib/project-context";

describe("project context", () => {
  it("counts both parts together and prints the count", () => {
    expect(contextLength("abc", "de")).toBe(5);
    expect(contextCount("abc", "de")).toBe("5 of 2,000 characters");
    expect(contextCount("", "")).toBe("0 of 2,000 characters");
  });
  it("refuses above 2,000 with the message from docs/copy", () => {
    expect(contextError("a".repeat(CONTEXT_MAX), "")).toBeNull();
    expect(contextError("a".repeat(CONTEXT_MAX), "b")).toBe("Your project context is 2,001 characters. Shorten it to 2,000 or fewer.");
  });
});
