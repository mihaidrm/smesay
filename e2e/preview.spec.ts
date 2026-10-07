// The builder's preview (stories/E5-6) on a PM's project: the panel on Import, Shape, Build
// and Share and not on Results; the panel's compact view shows one card and no ring (decision
// 0061) while the full view carries each step's ring (Import the chapter row and the cards,
// Shape the wording); Share's closing date shows in the header once published; the preview
// says nothing is saved, in the workspace's brand; Phone shows the 390 px column; Full view
// opens the whole app in a new tab. The write routes refuse a preview token (403). The sample
// project has no preview (decision 0021, item 1).
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.49" } });

test("preview: on every builder step, one card in the panel, the rings in the full view, saving nothing", async ({ page, request, context }) => {
  test.setTimeout(120_000);
  const email = `e2e-preview-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  // Naming it seeds the sample project, which can take more than the default 5 seconds on CI.
  await expect(page).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  // The page stamps quickstart_seen_at while it renders; leaving before it shows can cut that off.
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  const sampleHref = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  const sample = `/app/projects/${sampleHref!.match(/projects\/([0-9a-f-]{36})/)![1]}`;
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const project = page.url().replace(/\/import$/, "");
  const panel = page.getByTestId("preview-panel");
  const app = page.frameLocator("[data-testid=preview-iframe]");

  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Approval from the notification email | Approving | Must"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 2 items" }).click();
  await expect(page.getByTestId("imported-line")).toBeVisible();
  await page.goto(`${project}/import`);
  await expect(panel.getByTestId("preview-caption")).toHaveText("Import sets the chapters and the cards.");
  await app.locator("[data-ready]").waitFor();
  await expect(app.getByTestId("preview-note")).toHaveText("Preview: nothing you enter here is saved");
  await expect(app.getByTestId("respondent-header").first()).toContainText("Marlow Group");
  // Compact: the chapter row, one card of two, no ring, no footer.
  await expect(app.locator("[data-preview-compact]")).toBeVisible();
  await expect(app.getByTestId("item-card")).toHaveCount(1);
  await expect(app.getByTestId("compact-note")).toHaveText("1 of 2 cards. The full view shows them all.");
  await expect(app.locator("nav[data-ring]")).toHaveCount(0);
  await expect(app.getByTestId("chapter-continue")).toHaveCount(0);
  // The full view: every card, the step's rings.
  const [full] = await Promise.all([context.waitForEvent("page"), panel.getByTestId("preview-full-size").click()]);
  await full.locator("[data-ready]").waitFor();
  await expect(full.locator("[data-preview-compact]")).toHaveCount(0);
  await expect(full.getByTestId("item-card")).toHaveCount(2);
  await expect(full.locator("nav[data-ring]")).toBeVisible();
  await expect(full.getByTestId("item-card").first()).toHaveClass(/ring-violet/);
  await full.close();

  await page.goto(`${project}/shape`);
  await expect(panel.getByTestId("preview-caption")).toHaveText("Shape changes the wording on the cards.");
  await app.locator("[data-ready]").waitFor();
  await expect(app.locator("legend[data-ring]")).toHaveCount(0);
  const [shapeFull] = await Promise.all([context.waitForEvent("page"), panel.getByTestId("preview-full-size").click()]);
  await shapeFull.locator("[data-ready]").waitFor();
  await expect(shapeFull.locator("legend[data-ring]").first()).toBeVisible();
  await expect(shapeFull.locator("nav[data-ring]")).toHaveCount(0);
  await shapeFull.close();

  await page.goto(`${project}/build`);
  await expect(page.getByRole("heading", { name: "Build the validation" })).toBeVisible();
  await page.goto(`${project}/share`);
  await expect(panel.getByTestId("preview-caption")).toHaveText("Share sets the closing date in the header.");
  // Publish is a form the page handles once it has loaded (as the revoke and share specs wait).
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  await expect(async () => {
    await app.locator("[data-ready]").waitFor({ timeout: 2_000 });
    await expect(app.getByTestId("respondent-note").first()).toContainText("20 Jan 2027", { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  // Phone: the 390 px column at true size; Full view: the whole app in a new tab.
  await panel.getByRole("group", { name: "Device" }).getByRole("button", { name: "Phone" }).click();
  await expect(page.getByTestId("preview-phone")).toBeVisible();
  await app.locator("[data-ready]").waitFor();
  await expect(app.locator("[data-preview-device=phone]")).toBeVisible();
  const [tab] = await Promise.all([context.waitForEvent("page"), panel.getByTestId("preview-full-size").click()]);
  await tab.waitForLoadState();
  await expect(tab).toHaveURL(/\/r\/p\..*device=phone/);
  await expect(tab.getByTestId("preview-note")).toBeVisible();

  // Nothing is saved: the write routes answer 403 to the preview's token.
  const token = new URL(tab.url()).pathname.split("/")[2];
  const put = await request.put(`/r/${token}/answers`, { data: { itemId: "x" } });
  expect(put.status()).toBe(403);
  expect((await request.post(`/r/${token}/start`, { data: {} })).status()).toBe(403);
  await tab.close();

  // Not on Results, nor anywhere on the sample.
  await page.goto(`${project}/results`);
  await expect(page.getByTestId("project-header")).toBeVisible();
  await expect(page).toHaveURL(/\/results/);
  await expect(panel).toHaveCount(0);
  await page.goto(`${sample}/build`);
  await expect(page.getByRole("heading", { name: "Build the validation" })).toBeVisible();
  await expect(panel).toHaveCount(0);
});
