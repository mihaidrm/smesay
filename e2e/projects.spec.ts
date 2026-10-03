// The main path of E3-1 (acceptance 5): create a project, type a context, see the count,
// reload, the context is there; the list shows the new project as a draft next to the sample;
// with the sample deleted and the project archived, the list shows the archived state.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.5" } });

test("create a project and keep its context", async ({ page, request }) => {
  const email = `e2e-project-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("No projects yet")).toBeVisible();
  await expect(page.getByTestId("project-row")).toHaveCount(1);

  await page.getByRole("link", { name: "New project" }).first().click();
  await expect(page).toHaveURL(/\/app\/projects\/new$/);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText("Enter a name for the project, up to 80 characters.")).toBeVisible();
  await page.getByLabel("Project name").fill("New expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("New expense tool");
  await expect(page.getByRole("navigation", { name: "Steps" }).getByText("Import")).toBeVisible();

  await page.getByLabel("What is this about?").fill("We are replacing the expense tool for all 400 staff.");
  await page.getByLabel("Terms to keep as written, optional").fill("cost centre, policy limit");
  await expect(page.getByTestId("context-count")).toHaveText("77 of 2,000 characters");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  await page.reload();
  await expect(page.getByLabel("What is this about?")).toHaveValue("We are replacing the expense tool for all 400 staff.");
  await expect(page.getByLabel("Terms to keep as written, optional")).toHaveValue("cost centre, policy limit");

  await page.getByRole("link", { name: "All" }).click();
  await expect(page).toHaveURL(/\/app$/);
  const rows = page.getByTestId("project-row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText("New expense tool");
  await expect(rows.nth(1).getByTestId("project-status")).toHaveText("Draft");
  await expect(rows.nth(1)).toContainText("0 of 0");
  await expect(rows.first().getByTestId("project-status")).toHaveText("Sample");
  await expect(rows.first()).toContainText("5 of 7");
  await expect(page.getByText("No projects yet")).toHaveCount(0);

  // Every project archived and the sample deleted: the list is empty, the robot says so.
  await page.getByRole("button", { name: "Delete sample" }).click();
  await page.getByTestId("delete-sample-confirm").getByRole("button", { name: "Delete sample" }).click();
  await expect(rows).toHaveCount(1);
  await rows.first().getByRole("link", { name: "Open" }).click();
  await page.getByRole("button", { name: "Archive project" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("All your projects are archived")).toBeVisible();
  await expect(page.locator('img[src="/assets/mascot/idea.svg"]')).toBeVisible();
  await expect(rows).toHaveCount(0);
  await page.getByRole("link", { name: "Show archived" }).first().click();
  await expect(rows).toHaveCount(1);
});
