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

// Design note 53: the third step names no phone (the questions do), the results fragment's
// view switch changes the chart, and a question opens in place.
test("the steps, the results views and the questions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/landing-page");
  const steps = page.locator("#how");
  await expect(steps.getByText("Send one link", { exact: true })).toBeVisible();
  expect((await steps.innerText()).toLowerCase()).not.toContain("phone");
  const demo = page.getByTestId("results-demo");
  await demo.scrollIntoViewIfNeeded();
  await expect(demo).toHaveAttribute("data-view", "Table");
  await expect(page.getByTestId("results-table")).toBeVisible();
  await demo.getByRole("button", { name: "Share" }).click();
  await expect(demo.getByRole("button", { name: "Share" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("results-share")).toBeVisible();
  await demo.getByRole("button", { name: "Columns" }).click();
  await expect(page.getByTestId("results-columns")).toBeVisible();
  const phone = page.getByTestId("faq-item").filter({ hasText: "Does it work on a phone?" });
  await phone.locator("summary").click();
  await expect(phone.getByText("The link is made for a phone first")).toBeVisible();
  await expect(page.getByTestId("faq-item")).toHaveCount(7);
});
