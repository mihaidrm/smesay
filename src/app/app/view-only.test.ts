// Every write of the PM app is refused during an admin's view (stories/E14-4, acceptance 2):
// every server action and every route that writes takes its workspace from
// requireWritableWorkspace or calls refuseWhileViewing first. The files are read as text, split
// into their top-level declarations (each starts at the left margin), and every exported action
// must reach the guard, directly or through a local helper that does, before anything else it
// awaits (signedIn() aside). Comments are left out. A new route under src/app that reads the
// workspace must either use the guard or be on the read-only list below.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.join(process.cwd(), "src", "app");
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = path.join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");
const GUARD = /\b(requireWritableWorkspace|refuseWhileViewing)\(/;
const isServerFile = (src: string) => /^\s*["']use server["'];?\s*$/m.test(src);
// Routes that read the workspace and write nothing: the live updates stream.
const READ_ONLY_ROUTES = ["api/projects/[projectId]/events/route.ts"];

// The top-level declarations of a file, each with its name and whether it is exported.
function declarations(src: string): { name: string; exported: boolean; body: string }[] {
  return strip(src).split(/^(?=(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let)\s)/m).slice(1).map((body) => {
    const m = /^(export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let)\s+(\w+)/.exec(body);
    return { name: m?.[2] ?? "", exported: Boolean(m?.[1]), body };
  });
}

// Reads that may come before the guard: the session check and the request headers.
const READS = new Set(["signedIn", "requireSession", "headers"]);
// The calls of the first statement that awaits anything but those reads: arguments run before
// the call, so `await invite(await actor(), x)` runs actor() first.
function firstAwaited(body: string): string[] {
  for (const t of body.split(/;|\n/)) {
    const awaited = [...t.matchAll(/await\s+(\w+)\(/g)].map((m) => m[1]);
    if (awaited.length && awaited.some((a) => !READS.has(a))) return [...t.matchAll(/(\w+)\(/g)].map((m) => m[1]);
  }
  return [];
}

export function unguarded(src: string): string[] {
  const decls = declarations(src);
  const guards = (calls: string[], helpers: Set<string>) => calls.some((c) => GUARD.test(`${c}(`) || helpers.has(c));
  const helpers = new Set<string>();
  // Helpers in file order: one may lean on a helper above it.
  for (const d of decls) if (!d.exported && guards(firstAwaited(d.body), helpers)) helpers.add(d.name);
  return decls.filter((d) => d.exported && /async/.test(d.body.slice(0, 80))).filter((d) => !guards(firstAwaited(d.body), helpers)).map((d) => d.name);
}

describe("the view-only guard", () => {
  const files = walk(ROOT).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f));
  const actionFiles = files.filter((f) => f.startsWith(path.join(ROOT, "app") + path.sep) && isServerFile(readFileSync(f, "utf8")));

  it("finds the PM app's action files", () => {
    expect(actionFiles.length).toBeGreaterThanOrEqual(4);
  });

  it("guards every exported server action first, directly or through a local helper", () => {
    for (const f of actionFiles) {
      const src = readFileSync(f, "utf8");
      expect(strip(src), f).not.toMatch(/requireCurrentWorkspace\(|getAppContext\(/);
      expect(unguarded(src), path.relative(process.cwd(), f)).toEqual([]);
    }
  });

  it("guards every route that reads the workspace, but the read-only ones", () => {
    const routes = files.filter((f) => /\/route\.ts$/.test(f) && /requireCurrentWorkspace|requireWritableWorkspace|getAppContext/.test(readFileSync(f, "utf8")));
    expect(routes.length).toBeGreaterThanOrEqual(3);
    for (const f of routes) {
      const rel = path.relative(ROOT, f);
      if (READ_ONLY_ROUTES.includes(rel)) continue;
      expect(strip(readFileSync(f, "utf8")), rel).toMatch(GUARD);
    }
  });

  it("catches the shapes a guard can be missed in", () => {
    expect(unguarded(`"use server";\nexport async function a() { await requireWritableWorkspace("/app"); }`)).toEqual([]);
    expect(unguarded(`'use server'\nexport async function b() { await save(); }`)).toEqual(["b"]);
    expect(unguarded(`"use server";\nexport const c = async () => { await save(); };`)).toEqual(["c"]);
    // The guard after the write.
    expect(unguarded(`"use server";\nexport async function d() { await save(); await requireWritableWorkspace("/app"); }`)).toEqual(["d"]);
    // A helper above that does not guard, and one that does.
    expect(unguarded(`"use server";\nconst h = async () => { await save(); };\nasync function g() { return await requireWritableWorkspace("/app"); }\nexport async function e() { await h(); }\nexport async function f() { await g(); }`)).toEqual(["e"]);
    expect(unguarded(`"use server";\nasync function g() { const c = await requireWritableWorkspace("/app"); return c; }\nexport async function f() { await g(); }`)).toEqual([]);
  });
});
