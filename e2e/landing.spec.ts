import { expect, test } from "@playwright/test";

// stories/E12-1, acceptance 6: the page loads with the headline, the buttons lead to sign-in
// and the app, a phone has no horizontal scroll, and the sections below the fold are hidden
// until reached and shown after (acceptance 2).
test("the landing page loads with the headline and fits a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/landing-page");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Send your requirements as a link.");
  const starts = page.getByRole("link", { name: /^Start free/ });
  await expect(starts).toHaveCount(3);
  for (const i of [0, 1, 2]) await expect(starts.nth(i)).toHaveAttribute("href", "/sign-in");
  const samples = page.getByRole("link", { name: "Try the sample as a respondent" });
  await expect(samples).toHaveCount(2);
  for (const i of [0, 1]) await expect(samples.nth(i)).toHaveAttribute("href", "/sample");
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
  // Below the fold the card waits on the sheet, then turns once when seen.
  const shape = page.getByTestId("shape-demo");
  await expect(shape).toHaveAttribute("data-side", "Your sheet");
  await shape.scrollIntoViewIfNeeded();
  await expect(shape).toHaveAttribute("data-side", "Shaped");
  await shape.getByRole("button", { name: "Your sheet" }).click();
  await expect(shape.getByRole("button", { name: "Your sheet" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("shape-sheet")).toContainText("OCR receipt capture via mobile");
  await shape.getByRole("button", { name: "Shaped" }).click();
  await expect(page.getByTestId("shape-shaped")).toContainText("Managers approve or reject from the email, without logging in.");
  const demo = page.getByTestId("results-demo");
  await demo.scrollIntoViewIfNeeded();
  await expect(page.getByTestId("results-tiles")).toContainText("5 of 7");
  await expect(page.getByTestId("results-tiles")).toContainText("60%");
  // Different priority and Disagree are two tiles, never one number (decision 0062).
  await expect(page.getByTestId("results-tiles")).toContainText("Disagree");
  await expect(page.getByTestId("results-tiles-caption")).toContainText("18 agree with your proposals (60%), 7 want a different priority, 3 say not needed and 2 asked a question.");
  await expect(page.getByTestId("gain-groups-disagree")).toContainText("1 of 3");
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
  await expect(page.getByTestId("faq-item")).toHaveCount(8);

  await page.setViewportSize({ width: 390, height: 844 });
  for (const view of ["Columns", "Share"]) {
    await demo.getByRole("button", { name: view }).click();
    const widths = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(widths[0]).toBeLessThanOrEqual(widths[1]);
  }
});

// A visitor who clicks before the turn keeps the side they chose (design note 53).
test("a click on the Shape switch before the turn holds it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/landing-page");
  const shape = page.getByTestId("shape-demo");
  await expect(shape).toHaveAttribute("data-side", "Your sheet");
  await shape.getByRole("button", { name: "Your sheet" }).click();
  // The turn would come 900 ms after the card is seen; two seconds later it has not come.
  await expect.poll(async () => shape.getAttribute("data-side"), { intervals: [500, 500, 500, 500], timeout: 2500 }).toBe("Your sheet");
  await page.waitForTimeout(1500);
  await expect(shape).toHaveAttribute("data-side", "Your sheet");
});

// The comparison with the usual ways (design note 58): the nav link scrolls to it, six
// points, the switch changes the Today column and leaves the whole SMEsay column as it was,
// three columns from 1024 px and one below, and a phone shows the short label and does not
// scroll sideways.
test("the comparison with a spreadsheet, a form and a workshop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/landing-page");
  await page.getByRole("link", { name: "Compare" }).click();
  await expect(page.getByRole("heading", { name: "Why not a spreadsheet, a form or a workshop?" })).toBeInViewport();
  const compare = page.getByTestId("compare");
  await expect(page.getByTestId("compare-row")).toHaveCount(6);
  await expect(compare).toHaveAttribute("data-way", "sheet");
  await expect(page.getByTestId("compare-today").first()).toHaveText("The sheet goes out in the words your team wrote it in, unless you rewrite it first.");
  const smesay = await page.getByTestId("compare-smesay").allInnerTexts();
  expect(smesay).toHaveLength(6);
  expect(smesay[0]).toMatch(/^Import the sheet you already have\./);
  expect(smesay[5]).toMatch(/^A to-do list drafted by AI/);
  expect(smesay.every((line) => line.trim().length > 40)).toBe(true);
  await compare.getByRole("button", { name: "Workshop" }).click();
  await expect(compare.getByRole("button", { name: "Workshop" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("compare-today").nth(4)).toHaveText("The loudest voices tend to set the direction. Quiet and remote experts tend to say less.");
  expect(await page.getByTestId("compare-smesay").allInnerTexts()).toEqual(smesay);
  await compare.getByRole("button", { name: "Survey form" }).click();
  await expect(page.getByTestId("compare-today").first()).toHaveText("You turn each item into a form question and rewrite the wording yourself where it needs it.");
  expect(await page.getByTestId("compare-smesay").allInnerTexts()).toEqual(smesay);

  // The first row's Today and SMEsay cells side by side at 1024 px, stacked at 1023 px.
  // Both cells are measured in one call: two reads can straddle a layout change.
  const tops = () =>
    page.getByTestId("compare-row").first().evaluate((row) => {
      const top = (id: string) => row.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? 0;
      return Math.round(top("compare-smesay") - top("compare-today"));
    });
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect.poll(tops).toBe(0);
  await page.setViewportSize({ width: 1023, height: 900 });
  await expect.poll(tops).toBeGreaterThan(20);

  await page.setViewportSize({ width: 390, height: 844 });
  await compare.scrollIntoViewIfNeeded();
  await expect(compare.getByRole("button", { name: "Spreadsheet", exact: true })).toBeVisible();
  const widths = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(widths[0]).toBeLessThanOrEqual(widths[1]);
});

// Mihai, 2026-10-05: the nav stays at the top while the page scrolls, and a nav link glides
// to its section (scroll-behavior: smooth) and stops with the section's top under the nav.
test("the nav stays in view and its links scroll smoothly to their section", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/landing-page");
  const header = page.getByTestId("landing-header");
  await expect(header).not.toHaveAttribute("data-scrolled");
  // Smooth, not a jump: every scroll position on the way is recorded, and at least one lies
  // between the top and the section. A fixed wait before one reading raced the scroll's start
  // on CI (it read 0 once).
  await page.evaluate(() => { const w = window as unknown as { seen: number[] }; w.seen = []; window.addEventListener("scroll", () => w.seen.push(window.scrollY)); });
  const target = await page.evaluate(() => document.getElementById("pricing")!.getBoundingClientRect().top + window.scrollY - 80);
  await page.getByRole("navigation", { name: "Page" }).getByRole("link", { name: "Pricing" }).click();
  await expect.poll(async () => page.evaluate(() => Math.round(document.getElementById("pricing")!.getBoundingClientRect().top)), { timeout: 5000 }).toBe(80);
  const seen = await page.evaluate(() => (window as unknown as { seen: number[] }).seen);
  expect(seen.some((y) => y > 0 && y < target - 50)).toBe(true);
  await expect(header).toHaveAttribute("data-scrolled", "true");
  const box = (await header.boundingBox())!;
  expect(box.y).toBe(0);
  await expect(page.getByRole("navigation", { name: "Page" }).getByRole("link", { name: "Questions" })).toBeVisible();
  // The nav still works from down the page.
  await page.getByRole("navigation", { name: "Page" }).getByRole("link", { name: "How it works" }).click();
  await expect.poll(async () => page.evaluate(() => Math.round(document.getElementById("how")!.getBoundingClientRect().top)), { timeout: 5000 }).toBe(80);
});
