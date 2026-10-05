// The admin Overview's main path (stories/E13-2, acceptance 6): an email in ADMIN_EMAILS sees
// the page; another signed-in email, and anyone signed out, gets the 404 status and page.
// playwright.config.ts gives the server ADMIN_EMAILS: e2e-admin@marlow.example and one address per
// admin spec.
import { expect, test } from "@playwright/test";
import { ADMIN_ROUTES } from "./admin-routes";
import { latestLink } from "./mailpit";

// One rate-limit bucket per spec file (e2e/workspace.spec.ts says why).
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.75" } });

test("only an admin email sees the admin page", async ({ page, request }) => {
  // The 404 says nothing an unknown address does not: the same title, no admin words.
  await page.goto("/no-such-page");
  const unknownTitle = await page.title();
  expect((await page.goto("/admin"))?.status()).toBe(404);
  expect(await page.title()).toBe(unknownTitle);
  expect(await page.content()).not.toMatch(/Overview|SMEsay admin|Funnel per week/);

  const signIn = async (email: string) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send me a link" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await page.goto(await latestLink(request, email));
    await expect(page).toHaveURL(/\/app(\/new|\/quickstart)?$/);
  };

  // Signed out, every admin address is a 404 (stories/E14-1, acceptance 5).
  for (const route of ADMIN_ROUTES) expect((await page.goto(route))?.status(), route).toBe(404);

  await signIn(`e2e-not-admin-${Date.now()}@marlow.example`);
  const refused = await page.goto("/admin");
  expect(refused?.status()).toBe(404);
  expect(await page.title()).toBe(unknownTitle);
  await expect(page.getByText("This page does not exist.")).toBeVisible();
  for (const route of ADMIN_ROUTES) {
    expect((await page.goto(route))?.status(), route).toBe(404);
    expect(await page.content(), route).not.toMatch(/Audit log|SMEsay admin|Back to the app/);
  }
  await page.context().clearCookies();

  await signIn("e2e-admin@marlow.example");
  await page.waitForLoadState("networkidle");
  expect((await page.goto("/admin"))?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
  await expect(page.getByTestId("admin-totals").getByTestId("stat-tile")).toHaveCount(4);
  await expect(page.getByTestId("admin-funnel").locator("tbody tr")).toHaveCount(12);
  await expect(page.getByTestId("admin-metric")).toContainText("Workspaces with a response submitted this month");
  await expect(page.getByTestId("admin-metric")).toContainText("No threshold set yet: paid plans stay off.");
});

// The admin shell and the audit log (stories/E14-1, acceptance 5).
test("an admin sees the shell and the audit log", async ({ page, request }) => {
  await page.goto("/sign-in");
  // An admin address of its own, so no other spec's sign-in link can be picked up here.
  await page.getByLabel("Email").fill("e2e-admin-shell@marlow.example");
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, "e2e-admin-shell@marlow.example"));
  await expect(page).toHaveURL(/\/app(\/new|\/quickstart)?$/);
  await page.waitForLoadState("networkidle");

  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Admin pages" });
  await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("admin-email")).toHaveText("e2e-admin-shell@marlow.example");
  await expect(page.getByRole("link", { name: "Back to the app" })).toHaveAttribute("href", "/app");

  await nav.getByRole("link", { name: "Audit log" }).click();
  await expect(page).toHaveURL(/\/admin\/audit$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Audit log");
  await expect(nav.getByRole("link", { name: "Audit log" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("audit-empty").or(page.getByTestId("audit-table"))).toBeVisible();
  await expect(page.getByTestId("audit-pages")).toContainText(/Page 1 of \d+/);
});
