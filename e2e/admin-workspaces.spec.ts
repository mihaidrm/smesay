// The admin Workspaces pages' main path (stories/E14-2, acceptance 5): a PM makes a workspace;
// an admin finds it by name, opens it, changes its plan through the confirm line, and sees the
// row in the audit log. playwright.config.ts lists e2e-admin-workspaces@marlow.example in
// ADMIN_EMAILS.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// One rate-limit bucket per spec file (e2e/workspace.spec.ts says why).
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.77" } });

test("an admin changes a workspace's plan and sees the audit row", async ({ browser, page, request }) => {
  const stamp = Date.now();
  const name = `Heron Freight ${stamp}`;
  const signIn = async (p: typeof page, email: string) => {
    await p.goto("/sign-in");
    await p.getByLabel("Email").fill(email);
    await p.getByRole("button", { name: "Send me a link" }).click();
    await expect(p.getByRole("status")).toBeVisible();
    await p.goto(await latestLink(request, email));
  };

  // The PM's workspace, in a context of its own.
  const pm = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.77" } });
  const pmPage = await pm.newPage();
  await signIn(pmPage, `e2e-heron-${stamp}@marlow.example`);
  await pmPage.getByLabel("Workspace name").fill(name);
  await pmPage.getByRole("button", { name: "Create workspace" }).click();
  await expect(pmPage).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  await expect(pmPage.getByTestId("quickstart")).toBeVisible();
  await pm.close();

  await signIn(page, "e2e-admin-workspaces@marlow.example");
  await expect(page).toHaveURL(/\/app(\/new|\/quickstart)?$/);
  await page.waitForLoadState("networkidle");
  await page.goto("/admin/workspaces");
  await page.getByLabel("Name, slug or a member's email").fill(`heron-${stamp}@`);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\?q=/);
  await expect(page.getByTestId("workspace-row")).toHaveCount(1);
  await page.getByRole("link", { name }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByTestId("admin-plan")).toHaveText("Free");
  const planForm = page.getByTestId("plan-form");
  await planForm.getByLabel("Plan").selectOption("pro");
  await planForm.getByRole("button", { name: "Change the plan" }).click();
  await expect(planForm.getByTestId("confirm-line")).toContainText(`Change the plan of ${name} to Pro?`);
  await planForm.getByRole("button", { name: "Confirm" }).click();
  await expect(planForm.getByRole("status")).toHaveText("Plan changed to Pro.");
  await expect(page.getByTestId("admin-plan")).toHaveText("Pro");

  await page.getByRole("navigation", { name: "Admin pages" }).getByRole("link", { name: "Audit log" }).click();
  const row = page.getByTestId("audit-row").filter({ hasText: name });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Changed the plan");
  await expect(row).toContainText("from: free, to: pro");
  await expect(row.getByTestId("audit-outcome")).toHaveText("Done");
});
