// The main path of E11-2: an owner exports everything as a zip, then deletes the workspace by
// typing its name; the deleted page says when and who to contact, the workspace's link shows the
// inactive page, and leaving the deleted page goes to creating a workspace (no other membership).
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.62" } });

test("export everything, then delete the workspace", async ({ page, request, browser, baseURL }) => {
  test.setTimeout(90_000);
  const email = `e2e-data-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Leaving Ltd");
  await page.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  await expect(page).toHaveURL(/\/app\/quickstart$/);
  // The page stamps quickstart_seen_at while it renders; leaving before it shows can cut that off.
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  const href = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  await page.goto(`${href!.match(/\/app\/projects\/[0-9a-f-]{36}/)![0]}/share`);
  const linkUrl = await page.getByTestId("share-link").inputValue();

  await page.goto("/app/settings");
  await expect(page.getByTestId("data-section")).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export-everything").click()]);
  expect(download.suggestedFilename()).toMatch(/^Leaving-Ltd-everything-\d{4}-\d{2}-\d{2}\.zip$/);
  const zip = await (await page.request.get("/api/workspace/export")).body();
  expect(zip.subarray(0, 4).toString("latin1")).toBe("PK\u0003\u0004");

  const button = page.getByTestId("delete-workspace");
  await expect(button).toBeDisabled();
  await page.getByLabel("Type the workspace's name, Leaving Ltd, to confirm").fill("Leaving Ltd");
  await button.click();
  await expect(page).toHaveURL(/\/app\/deleted$/);
  await expect(page.getByTestId("deleted-line")).toContainText("This workspace was deleted on");
  await expect(page.getByTestId("deleted-line")).toContainText(`Contact ${email} if you did not expect this.`);
  await page.goto("/app/settings");
  await expect(page).toHaveURL(/\/app\/deleted$/);

  const visitor = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": "10.0.0.63" } });
  const respondent = await visitor.newPage();
  await respondent.goto(linkUrl);
  await expect(respondent.getByRole("heading", { name: "Link inactive." })).toBeVisible();
  await visitor.close();

  await page.goto("/app/deleted");
  await page.getByRole("button", { name: "Go to your workspaces" }).click();
  await expect(page).toHaveURL(/\/app\/new$/);
});
