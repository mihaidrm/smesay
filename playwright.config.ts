// One Playwright test per user-facing flow (decision 0004). defineConfig and webServer:
// node_modules/playwright/types/test.d.ts. The CI job builds first and runs the production
// server; locally the dev server is reused if it is already running.
import { defineConfig } from "@playwright/test";

const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  reporter: CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    // A machine with a preinstalled Chromium (the cloud session) names it here instead of
    // downloading one; CI and laptops leave it unset. launchOptions: node_modules/playwright/types/test.d.ts.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  // Two servers (webServer as an array: test.d.ts): the stand-in for the Anthropic API
  // (e2e/fake-anthropic.mjs), then the app pointed at it, so no browser test reaches the real
  // API (stories/E4-1, acceptance 6). The key is a made-up string the stand-in ignores.
  webServer: [
    {
      command: "node e2e/fake-anthropic.mjs",
      url: "http://localhost:4010/health",
      reuseExistingServer: !CI,
      timeout: 30_000,
    },
    {
      command: CI ? "npm run start" : "npm run dev",
      // next dev writes a Next.js block into CLAUDE.md when it detects a coding agent
      // (node_modules/next/dist/server/lib/generate-agent-files.js, detected through AI_AGENT,
      // CLAUDECODE or CLAUDE_CODE in next/dist/compiled/@vercel/detect-agent); the
      // block has em dashes and the pre-commit hook refuses it. webServer.env: test.d.ts.
      env: { ...process.env, AI_AGENT: "", CLAUDECODE: "", CLAUDE_CODE: "", ANTHROPIC_BASE_URL: "http://localhost:4010", ANTHROPIC_API_KEY: "e2e-fake-key-for-the-stand-in" },
      url: "http://localhost:3000",
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],
});
