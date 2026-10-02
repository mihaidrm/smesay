import { describe, expect, it } from "vitest";
import { chooseWorkspace } from "@/lib/workspace-choice";

const A = { id: "a" }, B = { id: "b" };

describe("chooseWorkspace", () => {
  it("creates with no membership", () => {
    expect(chooseWorkspace([], null)).toEqual({ kind: "create" });
    expect(chooseWorkspace([], "a")).toEqual({ kind: "create" });
  });
  it("keeps a stored id that is one of the memberships", () => {
    expect(chooseWorkspace([A, B], "b")).toEqual({ kind: "current", workspace: B });
  });
  it("selects the only membership on a fresh session", () => {
    expect(chooseWorkspace([A], null)).toEqual({ kind: "select", workspace: A });
  });
  it("asks when a fresh session has several memberships", () => {
    expect(chooseWorkspace([A, B], null)).toEqual({ kind: "switch" });
  });
  it("asks when the stored workspace is no longer a membership, even with one left", () => {
    expect(chooseWorkspace([A], "b")).toEqual({ kind: "switch" });
    expect(chooseWorkspace([A, B], "c")).toEqual({ kind: "switch" });
  });
});
