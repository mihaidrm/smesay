// The lint rule that keeps the Anthropic SDK inside src/lib/ai/ and the key's module out of
// client components (stories/E4-1, acceptance 1; eslint-rules/db-access.mjs, smesay/ai-sdk).
// ESLint's Node API as in src/db/queries/lint-rule.test.ts.
import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

const eslint = new ESLint({ cwd: process.cwd() });

async function errors(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === "smesay/ai-sdk").map((m) => m.messageId ?? m.message);
}

describe("the SDK import rule", () => {
  it("refuses the package and its helpers outside src/lib/ai/, by every spelling", async () => {
    expect(await errors('import Anthropic from "@anthropic-ai/sdk";', "src/lib/thing.ts")).toHaveLength(1);
    expect(await errors('import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";', "src/app/app/page.tsx")).toHaveLength(1);
    expect(await errors('import type { Message } from "@anthropic-ai/sdk";', "src/lib/imports.ts")).toHaveLength(1);
    expect(await errors('export { default } from "@anthropic-ai/sdk";', "src/lib/imports.ts")).toHaveLength(1);
    expect(await errors('export async function f() { return import("@anthropic-ai/sdk"); }', "src/lib/imports.ts")).toHaveLength(1);
    expect(await errors('const a = require("@anthropic-ai/sdk");', "scripts/thing.mjs")).toHaveLength(1);
    expect(await errors('import Anthropic from "@anthropic-ai/sdk";', "scripts/thing.mjs")).toHaveLength(1);
  });
  it("allows it inside src/lib/ai/", async () => {
    expect(await errors('import Anthropic from "@anthropic-ai/sdk";', "src/lib/ai/client.ts")).toHaveLength(0);
    expect(await errors('import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";', "src/lib/ai/other.ts")).toHaveLength(0);
  });
  it("refuses the key's module from a client component, and allows it from server code", async () => {
    expect(await errors('"use client";\nimport { runModel } from "@/lib/ai/client";', "src/app/app/(shell)/projects/[projectId]/shape/button.tsx")).toEqual(["client"]);
    expect(await errors('"use client";\nimport { runModel } from "../../../../../lib/ai/client";', "src/app/app/(shell)/projects/[projectId]/button.tsx")).toEqual(["client"]);
    expect(await errors('"use client";\nimport { AI_COPY } from "@/lib/ai/copy";', "src/app/app/button.tsx")).toHaveLength(0);
    expect(await errors('import { runModel } from "@/lib/ai/client";', "src/lib/shaping.ts")).toHaveLength(0);
    expect(await errors('"use server";\nimport { runModel } from "@/lib/ai/client";', "src/app/app/actions.ts")).toHaveLength(0);
  });
});
