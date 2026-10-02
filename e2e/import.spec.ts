// The main path of E3-2 (acceptance 6): sign in, create a project, upload the Marlow fixture
// (12 rows, invented, decision 0002), see the summary line, the four columns and ten rows.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.6" } });

test("upload a spreadsheet and see the ten-row preview", async ({ page, request }) => {
  const email = `e2e-import-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("New expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);

  // A file that is not a spreadsheet is refused inline.
  await page.getByLabel("Your file").setInputFiles({ name: "notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  // Not getByRole("alert"): Next's route announcer (#__next-route-announcer__) has that role too.
  await expect(page.locator("#upload-error")).toHaveText("This file is pdf. Upload an xlsx or csv, or paste the list instead.");

  await page.getByLabel("Your file").setInputFiles("e2e/fixtures/expense-requirements.xlsx");
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(page.getByTestId("upload-summary")).toHaveText("expense-requirements.xlsx, 12 rows read, header found on row 1.");
  const headers = page.getByTestId("preview-table").getByRole("columnheader");
  await expect(headers).toHaveText(["ARef", "BRequirement", "CModule", "DPriority"]);
  await expect(page.getByTestId("preview-row")).toHaveCount(10);
  await expect(page.getByTestId("preview-row").first()).toContainText("CL-01");
  await expect(page.getByTestId("preview-row").last()).toContainText("CL-10");
  await expect(page.getByText("The first 10 of 12 rows.")).toBeVisible();

  // The header row picker rebuilds the preview from the stored file.
  await page.getByLabel("Header row").selectOption("0");
  await page.getByRole("button", { name: "Use this row" }).click();
  await expect(page.getByTestId("upload-summary")).toHaveText("expense-requirements.xlsx, 13 rows read, no header row found.");
  await expect(page.locator("#preview-error")).toContainText("No header row found.");
  await page.getByLabel("Header row").selectOption("1");
  await page.getByRole("button", { name: "Use this row" }).click();
  await expect(page.getByTestId("upload-summary")).toHaveText("expense-requirements.xlsx, 12 rows read, header found on row 1.");
  await page.reload();
  await expect(page.getByTestId("preview-row")).toHaveCount(10);
});
