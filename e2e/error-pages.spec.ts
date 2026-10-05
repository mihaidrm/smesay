// The main path of E11-6, acceptances 1 and 2: an unknown address shows the 404 in the product's
// words with the way to the projects; an unknown address below a respondent link shows the
// link's own 404, with no PM navigation. The 500 pages and maintenance are unit-tested
// (src/lib/error-pages-copy.test.ts, src/proxy.test.ts).
import { expect, test } from "@playwright/test";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.72" } });

test("the 404 pages of the PM side and of a respondent link", async ({ page }) => {
  const missing = await page.goto("/no-such-page");
  expect(missing!.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page does not exist.");
  await expect(page.getByText("Check the address, or go to your projects.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to your projects" })).toHaveAttribute("href", "/app");

  const below = await page.goto("/r/0123456789abcdef0123456789abcdef/no-such-page");
  expect(below!.status()).toBe(404);
  await expect(page.getByTestId("link-not-found")).toContainText("Check the link you were sent, or ask the person who sent it for a new one.");
  await expect(page.getByRole("link", { name: "Go to your projects" })).toHaveCount(0);
});
