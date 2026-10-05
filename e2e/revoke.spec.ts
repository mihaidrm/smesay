// The main path of E6-4: sign in, create a project, paste a list, build, publish, send one
// personal invite; open the public link in a respondent tab (About you); revoke it in the
// PM app and see the card read Revoked; the respondent tab turns into the inactive page
// within 60 seconds without a reload (the poll); Publish again makes a new link that
// opens; revoke the personal row, see Revoked, press New link and read the new email. The
// preview on Share shows the withdrawn page once the link is revoked (E5-6).
import { expect, test } from "@playwright/test";
import { latestInvite, latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.15" } });

test("revoke the public link, see the inactive page within a minute, publish again, renew a personal link", async ({ page, request, browser }) => {
  test.setTimeout(150_000);
  const stamp = Date.now();
  const email = `e2e-revoke-${stamp}@marlow.example`;
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
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Approval from the notification email | Approving | Must"].join("\n"));
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
  const ana = `ana-${stamp}@marlow.example`;
  await page.getByLabel("People, one per line").fill(`${ana}, Ana Pop`);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("invites-form").getByRole("status")).toHaveText("1 invite sent.");
  const firstInvite = await latestInvite(request, ana);
  // The PM page never carries the personal token (SECURITY.md).
  const anaToken = firstInvite.link.split("/r/")[1];
  expect(anaToken).toMatch(/^[0-9a-f]{32}$/);
  expect(await page.content()).not.toContain(anaToken);

  // The respondent tab on the public link, then the revoke in the PM app.
  const respondent = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const link = await respondent.newPage();
  await link.goto(url);
  await expect(link.getByTestId("about-you")).toBeVisible();
  const revokedAt = Date.now();
  await page.getByRole("button", { name: "Revoke link" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Revoked");
  await expect(page.getByTestId("link-note")).toHaveText("The link now shows a page saying it was withdrawn. Answers already given are kept.");
  await expect(page.getByTestId("share-link")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Publish again" })).toBeVisible();
  // The preview on Share shows the withdrawn page too (stories/E5-6, acceptance 2).
  await expect(page.frameLocator("[data-testid=preview-iframe]").getByRole("heading", { name: "Link inactive." })).toBeVisible();
  // The state check answers 410 at once; the open tab follows within the poll's minute.
  const state = await request.get(`${url}/state`);
  expect(state.status()).toBe(410);
  expect(await state.json()).toEqual({ state: "revoked" });
  await expect(link.getByRole("heading", { name: "Link inactive." })).toBeVisible({ timeout: 70_000 });
  expect(Date.now() - revokedAt).toBeLessThan(70_000);
  await expect(link.getByText("The project team at Marlow Group withdrew this link.")).toBeVisible();
  // The project list still reads Open: the personal link is open (design note 49).
  await page.goto("/app");
  await expect(page.getByTestId("project-row").filter({ hasText: "Expense tool" }).getByTestId("project-status")).toHaveText("Open");

  // Publish again: a new link that opens; the old one stays inactive.
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-02-20T18:00");
  await page.getByRole("button", { name: "Publish again" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  const url2 = await page.getByTestId("share-link").inputValue();
  expect(url2).not.toBe(url);
  await link.goto(url2);
  await expect(link.getByTestId("about-you")).toBeVisible();
  await link.goto(url);
  await expect(link.getByRole("heading", { name: "Link inactive." })).toBeVisible();

  // The personal row: Revoke, then New link with a new email.
  const row = page.getByTestId("invite-row").first();
  await row.getByRole("button", { name: "Revoke" }).click();
  await expect(row).toHaveAttribute("data-status", "revoked");
  await expect(row).toContainText("Revoked");
  await link.goto(firstInvite.link);
  await expect(link.getByRole("heading", { name: "Link inactive." })).toBeVisible();
  await row.getByRole("button", { name: "New link" }).click();
  await expect(row).toHaveAttribute("data-status", "invited");
  await expect.poll(async () => (await latestInvite(request, ana)).link, { timeout: 15_000 }).not.toBe(firstInvite.link);
  const second = await latestInvite(request, ana);
  expect(second.subject).toContain("asks for your view on Expense tool");
  await link.goto(second.link);
  await expect(link.getByTestId("answering-as")).toContainText("Answering as Ana Pop.");
  await link.goto(firstInvite.link);
  await expect(link.getByRole("heading", { name: "This link does not match any project." })).toBeVisible();
  await respondent.close();
});
