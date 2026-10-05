// The main path of E6-1: sign in, create a project, paste a list, see Share's empty state
// point to Build, open Build (the draft), publish with a close date and a passcode, see the
// link and Published; open the link in a fresh context, see the passcode page, get a wrong
// one refused, enter the right one, see About you; an unknown token gets its page; set the
// close date to the past, reload the link, see the closed page; the Import banner says the
// list is published.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.12" } });

test("publish a public link, open it with the passcode, close it", async ({ page, request, browser }) => {
  test.setTimeout(90_000);
  const email = `e2e-share-${Date.now()}@marlow.example`;
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
  await page.getByLabel("Project name").fill("New expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectUrl = page.url().replace(/\/import$/, "");
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Approval from the notification email | Approving | Must"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 2 items" }).click();
  await expect(page.getByTestId("imported-line")).toBeVisible();

  // Share before Build points to Build; Build makes the draft; Share shows the draft card.
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-empty")).toContainText("Build the instrument first.");
  await page.getByRole("link", { name: "Go to Build" }).click();
  await expect(page.getByRole("heading", { name: "Build the instrument" })).toBeVisible();
  await page.getByRole("navigation", { name: "Steps" }).getByRole("link", { name: /Share/ }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Draft");
  await expect(page.getByTestId("link-note")).toHaveText("Not published yet. Nobody can open the link.");
  await expect(page.getByTestId("share-version")).toHaveText("Built on version 1 of the list.");

  // A close date before the open date is refused; a close date next month with a short
  // passcode is refused; then it publishes.
  // The form fills its fields after it mounts (share-form.tsx): wait for the zone line.
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Opens").fill("2027-01-10T09:00");
  await page.getByLabel("Closes").fill("2027-01-05T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("share-form").getByRole("alert")).toHaveText("The close date is before the open date. Pick a later close date.");
  await page.getByLabel("Opens").fill("");
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByLabel("Passcode, optional").fill("abc");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("share-form").getByRole("alert")).toHaveText("Use at least 6 characters. Respondents type it once per device.");
  await page.getByLabel("Passcode, optional").fill("letmein");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  await expect(page.getByTestId("link-note")).toHaveText("Anyone with the link can respond until the close date.");
  const url = await page.getByTestId("share-link").inputValue();
  expect(url).toMatch(/\/r\/[0-9a-f]{32}$/);
  // Published: Share is done and Results is the step the project has reached (E8-1).
  await expect(page.getByRole("navigation", { name: "Steps" }).locator("[aria-current='step']")).toHaveText(/Results/);
  await expect(page.getByText("A passcode is set. Type a new one to change it.")).toBeVisible();

  // A fresh context (no session, no cookie): the passcode page, a wrong one refused, the
  // right one opens About you with the fields; an unknown token has its own page.
  const respondent = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const link = await respondent.newPage();
  await link.goto(url);
  await expect(link.getByRole("heading", { name: "This link needs a passcode." })).toBeVisible();
  await link.getByLabel("Passcode").fill("wrong1");
  await link.getByRole("button", { name: "Continue" }).click();
  await expect(link.getByTestId("passcode-form").getByRole("alert")).toHaveText("That passcode is not right. Ask the person who sent you the link.");
  await link.getByLabel("Passcode").fill("letmein");
  await link.getByRole("button", { name: "Continue" }).click();
  await expect(link.getByTestId("about-you")).toBeVisible();
  await expect(link.getByRole("heading", { name: "New expense tool" })).toBeVisible();
  await expect(link.getByTestId("about-you-note")).toContainText("Closes 20 Jan 2027");
  await expect(link.getByLabel("Name")).toBeVisible();
  await expect(link.getByTestId("about-you-start")).toBeDisabled();
  await link.goto(url.replace(/[0-9a-f]{32}$/, "0".repeat(32)));
  await expect(link.getByRole("heading", { name: "This link does not match any project." })).toBeVisible();

  // The close date moved to the past closes the link; Import shows the published banner.
  await page.getByLabel("Closes").fill("2026-01-01T09:00");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("share-form").getByRole("status")).toHaveText("Saved.");
  await expect(page.getByTestId("link-note")).toHaveText("The link is closed. Respondents see the closed page.");
  await link.goto(url);
  await expect(link.getByRole("heading", { name: "Link closed." })).toBeVisible();
  await expect(link.getByText(/stopped collecting answers for New expense tool on/)).toBeVisible();
  await respondent.close();
  await page.goto(`${projectUrl}/import`);
  await expect(page.getByTestId("published-banner")).toContainText("This list is published.");
  // The project list reads the link: Closed now that the close date passed.
  await page.goto("/app");
  await expect(page.getByTestId("project-row").filter({ hasText: "New expense tool" }).getByTestId("project-status")).toHaveText("Closed");
});
