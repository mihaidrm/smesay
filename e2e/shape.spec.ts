// The main path of E4-2: paste a list where three items carry an area and three do not,
// import it, open Shape, run the AI (the stand-in in e2e/fake-anthropic.mjs answers), see the
// three imported areas kept with their rationale and the loose items marked "Placed by AI",
// move one item with "Move to" and one by dragging, reload, run again: both stay.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.8" } });

test("shape a list into areas and move items", async ({ page, request }) => {
  const email = `e2e-shape-${Date.now()}@marlow.example`;
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

  // Shape before a list: the empty state points to Import.
  const projectUrl = page.url().replace(/\/import$/, "");
  await page.goto(`${projectUrl}/shape`);
  await expect(page.getByTestId("shape-empty")).toContainText("Import a list first.");
  await page.getByRole("link", { name: "Go to Import" }).click();

  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill([
    "1. Receipts captured by phone | Submitting | Must",
    "2. Approval from the notification email | Approving | Must",
    "3. Reimbursement through payroll | Paying | Should",
    "- Travel advances before a trip",
    "- Per diem rates by country",
    "- Mileage from a start and end address",
  ].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 6 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 6 items as version 1 on");

  await page.getByRole("navigation", { name: "Steps" }).getByRole("link", { name: /Shape/ }).click();
  await expect(page).toHaveURL(/\/shape$/);
  await expect(page.getByRole("heading", { name: "Shape the list" })).toBeVisible();
  // Before the run: the imported areas and the loose items, read-only.
  await expect(page.getByTestId("area")).toHaveCount(4);
  await expect(page.getByTestId("area").last()).toContainText("Not shaped yet");
  await expect(page.getByRole("button", { name: "Move" })).toHaveCount(0);

  await page.getByRole("button", { name: "Shape with AI" }).click();
  await expect(page.getByTestId("grouped-line")).toContainText("AI grouped 6 items into 3 areas.");
  const areas = page.getByTestId("area");
  await expect(areas).toHaveCount(3);
  await expect(areas.nth(0)).toContainText("Submitting");
  await expect(areas.nth(0).getByTestId("rationale")).toHaveText("First, because submitting starts it.");
  await expect(areas.nth(0).getByTestId("item")).toHaveCount(4);
  await expect(page.getByTestId("placed-pill")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Run again" })).toBeVisible();

  // Move to, by keyboard-reachable controls.
  const travel = page.getByTestId("item").filter({ hasText: "Travel advances before a trip" });
  await travel.getByLabel(/^Move .* to$/).selectOption("Paying");
  await travel.getByRole("button", { name: "Move" }).click();
  await expect(areas.nth(2).getByTestId("item").filter({ hasText: "Travel advances" })).toHaveCount(1);
  await expect(areas.nth(2).getByTestId("item").filter({ hasText: "Travel advances" }).getByTestId("moved-pill")).toHaveText("Moved by you");
  await expect(page.getByTestId("placed-pill")).toHaveCount(2);

  // Drag and drop (the HTML Drag and Drop API through Playwright's dragTo).
  const mileage = page.getByTestId("item").filter({ hasText: "Mileage from a start" });
  await mileage.dragTo(areas.nth(1));
  await expect(areas.nth(1).getByTestId("item").filter({ hasText: "Mileage" })).toHaveCount(1);

  await page.reload();
  await expect(page.getByTestId("area").nth(2).getByTestId("item").filter({ hasText: "Travel advances" })).toHaveCount(1);
  await expect(page.getByTestId("area").nth(1).getByTestId("item").filter({ hasText: "Mileage" })).toHaveCount(1);

  // Run again: the items the model placed are sent without an area, so the stand-in puts the
  // loose ones back in Submitting; the two the PM moved are sent with their area and stay.
  await page.getByRole("button", { name: "Run again" }).click();
  await expect(page.getByTestId("grouped-line")).toContainText("AI grouped 6 items into 3 areas.");
  await expect(page.getByTestId("area").nth(2).getByTestId("item").filter({ hasText: "Travel advances" })).toHaveCount(1);
  await expect(page.getByTestId("area").nth(1).getByTestId("item").filter({ hasText: "Mileage" })).toHaveCount(1);
  await expect(page.getByTestId("area").nth(0).getByTestId("item")).toHaveCount(2);
});
