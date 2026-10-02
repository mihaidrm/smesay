// The "next" parameter never leaves the site (stories/E2-1, acceptance 5; audit finding of
// 2026-10-02: a tab inside the path made "/\t/evil.example" resolve to another host).
import { describe, expect, it } from "vitest";
import { isSafePath, safeNextPath } from "@/lib/safe-path";

const REFUSED = [
  "", "app", "https://evil.example/", "//evil.example", "/\\evil.example", "/\t/evil.example",
  "/\n/evil.example", "/\r/evil.example", "/%2F/evil.example", "/%5c/evil.example", "javascript:alert(1)",
  "/app\u0000", "\\\\evil.example",
];
const ALLOWED = ["/", "/app", "/app/projects/1?tab=items", "/app#top", "/app?next=%2Fother"];

describe("safeNextPath", () => {
  it.each(REFUSED)("falls back for %j", (value) => {
    expect(isSafePath(value)).toBe(false);
    expect(safeNextPath(value)).toBe("/app");
  });
  it.each(ALLOWED)("keeps %j", (value) => {
    expect(isSafePath(value)).toBe(true);
    expect(safeNextPath(value)).toBe(value);
  });
  it("never resolves to another origin", () => {
    for (const value of [...REFUSED, ...ALLOWED]) {
      const target = safeNextPath(value);
      expect(new URL(target, "http://localhost:3000").origin).toBe("http://localhost:3000");
    }
  });
  it("uses the given fallback", () => {
    expect(safeNextPath(undefined, "/")).toBe("/");
    expect(safeNextPath(null)).toBe("/app");
  });
});
