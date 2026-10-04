// The builder's preview (stories/E5-6) on the sample: the panel on Import, Shape, Build and
// Share and not on Results; each step's caption and ring (Import the chapter row and the
// cards, Shape the wording, Share the closing date); the preview says nothing is saved, the
// sample's brand is the workspace's; Phone shows the 390 px column; Open full size opens the
// same preview in a new tab. The write routes refuse a preview token (403).
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.49" } });

test("preview: on every builder step, ringing what the step changes, saving nothing", async ({ page, request, context }) => {
  test.setTimeout(90_000);
  const email = `e2e-preview-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app$/);
  const href = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  const project = `/app/projects/${href!.match(/projects\/([0-9a-f-]{36})/)![1]}`;
  const panel = page.getByTestId("preview-panel");
  const app = page.frameLocator("[data-testid=preview-iframe]");

  await page.goto(`${project}/import`);
  await expect(panel.getByTestId("preview-caption")).toHaveText("Import sets the chapters and the cards.");
  await app.locator("[data-ready]").waitFor();
  await expect(app.getByTestId("preview-note")).toHaveText("Preview: nothing you enter here is saved");
  await expect(app.locator("nav[data-ring]")).toBeVisible();
  await expect(app.getByTestId("item-card").first()).toHaveClass(/ring-violet/);
  await expect(app.getByTestId("respondent-header").first()).toContainText("Marlow Group");

  await page.goto(`${project}/shape`);
  await expect(panel.getByTestId("preview-caption")).toHaveText("Shape changes the wording on the cards.");
  await app.locator("[data-ready]").waitFor();
  await expect(app.locator("legend[data-ring]").first()).toBeVisible();
  await expect(app.locator("nav[data-ring]")).toHaveCount(0);

  await page.goto(`${project}/share`);
  await expect(panel.getByTestId("preview-caption")).toHaveText("Share sets the closing date in the header.");
  await app.locator("[data-ready]").waitFor();
  await expect(app.locator("[data-ring]").first()).toContainText("20 Oct 2026");

  // Phone: the 390 px column at true size; Open full size: the same preview in a new tab.
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

  // Not on Results.
  await page.goto(`${project}/results`);
  await expect(page.getByTestId("results")).toBeVisible();
  await expect(panel).toHaveCount(0);
});
