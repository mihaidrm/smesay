// The guide's lines and docs/copy/guide.md say the same (stories/E15-1, acceptances 2 and 5):
// every id of the copy file is in the code with the same pose, line and action, no id is
// twice, no line is longer than 140 characters, and the code has no id the file lacks.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GUIDE_COPY, GUIDE_LINES, TIP_IDS } from "@/lib/guide-lines";
import { GUIDE_TIPS } from "@/lib/analytics-catalogue";

const file = readFileSync(path.join(process.cwd(), "docs", "copy", "guide.md"), "utf8");
// The rows of the four id tables: | id | pose | condition or screen | line | action |.
const rows = file.split("\n").filter((l) => /^\| [a-z]+\.[a-zA-Z]+ \|/.test(l)).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));

describe("the guide's lines", () => {
  it("match docs/copy/guide.md row for row", () => {
    const ids = rows.map((r) => r[0]);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...TIP_IDS].sort());
    for (const [id, pose, , line, action] of rows) {
      const code = GUIDE_LINES[id as keyof typeof GUIDE_LINES];
      expect(code.pose, id).toBe(pose);
      expect(code.line, id).toBe(line);
      const fileAction = /^none/.test(action) ? null : action;
      expect(code.action, id).toBe(fileAction);
      expect(line.length, id).toBeLessThanOrEqual(140);
    }
  });

  it("names the card, the steps and the switch as the file does", () => {
    const flat = file.replace(/\s+/g, " ");
    expect(flat).toContain(`Card title: ${GUIDE_COPY.pathTitle}.`);
    expect(flat).toContain(`Steps: ${Object.values(GUIDE_COPY.steps).join(", ")}.`);
    expect(flat).toContain(`Line under the steps: ${GUIDE_COPY.then}.`);
    expect(file).toContain(`| Switch in the sidebar footer, above the mode toggle | ${GUIDE_COPY.showTips} |`);
    expect(file).toContain(`| Dismiss on every card | ${GUIDE_COPY.dismiss} |`);
    expect(file).toContain(`| The card's name for screen readers | ${GUIDE_COPY.cardName} |`);
    expect(file).toContain(`| ${GUIDE_COPY.done} (ticked); ${GUIDE_COPY.next} (the next step) |`);
    expect(file).toContain(`| ${GUIDE_COPY.notSaved} |`);
    expect(flat).toContain(`secondary: ${GUIDE_COPY.sampleFirst}`);
  });

  it("gives the analytics catalogue the same ids", () => {
    expect([...GUIDE_TIPS].sort()).toEqual([...TIP_IDS].sort());
  });
});
