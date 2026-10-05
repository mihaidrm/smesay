// The step tips, the sample walkthrough and a rescue tip (stories/E15-3 acceptance 5, E15-4
// acceptance 4): a new project's Import says upload or paste; after a paste it says check the
// mapping; an upload stored over ten minutes ago (its time moved back in the database, as the
// server reads the rows' times) shows the rescue card; the sample's Results walks three cards by
// Next.
import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { latestLink } from "./mailpit";

// One rate-limit bucket per spec file (e2e/workspace.spec.ts says why).
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.81" } });

test("step tips on Import, the rescue card, and the sample walkthrough", async ({ page, request }) => {
  test.setTimeout(120_000);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set: this test moves an upload's time back in the database.");
  const email = `e2e-tips-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  await expect(page.getByTestId("quickstart")).toBeVisible();

  await page.goto("/app/projects/new");
  await page.getByLabel("Project name").fill("Travel claims");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectId = page.url().split("/projects/")[1].split("/")[0];
  const card = page.getByTestId("guide-card");
  await expect(card).toHaveCount(1);
  await expect(card).toHaveAttribute("data-tip", "import.empty");
  await expect(card.getByTestId("guide-line")).toHaveText("Upload an xlsx or csv, or paste the list. One item per row.");

  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone", "Approval from the notification email", "Reimbursement through payroll"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await expect(page.getByTestId("upload-summary")).toBeVisible();
  await expect(card).toHaveAttribute("data-tip", "import.mapping");

  // Eleven minutes later, still not imported: the rescue card, with the way to the mapping.
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await sql`update upload set created_at = now() - interval '11 minutes' where project_id = ${projectId}`;
  } finally {
    await sql.end();
  }
  await page.reload();
  await expect(card).toHaveAttribute("data-tip", "rescue.mapping");
  await expect(card.getByTestId("mascot")).toHaveAttribute("data-pose", "help");
  await expect(card.getByRole("link", { name: "Map the columns" })).toHaveAttribute("href", "#mapping-title");

  // Importing ends the Import tips.
  await page.getByRole("button", { name: "Import 3 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 3 items");
  await expect(card).toHaveCount(0);

  // The sample walkthrough: three cards, each opened by the one before.
  await page.goto("/app");
  await page.getByTestId("sample-card").getByRole("link", { name: "Open the sample" }).click();
  await expect(page).toHaveURL(/\/results\?/);
  await expect(card).toHaveAttribute("data-tip", "sample.strip");
  await card.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/tab=pushed/);
  await expect(card).toHaveAttribute("data-tip", "sample.registers");
  await card.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/item=/);
  await expect(card).toHaveAttribute("data-tip", "sample.detail");
  await expect(card.getByRole("link", { name: "Start a project" })).toHaveAttribute("href", "/app/projects/new");
  // Dismiss ends the walkthrough: back on the strip, no card.
  await card.getByTestId("guide-dismiss").click();
  await expect(card).toHaveCount(0);
  await page.goto("/app");
  await page.getByTestId("sample-card").getByRole("link", { name: "Open the sample" }).click();
  await expect(page.getByTestId("results")).toBeVisible();
  await expect(card).toHaveCount(0);
});
