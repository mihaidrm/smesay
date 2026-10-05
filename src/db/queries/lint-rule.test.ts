// The lint rules that keep data access inside src/db/queries/ (stories/E1-3, acceptance 1;
// eslint-rules/db-access.mjs). ESLint's Node API: new ESLint(options) and
// eslint.lintText(code, { filePath }) (eslint.org/docs/latest/integrate/nodejs-api).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

const eslint = new ESLint({ cwd: process.cwd() });

async function errors(rule: string, code: string, filePath: string): Promise<number> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === rule).length;
}
const access = (code: string, filePath: string) => errors("smesay/db-access", code, filePath);
const reexport = (code: string, filePath: string) => errors("smesay/no-db-reexport", code, filePath);

describe("db-access", () => {
  const refused: [string, string][] = [
    ['import { events } from "@/db/queries/events";', "src/app/app/actions.ts"],
    ['import { db } from "@/db";', "src/app/w/route.ts"],
    ['import { db } from "@/db/";', "src/app/w/route.ts"],
    ['import { db } from "@/db/index";', "src/app/w/route.ts"],
    ['import { project } from "@/db/schema";', "src/app/w/page.tsx"],
    ['import { user } from "@/db/auth-schema";', "src/app/w/page.tsx"],
    ['import { db } from "@/db/queries/../index";', "src/app/w/route.ts"],
    ['import { db } from "../../../db";', "src/app/w/x/route.ts"],
    ['import { project } from "../../../../db/schema";', "src/app/w/x/y/route.ts"],
    ['import { db } from "./db";', "src/middleware.ts"],
    ['import { db } from "../db/./index";', "src/lib/thing.ts"],
    ['import { scoped } from "@/db/queries/scoped";', "src/app/w/route.ts"],
    ['export { db } from "@/db";', "src/app/w/route.ts"],
    ['export * from "@/db/schema";', "src/app/w/route.ts"],
    ['export async function f() { return import("@/db"); }', "src/app/w/route.ts"],
    ['const x = require("@/db");', "src/app/w/route.ts"],
    ['import { eq } from "drizzle-orm";', "src/lib/thing.ts"],
    ['import { pgTable } from "drizzle-orm/pg-core";', "src/lib/thing.ts"],
    ['import postgres from "postgres";', "src/lib/thing.ts"],
    ['import { db } from "@/db";', "src/app/w/route.js"],
    ['import { db } from "@/db";', "src/app/w/page.jsx"],
    ['import { db } from "@/db";', "src/app/w/route.mts"],
    ['import { internal } from "@/db/queries/internal";', "src/app/w/route.ts"],
    ['import { prepareTestDatabase } from "@/db/test-db";', "src/app/w/route.ts"],
    ['import { requireWorkspaceForUser } from "../db/queries/internal";', "src/lib/thing.ts"],
    ['import { internal } from "@/db/queries/internal";', "src/lib/ai/shaping.ts"],
    ['import { internal } from "../../db/queries/internal";', "src/lib/ai/copy.ts"],
    ['import { internal } from "@/db/queries/internal";', "src/lib/shaping.ts"],
    ['import { internal } from "@/db/queries/internal";', "src/app/admin/page.tsx"],
    ['export async function f() { return import(`@/db`); }', "src/app/w/route.ts"],
    ['import { createRequire } from "node:module";', "src/app/w/route.ts"],
    ['declare const module: { require: (s: string) => unknown }; export const x = module.require("@/db");', "src/app/w/route.ts"],
    ['import type { WorkspaceId } from "@/db/types"; export const ws = "abc" as WorkspaceId;', "src/app/w/route.ts"],
    ['import { projects } from "@/db/queries/projects"; export const p = projects.list("abc" as never);', "src/app/w/route.ts"],
  ];
  it.each(refused)("refuses %s in %s", async (code, filePath) => {
    expect(await access(code + "\nexport const keep = 1;\n", filePath)).toBeGreaterThan(0);
  });

  const allowed: [string, string][] = [
    ['import { projects } from "@/db/queries/projects";', "src/app/w/route.ts"],
    ['import { projects } from "@/db/queries";', "src/app/w/route.ts"],
    ['import { projects } from "../../db/queries/projects";', "src/app/w/route.ts"],
    ['import type { ClosingSpec } from "@/db/types";', "src/app/w/route.ts"],
    ['import { requireWorkspace } from "@/lib/workspace";', "src/app/w/route.ts"],
    ['import { db } from "@/db";', "src/db/queries/thing.ts"],
    ['import { db } from "@/db";', "src/db/seed/thing.ts"],
    ['import { db } from "@/db";', "src/lib/auth.ts"],
    ['import { requireWorkspaceForUser } from "@/db/queries/internal";', "src/lib/workspace.ts"],
    ['import { internal } from "@/db/queries/internal";', "src/lib/ai/client.ts"],
    ['import { internal } from "@/db/queries/internal";', "src/lib/ai/client.test.ts"],
    ['import { internal } from "@/db/queries/internal";', "src/lib/insights.test.ts"],
    ['import { prepareTestDatabase } from "@/db/test-db";', "src/lib/thing.test.ts"],
    ['import { events } from "@/db/queries/events";', "src/lib/analytics.ts"],
    ['import * as seed from "@/db/seed/sample";', "src/lib/sample-instrument.ts"],
    ['import type { WorkspaceId } from "@/db/types"; export const ws = "abc" as WorkspaceId;', "src/db/queries/x.test.ts"],
  ];
  it.each(allowed)("allows %s in %s", async (code, filePath) => {
    expect(await access(code + "\nexport const keep = 1;\n", filePath)).toBe(0);
  });
  // The rule lets anyone import src/db/seed/sample.ts because it is constants only; it must stay
  // that way (src/db/** is not linted itself).
  it("keeps the seed's facts free of imports", () => {
    expect(readFileSync("src/db/seed/sample.ts", "utf8")).not.toMatch(/^\s*import\b|\brequire\(|\bimport\(/m);
  });
});

describe("no-db-reexport inside src/db/queries/", () => {
  it("refuses handing the client out again", async () => {
    expect(await reexport('export { db } from "@/db";\n', "src/db/queries/thing.ts")).toBe(1);
    expect(await reexport('export * from "@/db";\n', "src/db/queries/thing.ts")).toBe(1);
    expect(await reexport('import { db as client } from "@/db";\nexport const db = client;\n', "src/db/queries/thing.ts")).toBe(1);
    expect(await reexport('import { db } from "@/db";\nexport { db as client };\n', "src/db/queries/thing.ts")).toBe(1);
    expect(await reexport('import { db } from "@/db";\nexport const client = db;\n', "src/db/queries/thing.ts")).toBe(1);
    expect(await reexport('import { db } from "@/db";\nexport default db;\n', "src/db/queries/thing.ts")).toBe(1);
  });
  it("allows the helpers", async () => {
    expect(await reexport('export { projects } from "./projects";\nexport * from "./members";\n', "src/db/queries/thing.ts")).toBe(0);
  });
});
