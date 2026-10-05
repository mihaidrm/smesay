// Every card keeps 16 px between its border and what is inside (docs/design-system.md, Card:
// "16 padding"). The card utility sets no padding (src/app/globals.css), so each use carries a
// padding class, or is listed here because its own children carry it (a header row and a body
// with px-4, or a table whose cells are padded). Text against a card's border reached Build
// and Share on 2026-10-05 because nothing checked this.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${dir}/${e.name}`) : e.name.endsWith(".tsx") ? [`${dir}/${e.name}`] : []));
// Cards whose children carry the padding: file and the card's own class string.
const PADDED_BY_CHILDREN = new Set([
  "src/app/app/(shell)/settings/page.tsx|card",
  "src/app/app/(shell)/settings/data.tsx|card",
  "src/app/app/(shell)/projects/[projectId]/import/mapping.tsx|flex flex-col card",
  "src/app/app/(shell)/projects/[projectId]/import/check-card.tsx|@container flex flex-col card",
  "src/app/app/(shell)/page.tsx|card overflow-hidden",
  "src/app/admin/page.tsx|card overflow-x-auto",
  "src/app/admin/workspaces/page.tsx|card overflow-x-auto",
  "src/app/admin/people/page.tsx|card overflow-x-auto",
  "src/app/admin/audit/page.tsx|card overflow-x-auto",
]);

describe("cards", () => {
  it("each card has its padding, or its children do", () => {
    const missing: string[] = [];
    for (const file of files("src")) {
      for (const m of readFileSync(file, "utf8").matchAll(/className=\{?["`]([^"`]*)["`]/g)) {
        const cls = m[1];
        if (!/(^|\s)card(\s|$)/.test(cls)) continue;
        if (/(^|\s)(p|px|py)-/.test(cls)) continue;
        if (!PADDED_BY_CHILDREN.has(`${file}|${cls}`)) missing.push(`${file}: "${cls}"`);
      }
    }
    expect(missing).toEqual([]);
  });
});
