import { expect, test } from "@playwright/test";

// stories/E12-1, acceptance 6: the page loads with the headline, the buttons lead to sign-in
// and the app, a phone has no horizontal scroll, and the sections below the fold are hidden
// until reached and shown after (acceptance 2).
test("the landing page loads with the headline and fits a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/landing-page");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Send the list as a link.");
  const starts = page.getByRole("link", { name: /^Start free/ });
  await expect(starts).toHaveCount(3);
  for (const i of [0, 1, 2]) await expect(starts.nth(i)).toHaveAttribute("href", "/sign-in");
  const samples = page.getByRole("link", { name: "See the sample" });
  await expect(samples).toHaveCount(2);
  for (const i of [0, 1]) await expect(samples.nth(i)).toHaveAttribute("href", "/app");
  await expect(page.getByTestId("live-card")).toBeVisible();
  const widths = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, view: window.innerWidth }));
  expect(widths.doc).toBeLessThanOrEqual(widths.view);
  expect(widths.body).toBeLessThanOrEqual(widths.view);
  const outputs = page.getByRole("heading", { level: 2, name: "What you get back" });
  const wrapper = outputs.locator("xpath=ancestor::*[@data-reveal][1]");
  await expect(wrapper).toHaveAttribute("data-reveal", "hidden");
  await outputs.scrollIntoViewIfNeeded();
  await expect(wrapper).toHaveAttribute("data-reveal", "shown");
  await expect(wrapper).toHaveCSS("opacity", "1");
});

// Design note 53: the third step names no phone (the questions do), the Shape switch turns
// between the sheet and the shaped list, the results card carries the seed's tiles and its
// view switch changes the chart, a question opens in place, and on a phone neither the
// Columns nor the Share view scrolls sideways.
test("the steps, the Shape switch, the results views and the questions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/landing-page");
  const steps = page.locator("#how");
  await expect(steps.getByText("Send one link", { exact: true })).toBeVisible();
  expect((await steps.innerText()).toLowerCase()).not.toContain("phone");
  // Below the fold the card waits on the sheet, then turns once when seen; a click holds it.
  const shape = page.getByTestId("shape-demo");
  await expect(shape).toHaveAttribute("data-side", "Your sheet");
  await shape.scrollIntoViewIfNeeded();
  await expect(shape).toHaveAttribute("data-side", "Shaped");
  await shape.getByRole("button", { name: "Your sheet" }).click();
  await expect(shape.getByRole("button", { name: "Your sheet" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("shape-sheet")).toContainText("OCR receipt capture via mobile");
  await page.waitForTimeout(1200);
  await expect(shape).toHaveAttribute("data-side", "Your sheet");
  await shape.getByRole("button", { name: "Shaped" }).click();
  await expect(page.getByTestId("shape-shaped")).toContainText("Managers approve or reject from the email, without logging in.");
  const demo = page.getByTestId("results-demo");
  await demo.scrollIntoViewIfNeeded();
  await expect(page.getByTestId("results-tiles")).toContainText("5 of 7");
  await expect(page.getByTestId("results-tiles")).toContainText("63%");
  await expect(demo).toHaveAttribute("data-view", "Table");
  await expect(page.getByTestId("results-table").getByRole("listitem")).toHaveCount(6);
  await demo.getByRole("button", { name: "Share" }).click();
  await expect(demo.getByRole("button", { name: "Share" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("results-share")).toBeVisible();
  await demo.getByRole("button", { name: "Columns" }).click();
  await expect(page.getByTestId("results-columns")).toBeVisible();
  const phone = page.getByTestId("faq-item").filter({ hasText: "Does it work on a phone?" });
  await phone.locator("summary").click();
  await expect(phone.getByText("The link is made for a phone first")).toBeVisible();
  await expect(page.getByTestId("faq-item")).toHaveCount(7);

  await page.setViewportSize({ width: 390, height: 844 });
  for (const view of ["Columns", "Share"]) {
    await demo.getByRole("button", { name: view }).click();
    const widths = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(widths[0]).toBeLessThanOrEqual(widths[1]);
  }
});
