// Visitor analytics (stories/E13-3, acceptances 1, 4 and 5): with PLAUSIBLE_DOMAIN and
// PLAUSIBLE_SCRIPT_SRC unset, as here and in CI, no Plausible script is on any page; the
// utm_source a visitor arrives with rides from the landing page through the magic link to the
// workspace step and shows on the admin page. The script with the variables set is the unit
// test's (src/lib/plausible.test.ts): the server's variables are fixed for the whole run.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// One rate-limit bucket per spec file (e2e/workspace.spec.ts says why).
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.76" } });

test("no script while off, and the source reaches the admin page", async ({ page, request }) => {
  for (const path of ["/landing-page", "/sign-in", "/sample"]) {
    await page.goto(path);
    await expect(page.locator('script[data-analytics="plausible"]')).toHaveCount(0);
  }

  const email = `e2e-source-${Date.now()}@marlow.example`;
  const name = `Source Ltd ${Date.now()}`;
  await page.goto("/landing-page?utm_source=LinkedIn");
  const start = page.getByRole("link", { name: /^Start free/ }).first();
  await expect(start).toHaveAttribute("href", "/sign-in?utm_source=linkedin");
  await start.click();
  await expect(page).toHaveURL(/\/sign-in\?utm_source=linkedin$/);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await expect(page).toHaveURL(/\/app\/new\?source=linkedin$/);
  await page.getByLabel("Workspace name").fill(name);
  await page.getByRole("button", { name: "Create workspace" }).click();
  // Naming it seeds the sample project, which can take more than the default 5 seconds on CI.
  await expect(page.getByTestId("quickstart")).toBeVisible({ timeout: 15_000 });
  await page.context().clearCookies();

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("e2e-admin@marlow.example");
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, "e2e-admin@marlow.example"));
  // The link lands on the app and may be sent on (the workspace step, the quickstart); let it
  // settle before leaving, or the next navigation cuts the redirect off.
  await expect(page).toHaveURL(/\/app(\/new|\/quickstart)?$/);
  await page.waitForLoadState("networkidle");
  await page.goto("/admin");
  const row = page.getByTestId("admin-workspace-row").filter({ hasText: name });
  await expect(row.getByTestId("admin-source")).toHaveText("linkedin");
});
