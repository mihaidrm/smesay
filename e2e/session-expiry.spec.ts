// The main path of E11-6, acceptance 3, on the project context box: the session ends while the
// PM types; Save shows the signed-out banner and the text stays; after signing in again (the
// session cookie put back, as a new sign-in would) the page shows the draft from the tab's
// session storage; Save keeps it on the server.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.71" } });

test("a save after the session ended keeps what was typed", async ({ page, request }) => {
  const email = `e2e-expiry-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  await expect(page).toHaveURL(/\/app\/quickstart$/);
  // The page stamps quickstart_seen_at while it renders; leaving before it shows can cut that off.
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/import$/);
  const url = page.url();

  const signedIn = await page.context().cookies();
  await page.context().clearCookies();
  const goal = "We are replacing the expense tool for all 400 staff.";
  await page.getByLabel("What is this about?").fill(goal);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("signed-out")).toContainText("You were signed out. Sign in again; what you typed on this page is kept.");
  await expect(page.getByTestId("signed-out").getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", `/sign-in?next=${encodeURIComponent(new URL(url).pathname)}`);
  await expect(page.getByLabel("What is this about?")).toHaveValue(goal);

  await page.context().addCookies(signedIn);
  await page.goto(url);
  await expect(page.getByLabel("What is this about?")).toHaveValue(goal);
  await expect(page.getByTestId("draft-back")).toBeVisible();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  await page.reload();
  await expect(page.getByLabel("What is this about?")).toHaveValue(goal);
  await expect(page.getByTestId("draft-back")).toHaveCount(0);
});
