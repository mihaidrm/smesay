// The main path of E7-4: a workspace with its own accent publishes a list of two items in
// one area. On the link the chapter row shows About you, "Submitting 0/2" and Wrap up, the
// active pill and the progress bar in the workspace's accent (acceptance 6). Rating one of
// the two turns the count to 1/2 and the footer to "1 of 2 still to rate here."; the row
// takes the respondent to the Wrap up, which says "1 still to finish." and names the other
// item with "Not rated yet" (acceptance 5); the item's button opens its card, with focus on
// it, and each screen change focuses the new screen's heading. About you after Start keeps
// the row. A new visit without a screen in the address says "Welcome back" with the count.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.19" } });

test("chapter row, progress, Continue, Wrap up still to finish, welcome back", async ({ page, request, browser }) => {
  test.setTimeout(150_000);
  const stamp = Date.now();
  const email = `e2e-navigate-${stamp}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  await expect(page).toHaveURL(/\/app\/quickstart$/);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByLabel("Accent colour").fill("#1F4F7A");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Saved.");
  await page.getByRole("link", { name: "Projects" }).first().click();
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectUrl = page.url().replace(/\/import$/, "");
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Split a receipt across projects | Submitting | Should"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 2 items" }).click();
  await expect(page.getByTestId("imported-line")).toBeVisible();
  await page.goto(`${projectUrl}/build`);
  await expect(page.getByRole("heading", { name: "Build the instrument" })).toBeVisible();
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  const url = await page.getByTestId("share-link").inputValue();

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const link = await phone.newPage();
  await link.goto(url);
  await link.locator("[data-ready]").waitFor();
  await link.getByLabel("Name").fill("Ana Pop");
  await link.getByLabel("Role").fill("Finance lead");
  await link.getByTestId("about-you-start").click();
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  const row = link.getByTestId("chapter-row");
  await expect(row).toHaveText("About youSubmitting0/2Wrap up");
  // A screen reader hears the count in words; the "0/2" drawn on the pill is hidden from it.
  await expect(link.getByTestId("row-chapter-1")).toHaveAccessibleName("Submitting, 0 of 2 answered");
  const active = link.getByTestId("row-chapter-1");
  await expect(active).toHaveAttribute("aria-current", "step");
  expect(await active.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(31, 79, 122)");
  expect(await link.getByTestId("progress-bar").locator("div").evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(31, 79, 122)");
  await expect(link.getByTestId("chapter-note")).toHaveText("2 of 2 still to rate here. You can come back later.");
  await expect(link.getByTestId("chapter-continue")).toHaveText("Continue to Wrap up");

  // Rate one of the two.
  const receipts = link.getByTestId("item-card").filter({ hasText: "Receipts captured by phone" });
  await receipts.getByRole("radio", { name: "Must" }).click();
  await expect(receipts.getByTestId("item-card-note")).toHaveText("Saved");
  await expect(link.getByTestId("row-chapter-1")).toContainText("1/2");
  await expect(link.getByTestId("chapter-note")).toHaveText("1 of 2 still to rate here. You can come back later.");
  await expect(link.getByTestId("progress-bar")).toHaveAttribute("aria-valuenow", "1");

  // Through the row to the Wrap up.
  await link.getByTestId("row-wrap").click();
  await expect(link).toHaveURL(/\?at=wrap$/);
  // The screen change moves focus to the new screen's heading.
  await expect(link.getByRole("heading", { level: 1, name: "Wrap up" })).toBeFocused();
  await expect(link.getByTestId("wrap-up-gaps")).toContainText("1 still to finish.");
  // Submit stays off while an item is still to finish (E7-5).
  await expect(link.getByTestId("wrap-up-submit")).toBeDisabled();
  const unfinished = link.getByTestId("unfinished-item");
  await expect(unfinished).toHaveCount(1);
  await expect(unfinished).toContainText("Split a receipt across projects");
  await expect(unfinished).toContainText("Not rated yet");
  await unfinished.click();
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  // The row opens its own item: focus is on that card's first control.
  const split = link.getByTestId("item-card").filter({ hasText: "Split a receipt across projects" });
  await expect(split.locator(":focus")).toHaveCount(1);
  // About you after Start keeps the row, to go back without pressing Start.
  await link.getByTestId("row-about").click();
  await expect(link.getByTestId("about-you")).toBeVisible();
  await expect(link.getByTestId("chapter-row")).toBeVisible();
  await link.getByTestId("row-chapter-1").click();
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");

  // A new visit lands on the unfinished chapter with Welcome back.
  const again = await phone.newPage();
  await again.goto(url);
  await again.locator("[data-ready]").waitFor();
  await expect(again.getByTestId("welcome-back")).toContainText("Welcome back, Ana.");
  await expect(again.getByTestId("welcome-back")).toContainText("You answered 1 of 2 last time.");
  await again.getByTestId("chapter-continue").click();
  await expect(again.getByTestId("welcome-back")).toHaveCount(0);
  await phone.close();
});
