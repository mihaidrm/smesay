// The main path of E3-7 (acceptance 7): a workbook with two sheets of requirements and an
// empty third, built in the test (e2e/xlsx.ts), the Sheets step with the first sheet ticked,
// both ticked, the per-sheet preview, the switch "Use the sheet names as areas", the import,
// the "2 sheets" in the log and the areas on the version page.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";
import { workbook } from "./xlsx";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.82" } });

const FILE = workbook([
  { name: "Submitting", rows: [["Ref", "Requirement", "Priority"], ["SU-01", "Capture a receipt by phone and attach it", "Must"], ["SU-02", "Split one expense over two cost centres", "Should"], ["SU-03", "Save a claim as a draft", "Could"]] },
  { name: "Approving", rows: [["Ref", "Requirement", "Priority"], ["AP-01", "Approve from the notification email", "Must"], ["AP-02", "Flag claims outside the policy before approval", "Should"]] },
  { name: "Notes", rows: [] },
]);

test("tick two sheets, import them as one version with the sheet names as areas", async ({ page, request }) => {
  const email = `e2e-sheets-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app");
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("New expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);

  // The step: the two sheets with rows (the non-empty rows, the header among them, since the
  // header row is found after the pick), the first ticked, the empty one not listed; the
  // mapping and the check wait.
  await page.getByLabel("Your file").setInputFiles({ name: "expense-areas.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: FILE });
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(page.getByTestId("upload-summary")).toHaveText("Tick the sheets that hold the list, then press Use these sheets.");
  const step = page.getByTestId("sheets-step");
  await expect(step.getByRole("checkbox")).toHaveCount(2);
  await expect(step.getByRole("checkbox", { name: "Submitting (4 rows)" })).toBeChecked();
  await expect(step.getByRole("checkbox", { name: "Approving (3 rows)" })).not.toBeChecked();
  await expect(page.getByRole("heading", { name: "Column mapping" })).toHaveCount(0);
  await expect(page.getByTestId("check-card")).toHaveCount(0);

  // Both sheets: the summary, a line and ten rows per sheet, the mapping over both.
  await step.getByRole("checkbox", { name: "Approving (3 rows)" }).check();
  await page.getByRole("button", { name: "Use these sheets" }).click();
  await expect(page.getByTestId("upload-summary")).toHaveText("We read 5 rows from expense-areas.xlsx across 2 sheets.");
  await expect(page.getByTestId("sheet-line")).toHaveText(["Sheet Submitting: 3 rows, header on row 1.", "Sheet Approving: 2 rows, header on row 1."]);
  await expect(page.getByTestId("preview-row")).toHaveCount(5);
  await expect(page.getByLabel("Requirement", { exact: true })).toHaveValue("text");
  await expect(page.getByLabel("Priority", { exact: true })).toHaveValue("value");
  // The mapping card is closed once the text column is mapped (design note 110): it opens
  // from its summary to reach the switch.
  await page.getByTestId("card-mapping").locator("summary").click();
  await expect(page.getByRole("switch", { name: "Use the sheet names as areas" })).toBeChecked();
  await expect(page.getByTestId("check-sheet")).toHaveCount(2);
  await expect(page.getByTestId("check-card").getByText("0 exact duplicates were imported once.", { exact: true })).toHaveCount(2);

  // The import: one version, two sheets in the log, the areas from the sheet names.
  await page.getByRole("button", { name: "Import 5 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 5 items as version 1 on");
  await expect(page.getByTestId("version-row")).toHaveCount(1);
  await expect(page.getByTestId("version-row").first()).toContainText("xlsx");
  await expect(page.getByTestId("version-row").first()).toContainText("2 sheets");
  await page.getByRole("link", { name: "Version 1", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Version 1", exact: true })).toBeVisible();
  const table = page.getByTestId("version-items");
  await expect(table.getByRole("row")).toHaveCount(6);
  await expect(table.getByRole("cell", { name: "Submitting", exact: true })).toHaveCount(3);
  await expect(table.getByRole("cell", { name: "Approving", exact: true })).toHaveCount(2);
  await expect(table.getByRole("row").nth(1)).toContainText("SU-01");
  await expect(table.getByRole("row").nth(5)).toContainText("AP-02");
});
