// The guide's rules (stories/E15-1 acceptance 5, E15-2 acceptance 5): a dismissed tip or tips
// off never shows; the path's next step and its line follow the data; the path goes for good
// a day after the first link.
import { describe, expect, it } from "vitest";
import { pathHidden, pathView, tipVisible } from "@/lib/guide";
import type { FirstProjectFacts } from "@/db/queries/guide";

const none: FirstProjectFacts = { project: null, hasSet: false, shaped: false, built: false, published: false, firstPublishedAt: null };
const p = { id: "p1", name: "Expenses" };

describe("tipVisible", () => {
  it("hides a dismissed tip and every tip when tips are off", () => {
    expect(tipVisible({ tipsOff: false, dismissed: [] }, "import.empty")).toBe(true);
    expect(tipVisible({ tipsOff: false, dismissed: ["import.empty"] }, "import.empty")).toBe(false);
    expect(tipVisible({ tipsOff: true, dismissed: [] }, "import.empty")).toBe(false);
  });
});

describe("pathHidden", () => {
  it("hides the path with tips off or any of its lines dismissed", () => {
    expect(pathHidden({ tipsOff: false, dismissed: [] })).toBe(false);
    expect(pathHidden({ tipsOff: false, dismissed: ["path.shape"] })).toBe(true);
    expect(pathHidden({ tipsOff: true, dismissed: [] })).toBe(true);
    expect(pathHidden({ tipsOff: false, dismissed: ["import.empty"] })).toBe(false);
  });
});

describe("pathView", () => {
  const now = new Date("2026-10-05T12:00:00Z");
  it("walks the four steps from the data", () => {
    expect(pathView(none, now)).toEqual({ tip: "path.start", projectId: null, ticked: { import: false, shape: false, build: false, share: false } });
    expect(pathView({ ...none, project: p }, now)?.tip).toBe("path.import");
    expect(pathView({ ...none, project: p, hasSet: true }, now)?.tip).toBe("path.shape");
    expect(pathView({ ...none, project: p, hasSet: true, shaped: true }, now)?.tip).toBe("path.build");
    expect(pathView({ ...none, project: p, hasSet: true, shaped: true, built: true }, now)).toEqual({ tip: "path.share", projectId: "p1", ticked: { import: true, shape: true, build: true, share: false } });
  });

  it("says done for a day after the first link, then goes for good", () => {
    const all = { project: p, hasSet: true, shaped: true, built: true, published: true };
    expect(pathView({ ...all, firstPublishedAt: new Date("2026-10-05T01:00:00Z") }, now)?.tip).toBe("path.done");
    expect(pathView({ ...all, firstPublishedAt: new Date("2026-10-04T11:59:00Z") }, now)).toBeNull();
    // A workspace with a live link whose newest project is a new draft: no path (a member
    // joining a live workspace is not onboarded).
    expect(pathView({ ...none, project: p, firstPublishedAt: new Date("2026-10-05T11:00:00Z") }, now)).toBeNull();
  });
});
