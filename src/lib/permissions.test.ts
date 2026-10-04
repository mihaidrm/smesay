import { describe, expect, it } from "vitest";
import { ACTIONS, can, OWNER_ONLY } from "@/lib/permissions";

describe("can", () => {
  it("lets an owner do everything", () => {
    for (const action of ACTIONS) expect(can("owner", action)).toBe(true);
  });
  it("lets a member run projects and nothing about the workspace, its members or billing", () => {
    for (const action of ACTIONS) expect(can("member", action)).toBe(!OWNER_ONLY.has(action));
    expect(can("member", "projects.create")).toBe(true);
    expect(can("member", "results.export")).toBe(true);
    expect(can("member", "workspace.rename")).toBe(false);
    expect(can("member", "members.invite")).toBe(false);
    expect(can("member", "members.remove")).toBe(false);
    expect(can("member", "billing.change")).toBe(false);
  });
  it("names the eight owner-only actions of the story (the budget left with decision 0036)", () => {
    expect([...OWNER_ONLY].sort()).toEqual(["billing.change", "members.invite", "members.remove", "members.role", "workspace.accent", "workspace.delete", "workspace.export", "workspace.logo", "workspace.rename"]);
  });
});
