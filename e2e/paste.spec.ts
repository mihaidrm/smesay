// The main path of E3-4 (acceptance 5): paste six lines, see them in the preview with the
// three columns and the mapping guessed, then import (E3-5).
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.7" } });

test("paste a list and see the preview", async ({ page, request }) => {
  const email = `e2e-paste-${Date.now()}@marlow.example`;
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
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("New expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);

  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill("One line only");
  await page.getByRole("button", { name: "Use this list" }).click();
  await expect(page.locator("#paste-error")).toHaveText("Paste at least two lines, one item per line.");
  await page.getByLabel("Paste a list").fill([
    "1. Receipts captured by phone | Submitting | Must",
    "2. Approval from the notification email | Approving | Must",
    "3. Reimbursement through payroll | Paying | Should",
    "- Travel advances before a trip",
    "- Per diem rates by country",
    "- Mileage from a start and end address",
  ].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await expect(page.getByTestId("upload-summary")).toHaveText("Pasted list, 6 items.");
  // A pasted list maps itself, so the check card is open and Preview closed (design note
  // 110); its title row opens it.
  await expect(page.getByTestId("card-preview").getByTestId("card-summary")).toHaveText("6 items");
  await page.getByTestId("card-preview").locator("summary").click();
  await expect(page.getByTestId("preview-table").getByRole("columnheader")).toHaveText(["AItem", "BArea", "CProposed value"]);
  await expect(page.getByTestId("preview-row")).toHaveCount(6);
  await expect(page.getByTestId("preview-row").first()).toContainText("Receipts captured by phone");
  await expect(page.getByLabel("Header row")).toHaveCount(0);
  await expect(page.getByLabel("Item", { exact: true })).toHaveValue("text");
  await expect(page.getByLabel("Proposed value", { exact: true })).toHaveValue("value");
  await page.getByRole("button", { name: "Import 6 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 6 items as version 1 on");
});
