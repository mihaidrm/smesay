// The main path of E7-1: sign in, create a project with a list in two areas, build, publish
// the public link; open it in a fresh context on a phone (390 by 844): About you with the
// workspace in the header and "Closes", Start disabled with the hint until Name and Role
// are filled, Start, the first chapter with its cards; the browser's Back returns to About
// you with the saved values and Forward to the chapter; the chapter's Back the same without
// a reload; a reload lands on the same chapter (the device cookie); at 1440 by 900 the
// About you is a centered 720 px card with Start at 320 px centered in it and "Powered by"
// under the card (decision 0051); the sample
// project's link shows its own page and collects nothing.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.16" } });

test("open a link, fill the fields, start, see the first chapter", async ({ page, request, browser }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const email = `e2e-start-${stamp}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  // Naming it seeds the sample project, which can take more than the default 5 seconds on CI.
  await expect(page).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  // The page stamps quickstart_seen_at while it renders; leaving before it shows can cut that off.
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  // The sample opens on Results (E8-8); its project address is taken from the link.
  const sampleId = (await page.getByTestId("sample-card").getByRole("link", { name: "Open the sample" }).getAttribute("href"))!.match(/projects\/([0-9a-f-]{36})/)![1];
  const sampleHref = `/app/projects/${sampleId}`;
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectUrl = page.url().replace(/\/import$/, "");
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Approval from the notification email | Approving | Must", "Split a receipt across projects | Submitting | Should"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 3 items" }).click();
  await expect(page.getByTestId("imported-line")).toBeVisible();
  await page.goto(`${projectUrl}/build`);
  await expect(page.getByRole("heading", { name: "Build the instrument" })).toBeVisible();
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  const url = await page.getByTestId("share-link").inputValue();

  // The phone.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const link = await phone.newPage();
  await link.goto(url);
  await link.locator("[data-ready]").waitFor();
  await expect(link.getByTestId("about-you")).toBeVisible();
  await expect(link.getByTestId("respondent-header")).toContainText("Marlow Group");
  await expect(link.getByTestId("about-you-note")).toContainText("Closes 20 Jan 2027");
  await expect(link.getByTestId("about-you-start")).toBeDisabled();
  await expect(link.getByTestId("about-you-hint")).toHaveText("Fill in your name and role to start.");
  await link.getByLabel("Name").fill("Ana Pop");
  await link.getByLabel("Role").fill("Finance lead");
  await expect(link.getByTestId("about-you-start")).toBeEnabled();
  await expect(link.getByTestId("about-you-start")).toHaveText("Start with Submitting");
  await link.getByTestId("about-you-start").click();
  await expect(link.getByTestId("chapter-screen")).toBeVisible();
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  await expect(link.getByTestId("item-card")).toHaveCount(2);
  await expect(link).toHaveURL(/\?at=1$/);
  // The browser's Back and Forward move between About you and the chapter.
  await link.goBack();
  await expect(link).toHaveURL(/\?at=about$/);
  await expect(link.getByLabel("Name")).toHaveValue("Ana Pop");
  await link.goForward();
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  // The chapter's Back keeps the saved values without a reload.
  await link.getByTestId("chapter-back").click();
  await expect(link.getByLabel("Name")).toHaveValue("Ana Pop");
  await expect(link.getByTestId("about-you-start")).toBeEnabled();
  await link.getByTestId("about-you-start").click();
  await expect(link).toHaveURL(/\?at=1$/);
  // A reload on this device lands on the same chapter: the response is found by the cookie.
  await link.reload();
  await link.locator("[data-ready]").waitFor();
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  await phone.close();

  // The desktop: About you a centered 720 px card, Start centered, "Powered by" last.
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const deskPage = await desk.newPage();
  await deskPage.goto(url);
  await deskPage.locator("[data-ready]").waitFor();
  const box = (await deskPage.getByTestId("about-you").boundingBox())!;
  expect(box.width).toBe(720);
  expect(Math.abs(box.x + box.width / 2 - 720)).toBeLessThanOrEqual(1);
  const start = (await deskPage.getByTestId("about-you-start").boundingBox())!;
  expect(start.width).toBe(320);
  expect(Math.abs(start.x + start.width / 2 - 720)).toBeLessThanOrEqual(1);
  const name = (await deskPage.getByLabel("Name").boundingBox())!;
  expect(name.width).toBeGreaterThan(600);
  const privacy = (await deskPage.getByTestId("privacy-link").boundingBox())!;
  expect(privacy.y).toBeGreaterThan(start.y + start.height);
  await deskPage.getByLabel("Name").fill("Bo");
  await deskPage.getByLabel("Role").fill("Sales");
  await deskPage.getByTestId("about-you-start").click();
  await expect(deskPage.getByTestId("chapter-title")).toHaveText("Submitting");
  const cards = deskPage.getByTestId("item-card");
  const [first, second] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
  expect(first && second && Math.abs(first.y - second.y) < 2).toBe(true);
  await desk.close();

  // The sample project's link: its own page.
  await page.goto(`${sampleHref}/share`);
  const sampleUrl = await page.getByTestId("share-link").inputValue();
  const visitor = await browser.newContext();
  const sampleTab = await visitor.newPage();
  await sampleTab.goto(sampleUrl);
  await expect(sampleTab.getByRole("heading", { name: "This is a sample link." })).toBeVisible();
  await expect(sampleTab.getByText("does not collect answers")).toBeVisible();
  await expect(sampleTab.getByTestId("sample-band")).toBeVisible();
  await visitor.close();
});
