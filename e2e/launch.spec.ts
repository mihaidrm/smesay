// The main path of E2-7 (acceptance 7): the admin launches SMEsay, the developer menu is gone,
// Settings shows the trial; the admin takes it back and the menu is back. This spec flips the
// product's one row for the whole database, so playwright.config.ts runs it in its own project
// after every other spec. The admin address is in ADMIN_EMAILS there.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.90" } });

test("the admin launches SMEsay and takes it back", async ({ page, request }) => {
  test.setTimeout(90_000);
  const email = "e2e-admin-launch@marlow.example";
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  // The admin's own workspace, free and without a trial until the launch. The magic link lands
  // on /app, which sends a person without a workspace on to /app/new, so the spec waits for
  // the workspace form or the shell's menu, not for an address in the redirect.
  const nameField = page.getByLabel("Workspace name");
  await expect(nameField.or(page.getByTestId("dev-menu"))).toBeVisible({ timeout: 15_000 });
  if (await nameField.isVisible()) {
    await page.getByLabel("Workspace name").fill("Launch Co");
    await page.getByRole("button", { name: "Create workspace" }).click();
    await expect(page).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
    await expect(page.getByTestId("quickstart")).toBeVisible();
  }
  await page.goto("/app");
  await expect(page.getByTestId("dev-menu")).toBeVisible();
  await page.goto("/app/settings");
  await expect(page.getByTestId("plan-name")).toContainText("Free");
  await expect(page.getByTestId("plan-trial-ends")).toHaveCount(0);

  await page.goto("/admin");
  const launch = page.getByTestId("admin-launch");
  await expect(launch.getByTestId("admin-launch-state")).toContainText("SMEsay is being built");
  const launchForm = page.getByTestId("launch-form");
  await launchForm.getByRole("button", { name: "Launch SMEsay" }).click();
  await expect(launchForm).toContainText("Launch SMEsay now?");
  await launchForm.getByRole("button", { name: "Confirm" }).click();
  // The page re-renders with the reverse button on the same form, under the done line.
  await expect(launch.getByRole("status")).toContainText("SMEsay is launched.");
  await expect(launch.getByTestId("take-back-form")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("admin-launch-state")).toContainText(`Launched on`);
  await expect(page.getByTestId("admin-launch-state")).toContainText(email);

  // Launched: no developer menu, the trial on the Plan card.
  await page.goto("/app");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("dev-menu")).toHaveCount(0);
  await page.goto("/app/settings");
  await expect(page.getByTestId("plan-name")).toContainText("Trial");
  await expect(page.getByTestId("plan-trial-ends")).toContainText("Ends on");
  await expect(page.getByTestId("plan-note")).toHaveText("One validation and 20 respondents for 7 days, with the AI. Then the free plan.");

  // Back to building: the menu is back; the trial already granted keeps its date.
  await page.goto("/admin");
  const backForm = page.getByTestId("take-back-form");
  await backForm.getByRole("button", { name: "Take SMEsay back to building" }).click();
  await backForm.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByTestId("admin-launch").getByRole("status")).toContainText("SMEsay is back to building.");
  await expect(page.getByTestId("launch-form")).toBeVisible();
  await page.goto("/app");
  await expect(page.getByTestId("dev-menu")).toBeVisible();
  await page.goto("/app/settings");
  await expect(page.getByTestId("plan-name")).toContainText("Free");
});
