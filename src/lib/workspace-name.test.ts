import { describe, expect, it } from "vitest";
import { defaultWorkspaceName, slugFromName, workspaceNameSchema, WORKSPACE_NAME_MAX } from "@/lib/workspace-name";

describe("defaultWorkspaceName", () => {
  it("is the part after the @, capitalised", () => {
    expect(defaultWorkspaceName("ana@marlow.example")).toBe("Marlow.example");
    expect(defaultWorkspaceName("mihai@gmail.com")).toBe("Gmail.com");
    expect(defaultWorkspaceName("x@y")).toBe("Y");
    expect(defaultWorkspaceName("no-at")).toBe("No-at");
    expect(defaultWorkspaceName("")).toBe("");
  });
});

describe("slugFromName", () => {
  it("lower-cases, hyphenates and strips accents", () => {
    expect(slugFromName("Marlow Group")).toBe("marlow-group");
    expect(slugFromName("  Alerty S.R.L. ")).toBe("alerty-s-r-l");
    expect(slugFromName("Școala Nouă")).toBe("scoala-noua");
    expect(slugFromName("!!!")).toBe("workspace");
  });
});

describe("workspaceNameSchema", () => {
  it("trims and bounds the name", () => {
    expect(workspaceNameSchema.safeParse("  Marlow Group ").data).toBe("Marlow Group");
    expect(workspaceNameSchema.safeParse("   ").success).toBe(false);
    expect(workspaceNameSchema.safeParse("a".repeat(WORKSPACE_NAME_MAX + 1)).success).toBe(false);
    expect(workspaceNameSchema.safeParse("a".repeat(WORKSPACE_NAME_MAX)).success).toBe(true);
  });
});
