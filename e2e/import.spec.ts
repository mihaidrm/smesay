// The main path of E3-2 (acceptance 6): sign in, create a project, upload the Marlow fixture
// (12 rows, invented, decision 0002), see the summary line, the four columns and ten rows.
// Then E3-3 (acceptance 5): the guessed mapping, a change, the import (E3-5: the check card,
// the commit, the stepper on Shape), a second copy of the file opening with "Mapping
// remembered from".
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

  // A file that is not a spreadsheet is refused inline.
  await page.getByLabel("Your file").setInputFiles({ name: "notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  // Not getByRole("alert"): Next's route announcer (#__next-route-announcer__) has that role too.
  await expect(page.locator("#upload-error")).toHaveText("This file is pdf. Upload an xlsx or csv, or paste the list instead.");

  await page.getByLabel("Your file").setInputFiles("e2e/fixtures/expense-requirements.xlsx");
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(page.getByTestId("upload-summary")).toHaveText("We read 12 rows from expense-requirements.xlsx and found the header on row 1.");
  // The cards are collapsible (design note 110): with a text column guessed from the headers
  // the check card is open and Preview and Column mapping are closed, each with a summary; a
  // click on a card's title row opens it (its controls are hidden while it is closed).
  await expect(page.getByTestId("check-card")).toHaveJSProperty("open", true);
  await expect(page.getByTestId("card-preview")).toHaveJSProperty("open", false);
  await expect(page.getByTestId("card-preview").getByTestId("card-summary")).toHaveText("12 rows, header on row 1");
  await page.getByTestId("card-preview").locator("summary").click();
  await expect(page.getByTestId("card-preview")).toHaveJSProperty("open", true);
  const headers = page.getByTestId("preview-table").getByRole("columnheader");
  await expect(headers).toHaveText(["ARef", "BRequirement", "CModule", "DPriority"]);
  await expect(page.getByTestId("preview-row")).toHaveCount(10);
  await expect(page.getByTestId("preview-row").first()).toContainText("CL-01");
  await expect(page.getByTestId("preview-row").last()).toContainText("CL-10");
  await expect(page.getByText("The first 10 of 12 rows.")).toBeVisible();

  // The header row picker rebuilds the preview from the stored file.
  await page.getByLabel("Header row").selectOption("0");
  await page.getByRole("button", { name: "Use this row" }).click();
  await expect(page.getByTestId("upload-summary")).toHaveText("We read 13 rows from expense-requirements.xlsx and found no header row.");
  await expect(page.locator("#preview-error")).toContainText("We found no header row.");
  await page.getByLabel("Header row").selectOption("1");
  await page.getByRole("button", { name: "Use this row" }).click();
  await expect(page.getByTestId("upload-summary")).toHaveText("We read 12 rows from expense-requirements.xlsx and found the header on row 1.");
  await page.reload();
  await expect(page.getByTestId("preview-row")).toHaveCount(10);

  // E3-3: the mapping guessed from the headers, one change saved, the same file remembered.
  // The mapping card is closed (the text column is picked); open it to change a role.
  await expect(page.getByTestId("card-mapping").getByTestId("card-summary")).toHaveText("4 of 4 columns mapped");
  await page.getByTestId("card-mapping").locator("summary").click();
  await expect(page.getByLabel("Requirement", { exact: true })).toHaveValue("text");
  await expect(page.getByLabel("Priority", { exact: true })).toHaveValue("value");
  await expect(page.getByTestId("mapping-remembered")).toHaveCount(0);
  await page.getByLabel("Module", { exact: true }).selectOption("custom");
  await page.getByLabel("Requirement", { exact: true }).selectOption("skip");
  await expect(page.locator("#mapping-error")).toHaveText("Pick the column that holds the requirement text. Without it there is nothing to import.");
  // Without a text column the guide opens Preview and the mapping and closes the check.
  await expect(page.getByTestId("check-card")).toHaveJSProperty("open", false);
  await expect(page.getByTestId("card-mapping").getByTestId("card-summary")).toHaveText("No text column yet");
  await page.getByLabel("Requirement", { exact: true }).selectOption("text");
  await expect(page.locator("#mapping-error")).toHaveCount(0);

  // E3-5: the check card and the import.
  await expect(page.getByTestId("check-card").getByText("0 empty rows were skipped.", { exact: true })).toBeVisible();
  await expect(page.getByTestId("check-card").getByText("0 exact duplicates were imported once.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Import 12 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 12 items as version 1 on");
  await expect(page.getByTestId("import-log").getByRole("link", { name: "Version 1", exact: true })).toBeVisible();
  await expect(page.getByTestId("imported-version")).toHaveText("Imported as version 1.");
  await expect(page.getByRole("navigation", { name: "Steps" }).locator("[aria-current='step']")).toHaveText(/Shape/);
  // Everything imported: Versions is open with its summary, The list is closed with the file
  // name; a click on The list's title row opens it (design note 110).
  await expect(page.getByTestId("import-log")).toHaveJSProperty("open", true);
  await expect(page.getByTestId("import-log").getByTestId("card-summary")).toHaveText("Version 1, 12 items");
  await expect(page.getByTestId("check-card")).toHaveJSProperty("open", false);
  await expect(page.getByTestId("card-list")).toHaveJSProperty("open", false);
  await expect(page.getByTestId("card-list").getByTestId("card-summary")).toHaveText("expense-requirements.xlsx");
  await page.getByTestId("card-list").locator("summary").click();
  await expect(page.getByTestId("card-list")).toHaveJSProperty("open", true);

  // A second copy with one changed row (CL-05): the mapping remembered, then version 2 and
  // the diff counts (E3-6, acceptance 4 and 5).
  await page.getByLabel("Upload another file").setInputFiles("e2e/fixtures/expense-requirements-v2.xlsx");
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(page.getByTestId("mapping-remembered")).toContainText("Mapping remembered from");
  await expect(page.getByLabel("Module", { exact: true })).toHaveValue("custom");
  await page.getByRole("button", { name: "Import 12 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 12 items as version 2 on");
  await expect(page.getByTestId("version-row")).toHaveCount(2);
  await expect(page.getByTestId("version-diff")).toHaveText("Version 1 to 2: 11 items unchanged, 1 changed, 0 new, 0 gone.");
  await page.getByRole("link", { name: "Version 1", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Version 1", exact: true })).toBeVisible();
  await expect(page.getByTestId("version-items").getByRole("row")).toHaveCount(13);
});
