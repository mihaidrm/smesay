// Every admin page, layout, route and action file runs the admin check (stories/E14-1,
// acceptance 1: one function, src/lib/admin.ts requireAdmin, used by every admin page and
// action), and every page is in the list the 404 test walks (e2e/admin-routes.ts).
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_ROUTES } from "../../../e2e/admin-routes";

const ROOT = path.join(process.cwd(), "src", "app", "admin");
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = path.join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(ROOT).filter((f) => !/\.test\.tsx?$/.test(f));

describe("the admin area", () => {
  it("checks the admin rule in every page, layout, route and action", () => {
    const entries = files.filter((f) => /(^|\/)(page|layout|route)\.tsx?$/.test(f) || /"use server"/.test(readFileSync(f, "utf8")));
    expect(entries.length).toBeGreaterThanOrEqual(3);
    for (const f of entries) expect(readFileSync(f, "utf8"), path.relative(ROOT, f)).toMatch(/await requireAdmin\(\)/);
  });

  it("lists every page for the 404 test", () => {
    const pages = files.filter((f) => /\/page\.tsx$/.test(f)).map((f) => "/admin" + path.dirname(path.relative(ROOT, f)).replace(/^\.$/, "").replace(/^(?=.)/, "/"));
    const pattern = (p: string) => new RegExp("^" + p.replace(/\[[^\]]+\]/g, "[^/]+") + "$");
    for (const p of pages) expect(ADMIN_ROUTES.some((r) => pattern(p).test(r)), `${p} is not in e2e/admin-routes.ts`).toBe(true);
  });
});
