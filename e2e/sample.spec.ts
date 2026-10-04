// The main path of E8-8: a new workspace's sample opens on Results with the watermark band;
// the band is on Shape and Build too, with Shape's read-only line; Delete sample on the
// sample's header asks first, then the sample is gone from the project list.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.50" } });

test("sample project: the band on every step, delete from its header", async ({ page, request }) => {
  test.setTimeout(90_000);
  const email = `e2e-sample-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: /Sample project/ }).first().click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByTestId("breadcrumb")).toHaveText("Marlow Group · sample project");
  const band = "Sample data: invented answers, for looking around";
  await expect(page.getByTestId("sample-band")).toHaveText(band);
  await expect(page.getByTestId("sample-band").getByRole("button")).toHaveCount(0);

  const steps = page.getByRole("navigation", { name: "Steps" });
  await steps.getByRole("link", { name: /Shape/ }).click();
  await expect(page).toHaveURL(/\/shape$/);
  await expect(page.getByTestId("sample-band")).toHaveText(band);
  await expect(page.getByTestId("sample-read-only")).toHaveText("The sample project cannot be edited.");
  await steps.getByRole("link", { name: /Build/ }).click();
  await expect(page).toHaveURL(/\/build$/);
  await expect(page.getByTestId("sample-band")).toHaveText(band);
  await steps.getByRole("link", { name: /Share/ }).click();
  await expect(page).toHaveURL(/\/share$/);
  await expect(page.getByTestId("sample-band")).toHaveText(band);
  await steps.getByRole("link", { name: /Import/ }).click();
  await expect(page).toHaveURL(/\/import$/);
  await expect(page.getByTestId("sample-band")).toHaveText(band);
  // The band is in the pinned header, so it stays in view while the page scrolls.
  await expect(page.getByTestId("project-header").getByTestId("sample-band")).toBeVisible();

  await page.getByTestId("project-header").getByRole("button", { name: "Delete sample" }).click();
  await expect(page.getByTestId("delete-sample-confirm")).toContainText("The sample project and its invented answers are deleted. Your own projects are not affected.");
  await page.getByTestId("delete-sample-confirm").getByRole("button", { name: "Delete sample" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("link", { name: /Sample project/ })).toHaveCount(0);
});
