// scan() in scripts/check-ai-bundle.mjs (stories/E4-1, acceptance 1): a file with the key
// name or the SDK name, at any depth, is a hit; clean files are not.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scan } from "./check-ai-bundle.mjs";

let root;
afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); });

describe("check-ai-bundle scan", () => {
  it("finds the key name and the package name, and counts the files", () => {
    root = mkdtempSync(path.join(tmpdir(), "bundle-"));
    mkdirSync(path.join(root, "chunks", "app"), { recursive: true });
    writeFileSync(path.join(root, "chunks", "main.js"), "console.log('clean')");
    writeFileSync(path.join(root, "chunks", "app", "page.js"), "var k=process.env.ANTHROPIC_API_KEY");
    writeFileSync(path.join(root, "chunks", "app", "vendor.js"), "import('@anthropic-ai/sdk/helpers/zod')");
    const { files, hits } = scan(root);
    expect(files).toBe(3);
    expect(hits.sort()).toEqual(["chunks/app/page.js: ANTHROPIC_API_KEY", "chunks/app/vendor.js: @anthropic-ai/sdk"]);
  });
  it("reports nothing on clean bundles", () => {
    root = mkdtempSync(path.join(tmpdir(), "bundle-"));
    writeFileSync(path.join(root, "a.js"), "anthropic is a word; ANTHROPIC_API is not the key name");
    expect(scan(root)).toEqual({ files: 1, hits: [] });
  });
});
