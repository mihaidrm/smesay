// E3-8, acceptance 5: every icon in the curated set is a Lucide component, the keys are
// unique, and a key off the list reads as no icon.
import * as lucide from "lucide-react";
import { describe, expect, it } from "vitest";
import { isProjectIcon, PROJECT_ICONS, projectIcon } from "./project-icons";

describe("the project icons", () => {
  it("are 24 Lucide components with unique keys and labels", () => {
    expect(PROJECT_ICONS).toHaveLength(24);
    expect(new Set(PROJECT_ICONS.map((i) => i.key)).size).toBe(24);
    expect(new Set(PROJECT_ICONS.map((i) => i.label)).size).toBe(24);
    for (const i of PROJECT_ICONS) {
      const name = (i.Icon as { displayName?: string }).displayName;
      expect(name, i.key).toBeTruthy();
      expect((lucide as Record<string, unknown>)[name!], `${i.key}: ${name}`).toBe(i.Icon);
    }
  });
  it("reads a key on the list and nothing else", () => {
    expect(projectIcon("plane")?.label).toBe("Plane");
    expect(projectIcon("rocket")).toBeNull();
    expect(projectIcon(null)).toBeNull();
    expect([isProjectIcon("heart"), isProjectIcon("Heart"), isProjectIcon(3), isProjectIcon(null)]).toEqual([true, false, false, false]);
  });
});
