// The main path of E4-8: the developer menu in the sidebar (shown in CI's production build
// by SMESAY_DEV_MENU=1, playwright.config.ts). A PM imports a one-item list, switches AI
// calls to Stand-in and shapes it: the thinking state shows, then the areas and the line
// saying they came from the stand-in; the project header carries the "AI: stand-in" pill.
// After a respondent submits, on the Actions tab: Off refuses Write actions with its own
// sentence in the danger box and no run; Stand-in writes four actions at zero cost with the
// stand-in line under them; Real removes the pill.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.82" } });

test("switch AI calls between Off, Stand-in and Real, and see where each answer came from", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const email = `e2e-dev-menu-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(page.request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2) and seeds the sample.
  await expect(page).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  // The menu is in the sidebar on every signed-in page, with the month's usage at zero.
  await expect(page.getByTestId("dev-menu")).toBeVisible();
  await expect(page.getByTestId("dev-menu-usage")).toHaveText("0 AI runs, EUR 0.00");

  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectUrl = page.url().replace(/\/import$/, "");
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill("Receipts captured by phone | Submitting | Must");
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 1 item" }).click();
  await expect(page.getByTestId("imported-line")).toBeVisible();

  // Stand-in: the pill appears in the project header; Shape shows the thinking state (the
  // in-process stand-in waits 2 s), then the areas with the stand-in line.
  await page.getByTestId("ai-mode-standin").check();
  await expect(page.getByTestId("ai-mode-pill")).toHaveText("AI: stand-in");
  await page.goto(`${projectUrl}/shape`);
  await page.getByRole("button", { name: "Shape with AI" }).click();
  await expect(page.getByTestId("thinking-line")).toContainText("Reading 1 item");
  await expect(page.getByTestId("grouped-line")).toContainText("AI grouped 1 item into 1 area and wrote a readable version of each.");
  await expect(page.getByTestId("shape-stand-in")).toHaveText("These areas and readable versions came from the stand-in, not the AI.");

  await page.goto(`${projectUrl}/build`);
  await expect(page.getByRole("heading", { name: "Build the validation" })).toBeVisible();
  // The menu counts the stand-in run as a run at no cost.
  await expect(page.getByTestId("dev-menu-usage")).toHaveText("1 AI run, EUR 0.00");
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  const url = await page.getByTestId("share-link").inputValue();

  // Before anyone submits, the Actions tab says why a run has nothing to read.
  await page.goto(`${projectUrl}/results?tab=actions`);
  await expect(page.getByTestId("actions-counts")).toHaveText("Actions are written from submitted answers. 0 of 0 responses are submitted.");
  await expect(page.getByTestId("actions-no-run")).toBeVisible();

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const link = await phone.newPage();
  await link.goto(url);
  await link.locator("[data-ready]").waitFor();
  await link.getByLabel("Name").fill("Ana Pop");
  await link.getByLabel("Role").fill("Finance lead");
  await link.getByTestId("about-you-start").click();
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  await link.getByTestId("item-card").getByRole("radio", { name: "Should" }).click();
  await link.getByTestId("card-reason").fill("Most receipts arrive by email now.");
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await link.getByTestId("chapter-continue").click();
  await expect(link).toHaveURL(/\?at=wrap$/);
  await link.getByTestId("wrap-up-confidence").getByRole("radio", { name: "4" }).click();
  await link.getByTestId("wrap-up-signoff").click();
  await link.getByTestId("wrap-up-submit").click();
  await expect(link.getByTestId("done-thanks")).toBeVisible();
  await phone.close();

  // Off: the refusal in the danger box, no run made.
  await page.goto(`${projectUrl}/results?tab=actions`);
  await expect(page.getByTestId("actions-counts")).toHaveCount(0);
  await page.getByTestId("ai-mode-off").check();
  await expect(page.getByTestId("ai-mode-pill")).toHaveText("AI: off");
  await page.getByTestId("write-actions").click();
  await expect(page.getByTestId("actions-error")).toHaveText("AI is switched off in the developer menu. Switch it to Stand-in or Real to run this.");
  await expect(page.getByTestId("actions-error").getByRole("button", { name: "Try again" })).toHaveCount(0);
  await expect(page.getByTestId("actions-no-run")).toBeVisible();
  await expect(page.getByTestId("dev-menu-usage")).toHaveText("1 AI run, EUR 0.00");

  // Stand-in: the thinking state with the tab's counts, four actions, the stand-in line.
  await page.getByTestId("ai-mode-standin").check();
  await expect(page.getByTestId("ai-mode-pill")).toHaveText("AI: stand-in");
  await page.getByTestId("write-actions").click();
  await expect(page.getByTestId("thinking-line")).toContainText("Reading 1 item and 1 answer");
  await expect(page.getByTestId("action")).toHaveCount(4);
  await expect(page.getByTestId("actions-stand-in")).toHaveText("These actions came from the stand-in, not the AI.");
  await expect(page.getByTestId("actions-cost")).toContainText("1,500 tokens, EUR 0.00. This workspace this month: EUR 0.00.");

  // Real: no pill. (In this run "real" is the stand-in server, so nothing is spent.)
  await page.goto(`${projectUrl}/results?tab=actions`);
  await expect(page.getByTestId("dev-menu-usage")).toHaveText("2 AI runs, EUR 0.00");
  await page.getByTestId("ai-mode-real").check();
  await expect(page.getByTestId("ai-mode-pill")).toHaveCount(0);
});
