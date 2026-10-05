// The main path of E10-2: Whole project downloads the sample as JSON (marked as the sample);
// the sample's file is refused on Import a project; the same file as a PM's project imports
// into the workspace and opens on Results with the sample's numbers.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.52" } });

test("export the whole project as JSON and import it", async ({ page, request }) => {
  test.setTimeout(90_000);
  const email = `e2e-transfer-${Date.now()}@marlow.example`;
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
  const href = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  const id = href!.match(/projects\/([0-9a-f-]{36})/)![1];

  await page.goto(`/app/projects/${id}/results?unsubmitted=0`);
  const tile = (await page.locator('[data-tile="agreement"]').textContent())!;
  await page.goto(`/app/projects/${id}/results?unsubmitted=0&tab=export`);
  const link = page.getByTestId("export-project-download");
  await expect(link).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  expect(download.suggestedFilename()).toMatch(/^Sample-project-project-\d{4}-\d{2}-\d{2}\.json$/);
  const file = await (await page.request.get((await link.getAttribute("href"))!)).json();
  expect([file.format, file.version, file.sample]).toEqual(["smesay.project", 1, true]);

  // The sample's own file is refused.
  await page.goto("/app");
  await expect(page.getByTestId("import-project-link")).toHaveAttribute("href", "/app/projects/import");
  await page.goto("/app/projects/import");
  await expect(page.getByRole("heading", { name: "Import a project" })).toBeVisible();
  await page.getByLabel("Project file (.json)").setInputFiles({ name: "sample.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(file)) });
  await page.getByTestId("import-project").click();
  await expect(page.getByTestId("import-error")).toHaveText("This file is the sample project's. Every workspace has the sample already, so it is not imported.");

  // The same data as a PM's file imports and shows the same numbers.
  await page.getByLabel("Project file (.json)").setInputFiles({ name: "project.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...file, sample: false, note: null, project: { ...file.project, name: "Expense tool" } })) });
  await page.getByTestId("import-project").click();
  // Results may add the switch to the address (?unsubmitted=1), so the query is allowed.
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/results(\?.*)?$/);
  await expect(page.getByRole("heading", { name: "Expense tool" })).toBeVisible();
  const imported = page.url().match(/projects\/([0-9a-f-]{36})/)![1];
  await page.goto(`/app/projects/${imported}/results?unsubmitted=0`);
  await expect(page.locator('[data-tile="agreement"]')).toHaveText(tile);
});
