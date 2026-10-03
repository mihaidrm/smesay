import { expect, test } from "@playwright/test";

// stories/E12-1, acceptance 6: the page loads with the headline, the buttons lead to sign-in
// and the app, and a phone has no horizontal scroll.
test("the landing page loads with the headline and fits a phone", async ({ page }) => {
  await page.goto("/landing-page");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Send the list as a link.");
  await expect(page.getByRole("link", { name: /^Start free/ }).first()).toHaveAttribute("href", "/sign-in");
  await expect(page.getByRole("link", { name: "See the sample" }).first()).toHaveAttribute("href", "/app");
  await expect(page.getByTestId("live-card")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const widths = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, view: window.innerWidth }));
  expect(widths.doc).toBeLessThanOrEqual(widths.view);
  expect(widths.body).toBeLessThanOrEqual(widths.view);
  // The sections below the fold rise on scroll once (acceptance 2): hidden until reached,
  // fully shown after.
  const outputs = page.getByRole("heading", { level: 2, name: "What you get back" });
  await outputs.scrollIntoViewIfNeeded();
  await expect(outputs.locator("xpath=ancestor::*[@data-reveal][1]")).toHaveAttribute("data-reveal", "shown");
  await expect(outputs.locator("xpath=ancestor::*[@data-reveal][1]")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("main")).toBeVisible();
});
