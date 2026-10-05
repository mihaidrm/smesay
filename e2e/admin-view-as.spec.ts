// An admin's view of a workspace, main path (stories/E14-4, acceptance 5): a PM makes a
// workspace; an admin opens it in the admin area, starts View as, sees the banner and Settings
// with its Save disabled, stops the view and is back on the workspace's admin page, and the
// audit log has both rows. playwright.config.ts lists e2e-admin-view@marlow.example in
// ADMIN_EMAILS.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// One rate-limit bucket per spec file (e2e/workspace.spec.ts says why).
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.79" } });

test("an admin views a workspace read-only and stops", async ({ browser, page, request }) => {
  const stamp = Date.now();
  const name = `Curlew Labs ${stamp}`;
  const signIn = async (p: typeof page, email: string) => {
    await p.goto("/sign-in");
    await p.getByLabel("Email").fill(email);
    await p.getByRole("button", { name: "Send me a link" }).click();
    await expect(p.getByRole("status")).toBeVisible();
    await p.goto(await latestLink(request, email));
  };

  const pm = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.79" } });
  const pmPage = await pm.newPage();
  await signIn(pmPage, `e2e-curlew-${stamp}@marlow.example`);
  await pmPage.getByLabel("Workspace name").fill(name);
  await pmPage.getByRole("button", { name: "Create workspace" }).click();
  await expect(pmPage).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  await expect(pmPage.getByTestId("quickstart")).toBeVisible();
  await pm.close();

  await signIn(page, "e2e-admin-view@marlow.example");
  await expect(page).toHaveURL(/\/app(\/new|\/quickstart)?$/);
  await page.waitForLoadState("networkidle");
  await page.goto(`/admin/workspaces?q=${encodeURIComponent(`curlew-${stamp}@`)}`);
  await page.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);

  const start = page.getByTestId("view-as-form");
  await start.getByRole("button", { name: "View as the owner" }).click();
  await expect(start.getByTestId("confirm-line")).toContainText(`View ${name} as its owner sees it?`);
  await start.getByRole("button", { name: "Confirm" }).click();
  await expect(page).toHaveURL(/\/app$/);
  const banner = page.getByTestId("view-as-banner");
  await expect(banner).toContainText(`Viewing ${name} as its owner sees it. Changes are off.`);
  await expect(page.getByTestId("sidebar")).toContainText(name);

  // Settings as the owner sees it, every control disabled.
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByLabel("Workspace name")).toHaveValue(name);
  await expect(page.getByLabel("Workspace name")).toBeDisabled();
  const save = page.getByRole("button", { name: /^Save/ }).first();
  await expect(save).toBeDisabled();
  await expect(save).toHaveCSS("opacity", "0.4");

  await banner.getByRole("button", { name: "Stop viewing" }).click();
  await expect(page).toHaveURL(/\/admin\/workspaces\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);

  await page.getByRole("navigation", { name: "Admin pages" }).getByRole("link", { name: "Audit log" }).click();
  const rows = page.getByTestId("audit-row").filter({ hasText: name });
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Stopped viewing");
  await expect(rows.nth(1)).toContainText("Started viewing as the owner");
});
