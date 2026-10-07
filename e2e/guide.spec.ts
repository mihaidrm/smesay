// The guide's main paths (stories/E15-1 acceptance 5, E15-2 acceptance 5): a new workspace's
// Projects shows the first-project path with four unticked steps; Show tips off hides it and on
// brings it back; after a pasted list Import is ticked and the robot's line is Shape's; Dismiss
// removes the card and a reload keeps it gone.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// One rate-limit bucket per spec file (e2e/workspace.spec.ts says why).
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.80" } });

test("the first-project path, the switch and Dismiss", async ({ page, request }) => {
  test.setTimeout(90_000);
  const email = `e2e-guide-${Date.now()}@marlow.example`;
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

  const card = page.getByTestId("guide-card");
  await expect(card).toHaveCount(1);
  await expect(card).toHaveAttribute("data-tip", "path.start");
  await expect(card.getByRole("heading", { name: "Your first validation" })).toBeVisible();
  await expect(card.getByTestId("path-step")).toHaveCount(4);
  await expect(card.locator('[data-testid="path-step"][data-done="true"]')).toHaveCount(0);
  await expect(card.getByTestId("guide-line")).toHaveText("Your first link is four steps away. Start with the list you were about to email round.");
  await expect(card.getByRole("link", { name: "Try it on the sample first" })).toBeVisible();
  // One robot on the screen: the empty state is left out while the path says the same.
  await expect(page.getByTestId("mascot")).toHaveCount(1);

  // Show tips off hides the card; on brings it back.
  const tips = page.getByTestId("show-tips");
  await expect(tips).toHaveAttribute("aria-checked", "true");
  await tips.click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("show-tips")).toHaveAttribute("aria-checked", "false");
  await expect(card).toHaveCount(0);
  await page.getByTestId("show-tips").click();
  await expect(card).toHaveCount(1);

  // A project with a pasted list: Import ticked, the line is Shape's.
  await card.getByRole("link", { name: "Start a project" }).click();
  await page.getByLabel("Project name").fill("New expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone", "Approval from the notification email", "Reimbursement through payroll"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 3 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 3 items");
  await page.goto("/app");
  await expect(card).toHaveAttribute("data-tip", "path.shape");
  await expect(card.locator('[data-step="import"]')).toHaveAttribute("data-done", "true");
  await expect(card.locator('[data-step="shape"]')).toHaveAttribute("data-done", "false");
  await expect(card.getByTestId("guide-line")).toHaveText("Let the AI group the items into areas and write a readable version of each. Nothing changes until you accept.");
  await expect(card.getByRole("link", { name: "Go to Shape" })).toHaveAttribute("href", /\/app\/projects\/[0-9a-f-]{36}\/shape$/);

  // Dismiss: gone, the focus on the title, and gone after a reload. The card hides itself
  // before the server stores the dismissal (guide-card.tsx), so the reload waits for that
  // store: a server action is a POST to the page (node_modules/next/dist/docs/01-app/
  // 01-getting-started/07-mutating-data.md, "actions use the POST method").
  const stored = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/app" && r.ok());
  await card.getByTestId("guide-dismiss").click();
  await expect(card).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await stored;
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await expect(card).toHaveCount(0);
  // Tips off and on again: the dismissed card stays gone.
  await page.getByTestId("show-tips").click();
  await expect(page.getByTestId("show-tips")).toHaveAttribute("aria-checked", "false");
  await page.getByTestId("show-tips").click();
  await expect(page.getByTestId("show-tips")).toHaveAttribute("aria-checked", "true");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await expect(card).toHaveCount(0);
});
