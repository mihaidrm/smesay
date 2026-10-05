// The main path of E7-2: a published project with three items in two areas, opened on a
// 375 by 667 phone. Chapters: the document does not scroll sideways and the smallest pill
// is 38 px; a card answered with another value than the proposal asks "Could you tell us why
// you think the priority should be different?" and has no note until the reason is written,
// then "Saved"; Unclear without a question has no note either (design note 99); the typed reason is kept when the answer
// changes and comes back after a reload; the selected pill takes the workspace accent.
// The PM then switches the layout on Build: one item per screen ("Item 1 of 2 in
// Submitting", Next item) and the single page ("All 3 on one page"), each with the same
// width and pill checks. The project is the test's own: the sample link shows its own page
// and collects nothing (E8-8; docs/review-list.md).
import { expect, test, type Page } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.17" } });

const noSideScroll = async (p: Page) => expect(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
const pillsTall = async (p: Page) => {
  const heights = await p.getByRole("radio").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  expect(heights.length).toBeGreaterThan(0);
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(38);
};

test("rate items: reasons and questions, Saved, the three layouts at 375 px", async ({ page, request, browser }) => {
  test.setTimeout(150_000);
  const stamp = Date.now();
  const email = `e2e-rate-${stamp}@marlow.example`;
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
  await expect(page.getByRole("heading", { name: "Build the validation" })).toBeVisible();
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  const url = await page.getByTestId("share-link").inputValue();

  const phone = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const link = await phone.newPage();
  await link.goto(url);
  await link.locator("[data-ready]").waitFor();
  await link.getByLabel("Name").fill("Ana Pop");
  await link.getByLabel("Role").fill("Finance lead");
  await link.getByTestId("about-you-start").click();
  await expect(link.getByTestId("chapter-screen")).toHaveAttribute("data-layout", "chapters");
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  await noSideScroll(link); await pillsTall(link);

  // Change with a reason: the box asks, the note stays empty until the reason is written, then
  // says Saved.
  const receipts = link.getByTestId("item-card").filter({ hasText: "Receipts captured by phone" });
  await expect(receipts.getByTestId("item-card-note")).toHaveText("Not rated yet");
  await receipts.getByRole("radio", { name: "Should" }).click();
  await expect(receipts.getByText("Could you tell us why you think the priority should be different?")).toBeVisible();
  await expect(receipts.getByTestId("item-card-note")).toHaveText("");
  await expect(receipts).toHaveAttribute("data-note", "sayWhy");
  // A change made while the card's save is in flight goes out after that save returns: the
  // first request is held 1.5 s on its way (page.route: playwright.dev/docs/api/class-page#page-route),
  // the newer text waits for it, and the reload below finds the newer text on the server.
  let held = 0;
  await link.route("**/answers", async (route) => { held += 1; if (held === 1) await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
  const first = link.waitForRequest((r) => r.url().endsWith("/answers") && r.method() === "PUT");
  await receipts.getByTestId("card-reason").fill("First draft.");
  await first;
  await receipts.getByTestId("card-reason").fill("Most receipts arrive by email.");
  await expect(receipts.getByTestId("item-card-note")).toHaveText("Saved");
  expect(held).toBe(2);
  await link.unroute("**/answers");
  const accent = await receipts.getByRole("radio", { name: "Should" }).evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(accent).toBe("rgb(109, 76, 245)");
  // The typed reason stays when the answer changes and comes back.
  await receipts.getByRole("radio", { name: "Not needed" }).click();
  await expect(receipts.getByText("Why is it not needed, or what should it say instead?")).toBeVisible();
  await expect(receipts.getByTestId("card-reason")).toHaveValue("Most receipts arrive by email.");
  await receipts.getByRole("radio", { name: "Should" }).click();
  await expect(receipts.getByTestId("card-reason")).toHaveValue("Most receipts arrive by email.");
  await expect(receipts.getByTestId("item-card-note")).toHaveText("Saved");

  // Unclear without a question.
  const split = link.getByTestId("item-card").filter({ hasText: "Split a receipt across projects" });
  const splitSaved = link.waitForResponse((r) => r.url().endsWith("/answers") && r.request().method() === "PUT" && (r.request().postData() ?? "").includes('"picked":"unclear"'));
  await split.getByRole("radio", { name: "Unclear" }).click();
  await expect(split.getByText("What would you need to know to rate it?")).toBeVisible();
  await expect(split.getByTestId("item-card-note")).toHaveText("");
  await expect(split).toHaveAttribute("data-note", "writeQuestion");
  expect((await splitSaved).status()).toBe(200);

  // A reload shows what the server has (the page sends a change 400 ms after it is made;
  // the test waits for the server's answer before reloading).
  await link.reload();
  await link.locator("[data-ready]").waitFor();
  await expect(receipts.getByTestId("item-card-note")).toHaveText("Saved");
  await expect(receipts.getByTestId("card-reason")).toHaveValue("Most receipts arrive by email.");
  await expect(split).toHaveAttribute("data-note", "writeQuestion");

  // One item per screen.
  const layout = async (name: string) => {
    await page.goto(`${projectUrl}/build`);
    await page.getByText(name, { exact: true }).click();
    await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  };
  await layout("One item per screen");
  await link.reload();
  await link.locator("[data-ready]").waitFor();
  await expect(link.getByTestId("chapter-screen")).toHaveAttribute("data-layout", "item");
  await expect(link.getByTestId("layout-note")).toHaveText("Item 1 of 2 in Submitting");
  await expect(link.getByTestId("item-card")).toHaveCount(1);
  await noSideScroll(link); await pillsTall(link);
  await link.getByTestId("next-item").click();
  await expect(link.getByTestId("layout-note")).toHaveText("Item 2 of 2 in Submitting");
  await expect(link.getByTestId("next-item")).toBeDisabled();

  // The single page.
  await layout("Single long page");
  await link.goto(url);
  await link.locator("[data-ready]").waitFor();
  await expect(link.getByTestId("chapter-screen")).toHaveAttribute("data-layout", "page");
  await expect(link.getByTestId("layout-note")).toHaveText("All 3 on one page");
  await expect(link.getByTestId("item-card")).toHaveCount(3);
  await expect(link.getByTestId("chapter-title")).toHaveCount(0);
  await expect(link.getByRole("heading", { name: "Approving" })).toBeVisible();
  await noSideScroll(link); await pillsTall(link);
  await phone.close();
});
