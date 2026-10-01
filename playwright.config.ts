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
  webServer: {
    command: CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
