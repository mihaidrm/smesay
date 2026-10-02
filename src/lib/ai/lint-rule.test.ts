// The lint rule that keeps the Anthropic SDK inside src/lib/ai/ (stories/E4-1, acceptance 1;
// eslint.config.mjs). ESLint's Node API as in src/db/queries/lint-rule.test.ts.
import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

const eslint = new ESLint({ cwd: process.cwd() });

async function errors(code: string, filePath: string): Promise<number> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === "no-restricted-imports").length;
}

describe("the SDK import rule", () => {
  it("refuses the package and its helpers outside src/lib/ai/", async () => {
    expect(await errors('import Anthropic from "@anthropic-ai/sdk";', "src/lib/thing.ts")).toBe(1);
    expect(await errors('import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";', "src/app/app/page.tsx")).toBe(1);
    expect(await errors('import type { Message } from "@anthropic-ai/sdk";', "src/lib/imports.ts")).toBe(1);
    expect(await errors('import Anthropic from "@anthropic-ai/sdk";', "scripts/thing.mjs")).toBe(1);
  });
  it("allows it inside src/lib/ai/", async () => {
    expect(await errors('import Anthropic from "@anthropic-ai/sdk";', "src/lib/ai/client.ts")).toBe(0);
    expect(await errors('import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";', "src/lib/ai/other.ts")).toBe(0);
  });
});
