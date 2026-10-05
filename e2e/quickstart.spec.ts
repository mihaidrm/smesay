// The quickstart's main path (stories/E12-2, acceptance 4): the first sign-in shows the
// quickstart after naming the workspace, its two links go where acceptance 2 says, the second
// sign-in lands on Projects, and Help in the sidebar shows the quickstart again.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// One rate-limit bucket per spec file (e2e/workspace.spec.ts says why).
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.73" } });

test("shown once after the first sign-in, then under Help", async ({ page, request }) => {
  const email = `e2e-quickstart-${Date.now()}@marlow.example`;
  const signIn = async () => {
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send me a link" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await page.goto(await latestLink(request, email));
  };

  await page.goto("/sign-in");
  await signIn();
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app\/quickstart$/);
  const quickstart = page.getByTestId("quickstart");
  await expect(quickstart.getByRole("heading", { level: 1 })).toHaveText("Your first validation in four steps");
  await expect(quickstart.getByRole("listitem")).toHaveCount(4);
  await expect(quickstart.getByRole("heading", { level: 2 })).toHaveText(["Import the list", "Shape it", "Build the validation", "Share one link", "Then: read the results"]);

  await quickstart.getByRole("link", { name: "Open the sample project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[^/]+\/results$/);
  await page.goto("/app/quickstart");
  await quickstart.getByRole("link", { name: "Start a project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/new$/);

  // Seen once: Projects stays Projects, in this session and after signing in again.
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await signIn();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");

  await page.getByRole("complementary").getByRole("link", { name: "Help" }).click();
  await expect(page).toHaveURL(/\/app\/quickstart$/);
  await expect(quickstart.getByRole("heading", { level: 1 })).toHaveText("Your first validation in four steps");
});
