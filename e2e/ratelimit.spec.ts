// The main path of E11-1 a respondent could meet: past 100 requests a minute from one address on
// the respondent routes, the next page is the plain "Too many requests" page with Retry-After; a
// sign-in form over its limit says how long to wait.
import { expect, test } from "@playwright/test";

// An address of its own per run, so a second run against the same server starts fresh.
test.use({ extraHTTPHeaders: { "x-forwarded-for": `10.61.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` } });

test("too many requests from one address get the plain page", async ({ page }) => {
  for (let i = 0; i < 100; i++) expect((await page.request.get("/r/00000000000000000000000000000000")).status()).not.toBe(429);
  const response = await page.goto("/r/00000000000000000000000000000000");
  expect(response?.status()).toBe(429);
  expect(Number(response?.headers()["retry-after"])).toBeGreaterThan(0);
  await expect(page.getByRole("heading", { name: "Too many requests" })).toBeVisible();
  await expect(page.getByText("Too many requests from your connection. Wait a minute and try again.")).toBeVisible();
});

test("the sixth sign-in link for one address says how long to wait", async ({ page }) => {
  await page.goto("/sign-in");
  for (let i = 0; i < 6; i++) {
    await page.getByLabel("Email").fill(`e2e-limit-${Date.now()}-${i}@marlow.example`);
    await page.getByRole("button", { name: "Send me a link" }).click();
    if (i < 5) { await expect(page.getByRole("status")).toBeVisible(); await page.goto("/sign-in"); }
  }
  await expect(page.getByText("Too many sign-in attempts. Wait 1 minute, then try again.")).toBeVisible();
});
