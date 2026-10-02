// The main path of the workspace step (stories/E2-3, acceptance 6): sign in for the first
// time, name the workspace, see the sample project in the list with its pill and its updated
// line, and the workspace name in the sidebar and the breadcrumb.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test("name the workspace on the first sign-in and see the sample project", async ({ page, request }) => {
  const email = `e2e-ws-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await expect(page).toHaveURL(/\/app\/new$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Name your workspace");
  await expect(page.getByLabel("Workspace name")).toHaveValue("Marlow.example");

  await page.getByLabel("Workspace name").fill("   ");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page.getByText("Enter a name for your workspace, up to 80 characters.")).toBeVisible();

  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  const sidebar = page.getByRole("complementary");
  await expect(sidebar.getByText("Marlow Group")).toBeVisible();
  await expect(sidebar.getByText("1 member")).toBeVisible();
  await expect(page.getByTestId("breadcrumb")).toHaveText("Marlow Group");
  const rows = page.getByTestId("project-row");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Sample project");
  await expect(rows.first().getByTestId("project-status")).toHaveText("Sample");
  await expect(rows.first()).toContainText("Created with the workspace");

  // A second visit to the create page goes back to the app, and so does a second sign-in: the
  // new session selects the only workspace without asking (src/lib/workspace-choice.ts).
  await page.goto("/app/new");
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByTestId("breadcrumb")).toHaveText("Marlow Group");
});
