// The guide's rules (stories/E15-1 acceptance 5, E15-2 acceptance 5): a dismissed tip or tips
// off never shows; the path's next step and its line follow the data; the path goes for good
// a day after the first link.
import { describe, expect, it } from "vitest";
import { buildTip, importTip, pathHidden, pathView, shapeTip, shareTip, tipVisible, walkthroughOver } from "@/lib/guide";
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

describe("the step and rescue tips (E15-3, E15-4)", () => {
  const now = new Date("2026-10-05T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);
  const MIN = 60_000, DAY = 86_400_000;

  it("Import: no list, an upload to map, and the rescue from ten minutes", () => {
    expect(importTip({ hasSet: false, pending: null }, now)).toBe("import.empty");
    expect(importTip({ hasSet: true, pending: null }, now)).toBeNull();
    expect(importTip({ hasSet: false, pending: { createdAt: ago(9 * MIN) } }, now)).toBe("import.mapping");
    expect(importTip({ hasSet: true, pending: { createdAt: ago(9 * MIN + 59_000) } }, now)).toBe("import.mapping");
    expect(importTip({ hasSet: false, pending: { createdAt: ago(10 * MIN) } }, now)).toBe("rescue.mapping");
  });

  it("Shape: the rescue after a refused run on the newest list, then not run, then pending", () => {
    const t = (h: number) => new Date(now.getTime() - h * 3_600_000);
    const imp = t(5);
    expect(shapeTip({ hasSet: false, importedAt: imp, shapedAt: null, lastFailedAt: null, pending: 0 })).toBeNull();
    expect(shapeTip({ hasSet: true, importedAt: imp, shapedAt: null, lastFailedAt: null, pending: 0 })).toBe("shape.notRun");
    expect(shapeTip({ hasSet: true, importedAt: imp, shapedAt: null, lastFailedAt: t(1), pending: 0 })).toBe("rescue.shapeFailed");
    expect(shapeTip({ hasSet: true, importedAt: imp, shapedAt: t(2), lastFailedAt: t(1), pending: 0 })).toBe("rescue.shapeFailed");
    // A good run after the failure: the rescue goes.
    expect(shapeTip({ hasSet: true, importedAt: imp, shapedAt: t(1), lastFailedAt: t(2), pending: 3 })).toBe("shape.pending");
    expect(shapeTip({ hasSet: true, importedAt: imp, shapedAt: t(1), lastFailedAt: null, pending: 0 })).toBeNull();
    // A failure on the list before a re-import is not this list's.
    expect(shapeTip({ hasSet: true, importedAt: t(1), shapedAt: null, lastFailedAt: t(2), pending: 0 })).toBe("shape.notRun");
  });

  it("Build: the intro first, then the default fields", () => {
    const defaults = [{ key: "name", type: "text" }, { key: "role", type: "text" }];
    expect(buildTip({ intro: " ", fields: defaults })).toBe("build.intro");
    expect(buildTip({ intro: "Two lines.", fields: defaults })).toBe("build.fields");
    expect(buildTip({ intro: "Two lines.", fields: [{ key: "name", type: "text" }, { key: "role", type: "dropdown" }] })).toBeNull();
    expect(buildTip({ intro: "Two lines.", fields: [{ key: "name", type: "text" }] })).toBeNull();
  });

  it("Share: the draft, and the rescue from three days open with no response", () => {
    expect(shareTip({ publishedAt: null, open: false, openSince: null, responses: 0 }, now)).toBe("share.draft");
    expect(shareTip({ publishedAt: ago(5 * DAY), open: true, openSince: ago(3 * DAY - MIN), responses: 0 }, now)).toBeNull();
    expect(shareTip({ publishedAt: ago(3 * DAY), open: true, openSince: ago(3 * DAY), responses: 0 }, now)).toBe("rescue.noResponse");
    expect(shareTip({ publishedAt: ago(5 * DAY), open: true, openSince: ago(5 * DAY), responses: 1 }, now)).toBeNull();
    // Withdrawn, closed or not open yet: nobody could answer, so no rescue.
    expect(shareTip({ publishedAt: ago(5 * DAY), open: false, openSince: null, responses: 0 }, now)).toBeNull();
  });

  it("ends the sample walkthrough on any of its three dismissals or tips off", () => {
    expect(walkthroughOver({ tipsOff: false, dismissed: [] })).toBe(false);
    expect(walkthroughOver({ tipsOff: false, dismissed: ["sample.registers"] })).toBe(true);
    expect(walkthroughOver({ tipsOff: true, dismissed: [] })).toBe(true);
    expect(walkthroughOver({ tipsOff: false, dismissed: ["path.start"] })).toBe(false);
  });
});
