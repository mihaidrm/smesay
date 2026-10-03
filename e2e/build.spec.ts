// The main path of E5-1: sign in, create a project, paste a list, open Build (a draft on
// version 1, titled after the project, Name and Role required), see the preview's About you
// page with Start disabled and its hint, add a dropdown field with its options, save, see the
// select with the options in the preview; fill the required fields in the preview and see
// Start enabled; Remove refused on the last field.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.11" } });

test("build the intro and the respondent fields, see them in the preview", async ({ page, request }) => {
  const email = `e2e-build-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("New expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectUrl = page.url().replace(/\/import$/, "");

  // Build before a list: the empty state points to Import.
  await page.goto(`${projectUrl}/build`);
  await expect(page.getByTestId("build-empty")).toContainText("Import a list first.");
  await page.getByRole("link", { name: "Go to Import" }).click();
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Approval from the notification email | Approving | Must"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 2 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 2 items as version 1 on");

  // Build opens a draft on version 1 (acceptance 1): the stepper pill, the title, the fields.
  await page.getByRole("navigation", { name: "Steps" }).getByRole("link", { name: /Build/ }).click();
  await expect(page).toHaveURL(/\/build$/);
  await expect(page.getByRole("heading", { name: "Build the instrument" })).toBeVisible();
  // The stepper says Build on the first open, while the draft is being created, and after.
  await expect(page.getByRole("navigation", { name: "Steps" }).locator("[aria-current='step']")).toHaveText(/Build/);
  await expect(page.getByTestId("build-line")).toHaveText("What respondents see, from version 1 of the list. The preview on the right follows every save.");
  await expect(page.getByLabel("Title")).toHaveValue("New expense tool");
  await expect(page.getByTestId("intro-hint")).toHaveText("Write one or two lines so respondents know what the list is for. They see this first.");
  await expect(page.getByTestId("field-row")).toHaveCount(2);
  await expect(page.getByLabel("Label").nth(0)).toHaveValue("Name");
  await expect(page.getByLabel("Label").nth(1)).toHaveValue("Role");

  // The preview's About you page (acceptance 3): the two fields, Start disabled, the hint.
  const preview = page.getByTestId("about-you");
  await expect(preview.getByRole("heading", { name: "New expense tool" })).toBeVisible();
  await expect(preview.getByLabel("Name")).toBeVisible();
  await expect(preview.getByLabel("Role")).toBeVisible();
  const start = preview.getByTestId("about-you-start");
  await expect(start).toBeDisabled();
  await expect(start).toHaveText("Start with Submitting");
  await expect(start).toHaveCSS("opacity", "0.4");
  await expect(preview.getByTestId("about-you-hint")).toHaveText("Fill in your name and role to start.");

  // The intro, saved and shown in the preview.
  await page.getByRole("textbox", { name: "Intro" }).fill("Six things the new tool should do. Five minutes.");
  await expect(page.getByTestId("intro-hint")).toHaveText("");
  await page.getByTestId("intro-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("intro-form").getByRole("status")).toHaveText("Saved.");
  await expect(preview.getByTestId("about-you-intro")).toHaveText("Six things the new tool should do. Five minutes.");

  // A dropdown field (acceptance 2 and 5): add, type, options, save, see the select.
  await page.getByRole("button", { name: "Add a field" }).click();
  await expect(page.getByTestId("field-row")).toHaveCount(3);
  await page.getByLabel("Label").nth(2).fill("Team");
  await page.getByLabel("Type").nth(2).selectOption("dropdown");
  await page.getByLabel("Options, one per line").fill("Sales\nFinance\nHR");
  await page.getByTestId("fields-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("fields-form").getByRole("status")).toHaveText("Saved.");
  const team = preview.getByLabel("Team (optional)");
  await expect(team).toBeVisible();
  await expect(team.locator("option")).toHaveText(["Choose one", "Sales", "Finance", "HR"]);

  // Start enables once the required fields are filled; the optional one can stay empty.
  await preview.getByLabel("Name").fill("Ana");
  await expect(start).toBeDisabled();
  await preview.getByLabel("Role").fill("Finance");
  await expect(start).toBeEnabled();
  await expect(preview.getByTestId("about-you-hint")).toHaveText("");

  await page.reload();
  await expect(page.getByRole("navigation", { name: "Steps" }).locator("[aria-current='step']")).toHaveText(/Build/);

  // Removing the last field is refused (acceptance 2).
  await page.getByRole("button", { name: "Remove Team" }).click();
  await page.getByRole("button", { name: "Remove Role" }).click();
  await expect(page.getByTestId("field-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Remove Name" }).click();
  await expect(page.getByTestId("field-row")).toHaveCount(1);
  await expect(page.getByTestId("fields-refusal")).toHaveText("Keep at least one field, so you can tell answers apart. Name is the usual one.");

  // The server refuses it too (acceptance 4): the hidden list posted empty.
  await page.getByTestId("fields-form").locator('input[name="fields"]').evaluate((el) => { (el as HTMLInputElement).value = "[]"; });
  await page.getByTestId("fields-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("fields-form").getByRole("alert").last()).toHaveText("Keep at least one field, so you can tell answers apart. Name is the usual one.");
});
