// The main path of E9-1: a PM publishes a two-item list, a respondent on a phone rates the
// first item lower with a reason, agrees with the second, suggests a missing item and
// submits; on Results, Actions, Write actions (the fake transport, e2e/fake-anthropic.mjs,
// answers with four actions and a fifth citing a ref never sent) shows four actions, each
// with its kind and its citation, the answer's linking to the item detail; Write again
// replaces them. E9-2: Dismiss, Mark done (the date), Reopen, and Write again leaves the
// dismissed one out. E9-3: the cost line. The sample's Actions tab shows its four seeded actions, no controls.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.50" } });

test("write actions from the answers, each citing the answers behind it", async ({ page, request, browser }) => {
  test.setTimeout(120_000);
  const email = `e2e-actions-${Date.now()}@marlow.example`;
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
  const sampleHref = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  const sample = `/app/projects/${sampleHref!.match(/projects\/([0-9a-f-]{36})/)![1]}`;
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectUrl = page.url().replace(/\/import$/, "");
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Paid with the next salary run | Paying | Should"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 2 items" }).click();
  await expect(page.getByTestId("imported-line")).toBeVisible();
  await page.goto(`${projectUrl}/build`);
  await expect(page.getByRole("heading", { name: "Build the instrument" })).toBeVisible();
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  const url = await page.getByTestId("share-link").inputValue();

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
  await expect(link.getByTestId("chapter-title")).toHaveText("Paying");
  await link.getByTestId("item-card").getByRole("radio", { name: "Should" }).click();
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await link.getByTestId("chapter-continue").click();
  await expect(link).toHaveURL(/\?at=wrap$/);
  const wrapSaved = link.waitForResponse((r) => r.url().endsWith("/wrap") && r.request().method() === "PUT" && r.ok());
  await link.getByLabel("What is missing").fill("Mileage from a start and end address");
  await wrapSaved;
  await link.getByTestId("wrap-up-confidence").getByRole("radio", { name: "4" }).click();
  await link.getByTestId("wrap-up-signoff").click();
  await link.getByTestId("wrap-up-submit").click();
  await expect(link.getByTestId("done-thanks")).toBeVisible();
  await phone.close();

  await page.goto(`${projectUrl}/results?tab=actions`);
  await expect(page.getByTestId("actions-empty")).toBeVisible();
  await page.getByTestId("write-actions").click();
  const actions = page.getByTestId("action");
  await expect(actions).toHaveCount(4);
  await expect(page.getByTestId("tab-actions")).toHaveText("Actions (4)");
  await expect(actions.getByTestId("action-kind")).toHaveText(["Rewrite", "Groups disagree", "Follow up", "Coverage"]);
  await expect(actions.first().getByTestId("action-title")).toHaveText("Rewrite the first item so its scope is clear.");
  await expect(actions.first().getByTestId("action-citation")).toHaveText('Ana Pop on "Receipts captured by phone"');
  await expect(actions.nth(3).getByTestId("action-citation")).toHaveText("Ana Pop, missing item");
  await expect(page.getByText("An action citing an answer that was never sent.")).toHaveCount(0);
  // E9-3: the cost of the run (the fake transport reports 1,000 tokens in and 500 out).
  await expect(page.getByTestId("actions-cost")).toHaveText(/^Last run \d{1,2} \w{3} \d{4}, \d{2}:\d{2} UTC: 1,500 tokens, EUR 0\.01\. This workspace this month: EUR 0\.01\.$/);
  // The citation opens the item's detail (E8-5).
  await actions.first().getByRole("link", { name: 'Ana Pop on "Receipts captured by phone"' }).click();
  await expect(page.getByTestId("detail-title")).toHaveText("Receipts captured by phone");
  await page.getByTestId("detail-close").click();
  // Write again replaces the open actions.
  await page.getByTestId("write-actions").click();
  await expect(page.getByTestId("write-actions")).toHaveText("Write again");
  await expect(actions).toHaveCount(4);

  // E9-2: Dismiss the rewrite, mark the conflict done; the tab counts the open ones; the done
  // one shows with its date and Reopen; Write again does not bring the dismissed one back.
  const open = page.getByTestId("actions-list").getByTestId("action");
  await open.filter({ hasText: "Rewrite the first item" }).getByTestId("action-dismiss").click();
  await expect(page.getByTestId("actions-dismissed").getByTestId("action")).toHaveCount(1);
  await open.filter({ hasText: "Settle the priority" }).getByTestId("action-done").click();
  const done = page.getByTestId("actions-done").getByTestId("action");
  await expect(done).toHaveCount(1);
  await expect(done.getByTestId("action-closed")).toHaveText(/^Done \d{1,2} \w{3} \d{4}, \d{2}:\d{2} UTC$/);
  await expect(page.getByTestId("tab-actions")).toHaveText("Actions (2)");
  await expect(page.getByTestId("action").filter({ hasText: "Rewrite the first item" }).getByTestId("action-done")).toHaveCount(0);
  await done.getByTestId("action-reopen").click();
  await expect(page.getByTestId("actions-done")).toHaveCount(0);
  await expect(page.getByTestId("tab-actions")).toHaveText("Actions (3)");
  await page.getByTestId("write-actions").click();
  await expect(open).toHaveCount(3);
  await expect(open.filter({ hasText: "Rewrite the first item" })).toHaveCount(0);
  await expect(page.getByTestId("actions-dismissed").getByTestId("action")).toHaveCount(1);

  // E9-3, acceptance 4: Settings' usage line counts the same month as the tab's line.
  // Read after a fresh load, so the line counts every run above.
  await page.goto(`${projectUrl}/results?tab=actions`);
  const month = (await page.getByTestId("actions-cost").textContent())!.match(/This workspace this month: (EUR \d+\.\d{2})\./)![1];
  await page.goto("/app/settings");
  await expect(page.getByTestId("usage-line")).toContainText(`${month} on AI this month.`);

  // The sample: its four seeded actions, read-only.
  await page.goto(`${sample}/results?tab=actions`);
  await expect(page.getByTestId("action")).toHaveCount(4);
  await expect(page.getByTestId("actions-sample")).toBeVisible();
  await expect(page.getByTestId("write-actions")).toHaveCount(0);
  await expect(page.getByTestId("action-done")).toHaveCount(0);
  await expect(page.getByTestId("actions-cost")).toHaveCount(0);
  await expect(page.getByTestId("action").nth(3).getByTestId("action-citation")).toHaveText("Dana Okafor, missing item");
});
