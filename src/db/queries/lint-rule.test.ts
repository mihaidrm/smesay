// The lint rule that keeps data access inside src/db/queries/ (stories/E1-3, acceptance 1).
// ESLint's Node API: new ESLint(options) and eslint.lintText(code, { filePath })
// (eslint.org/docs/latest/integrate/nodejs-api).
import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

const eslint = new ESLint({ cwd: process.cwd() });
const RULE = "no-restricted-imports";

async function ruleErrors(code: string, filePath: string): Promise<number> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === RULE).length;
}

describe("no-restricted-imports on the database", () => {
  it("refuses the database client, the schema and the ORM outside src/db/", async () => {
    expect(await ruleErrors('import { db } from "@/db";\nexport const x = db;\n', "src/app/w/route.ts")).toBe(1);
    expect(await ruleErrors('import { project } from "@/db/schema";\nexport const x = project;\n', "src/app/w/page.tsx")).toBe(1);
    expect(await ruleErrors('import { eq } from "drizzle-orm";\nexport const x = eq;\n', "src/lib/thing.ts")).toBe(1);
  });

  it("allows the helpers and the types, and the database inside src/db/", async () => {
    expect(await ruleErrors('import { projects } from "@/db/queries/projects";\nexport const x = projects;\n', "src/app/w/route.ts")).toBe(0);
    expect(await ruleErrors('import type { ClosingSpec } from "@/db/types";\nexport const x: ClosingSpec | null = null;\n', "src/app/w/route.ts")).toBe(0);
    expect(await ruleErrors('import { db } from "@/db";\nexport const x = db;\n', "src/db/queries/thing.ts")).toBe(0);
    expect(await ruleErrors('import { db } from "@/db";\nexport const x = db;\n', "src/lib/auth.ts")).toBe(0);
  });
});
