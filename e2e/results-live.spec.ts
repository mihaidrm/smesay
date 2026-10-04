// The main path of E8-7: a PM publishes a two-item list and keeps Results open on the empty
// state; a respondent on a phone rates the first item and the PM's Results shows it within
// five seconds without a reload, then the second, and the changed tile is marked to fade.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.49" } });

test("live updates: answers arrive on Results within five seconds", async ({ page, request, browser }) => {
  test.setTimeout(120_000);
  const email = `e2e-live-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectUrl = page.url().replace(/\/import$/, "");
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Paid with the next salary run | Paying | Should"].join("\n"));
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

  // Results before any answer: the empty state, listening.
  const events = page.waitForResponse((r) => r.url().endsWith("/events") && r.status() === 200);
  await page.goto(`${projectUrl}/results`);
  await events;
  const tile = page.locator('[data-tile="agreement"]');
  await expect(tile).toHaveCount(0);

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const link = await phone.newPage();
  await link.goto(url);
  await link.locator("[data-ready]").waitFor();
  await link.getByLabel("Name").fill("Ana Pop");
  await link.getByLabel("Role").fill("Finance lead");
  await link.getByTestId("about-you-start").click();
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  await link.getByTestId("item-card").getByRole("radio", { name: "Must" }).click();
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await expect(tile).toContainText("Agreement, 1 of 1 answers", { timeout: 5_000 });

  await link.getByTestId("chapter-continue").click();
  await expect(link.getByTestId("chapter-title")).toHaveText("Paying");
  await link.getByTestId("item-card").getByRole("radio", { name: "Should" }).click();
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await expect(tile).toContainText("Agreement, 2 of 2 answers", { timeout: 5_000 });
  // The tile changed after the page loaded, so it carries the fade.
  await expect(page.locator("[data-changed]").filter({ has: tile })).toHaveCount(1);
  await phone.close();
});
