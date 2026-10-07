// The main path of E5-9: sign in, create a project, paste a list, open Build, type in the
// Intro, click the Share pill and stay on Build with the banner, the "Not saved" label and
// the marked card; Discard empties the Intro and clears the banner; type again, click Share
// and stay; Save, click Share and reach Share.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.82" } });

test("a step with unsaved changes keeps the page until Save or Discard", async ({ page, request }) => {
  test.setTimeout(90_000);
  const email = `e2e-unsaved-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app");
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("New expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Approval from the notification email | Approving | Must"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 2 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 2 items as version 1 on");

  const steps = page.getByRole("navigation", { name: "Steps" });
  await steps.getByRole("link", { name: /Build/ }).click();
  await expect(page).toHaveURL(/\/build$/);
  const intro = page.getByRole("textbox", { name: "Intro" });
  await expect(intro).toBeVisible();
  const introCard = page.locator('section[aria-labelledby="build-intro-title"]');
  const banner = page.getByTestId("unsaved-banner");

  // Typed, not saved: the Share pill keeps the page and says what is not saved (acceptance 2).
  await intro.fill("Not yet saved.");
  await steps.getByRole("link", { name: /Share/ }).click();
  await expect(page).toHaveURL(/\/build$/);
  await expect(banner).toHaveText(/Save or discard your changes before you leave: Intro\./);
  await expect(introCard.getByTestId("unsaved-mark")).toHaveText("Not saved");
  await expect(page.getByTestId("intro-form")).toHaveAttribute("data-unsaved", "");
  await expect(page.locator('section[aria-labelledby="build-scoring-title"]').getByTestId("unsaved-mark")).toHaveCount(0);

  // Discard puts the server's values back and clears the banner and the label (acceptance 3).
  await banner.getByRole("button", { name: "Discard" }).click();
  await expect(banner).toHaveCount(0);
  await expect(introCard.getByTestId("unsaved-mark")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Intro" })).toHaveValue("");

  // Typed again, stopped again, then Save lets the next click through (acceptance 3).
  await page.getByRole("textbox", { name: "Intro" }).fill("Six things the new tool should do. Five minutes.");
  await steps.getByRole("link", { name: /Share/ }).click();
  await expect(page).toHaveURL(/\/build$/);
  await expect(banner).toBeVisible();
  await page.getByTestId("intro-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("intro-form").getByRole("status")).toHaveText("Saved.");
  await expect(banner).toHaveCount(0);
  await steps.getByRole("link", { name: /Share/ }).click();
  await expect(page).toHaveURL(/\/share$/);
  await expect(page.getByRole("heading", { name: "Share the list" })).toBeVisible();
});
