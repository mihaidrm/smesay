// The main path of E5-7 (acceptance 9): sign in, create a project, paste a list, open Build;
// Anonymous is refused while the default Name and Role are text fields, naming both; remove
// Name, make Role a dropdown, save, pick Anonymous and save; publish on Share, where the
// personal invites card says the validation uses the public link only; open the link on four
// phones, see the About you line, pick a role (Sales three times, Finance once), start and
// answer one item; then Results' Responses tab lists "Anonymous 1" to "Anonymous 4" with no
// field column and no submitted time, offers Sales (3 people) and not Finance (1) as a filter,
// and a Sales filter leaves the tab whole with the line saying why (amended 2026-10-06).
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.82" } });

test("set Anonymous on Build, answer through the public link, see Anonymous 1 on Results", async ({ page, request, browser }) => {
  test.setTimeout(180_000);
  const email = `e2e-anonymous-${Date.now()}@marlow.example`;
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

  // Build: the card, Named by default; Anonymous refused while Name and Role are text.
  await page.goto(`${projectUrl}/build`);
  await expect(page.getByRole("heading", { name: "Build the validation" })).toBeVisible();
  const card = page.getByTestId("anonymity-card");
  await expect(card.getByRole("heading", { name: "Who sees whose answers" })).toBeVisible();
  await expect(card.getByRole("radio", { name: /^Named/ })).toBeChecked();
  const levelForm = page.getByTestId("anonymity-form");
  await card.getByTestId("anonymity-anonymous").click();
  await levelForm.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("anonymity-error")).toHaveText("Anonymous needs dropdown fields only. Remove Name and Role or make them dropdowns on the Respondent fields card, then pick Anonymous again.");

  // Remove Name, make Role a dropdown with two options, save the fields.
  const fieldsForm = page.getByTestId("fields-form");
  await fieldsForm.getByRole("button", { name: "Remove Name" }).click();
  await fieldsForm.getByLabel("Type, Role").selectOption("dropdown");
  await fieldsForm.getByLabel("Options, one per line, Role").fill("Sales\nFinance");
  await fieldsForm.getByRole("button", { name: "Save" }).click();
  await expect(fieldsForm.getByRole("status")).toHaveText("Saved.");

  // Anonymous now saves.
  await card.getByTestId("anonymity-anonymous").click();
  await levelForm.getByRole("button", { name: "Save" }).click();
  await expect(levelForm.getByRole("status")).toHaveText("Saved.");
  await page.reload();
  await expect(page.getByTestId("anonymity-card").getByRole("radio", { name: /^Anonymous/ })).toBeChecked();

  // Share: publish; no personal invites form, the line in its place.
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await expect(page.getByTestId("invites-anonymous")).toHaveText("Anonymous validations use the public link only.");
  await expect(page.getByTestId("invites-card").getByRole("button", { name: "Send" })).toHaveCount(0);
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  const url = await page.getByTestId("share-link").inputValue();

  // Four phones (a new context each, so a new device): the About you line above the fields,
  // Role only, Start, one answer.
  for (const role of ["Sales", "Sales", "Sales", "Finance"]) {
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const link = await phone.newPage();
    await link.goto(url);
    await link.locator("[data-ready]").waitFor();
    await expect(link.getByTestId("about-you-anonymity")).toHaveText("Your answers are anonymous. No name or email is asked, and the team sees your answers without a name.");
    await expect(link.getByLabel("Name")).toHaveCount(0);
    await link.getByLabel("Role").selectOption(role);
    await link.getByTestId("about-you-start").click();
    await expect(link.getByTestId("chapter-screen")).toBeVisible();
    const receipts = link.getByTestId("item-card").filter({ hasText: "Receipts captured by phone" });
    await receipts.getByRole("radio", { name: "Must" }).click();
    await expect(receipts.getByTestId("item-card-note")).toHaveText("Saved");
    await phone.close();
  }

  // Results, Responses: Anonymous 1 to 4, no field column, no submitted time.
  await page.goto(`${projectUrl}/results?tab=responses`);
  await page.locator("[data-testid=filter-bar][data-ready]").waitFor();
  const rows = page.getByTestId("response-row");
  await expect(rows).toHaveCount(4);
  await expect(rows.first().getByRole("rowheader")).toHaveText("Anonymous 1");
  await expect(page.getByTestId("sort-name")).toContainText("Respondent");
  await expect(page.getByTestId("sort-field.role")).toHaveCount(0);
  await expect(page.getByTestId("sort-submitted")).toHaveCount(0);
  await expect(page.getByTestId("submitted-cell")).toHaveCount(0);
  // Finance (one respondent) is under 3: only Sales is offered as a filter, and the bar says why.
  await expect(page.getByTestId("filter-role")).toHaveCount(1);
  await expect(page.getByTestId("filter-role")).toHaveText("Sales");
  await expect(page.getByTestId("filter-small-values")).toBeVisible();
  await expect(page.getByTestId("person-level-line")).toHaveCount(0);
  // A field filter changes the charts only: the tab still lists all four, and says why.
  await page.getByTestId("filter-role").click();
  await expect(page).toHaveURL(/f\.role=Sales/);
  await expect(page.getByTestId("person-level-line")).toHaveText("Filters by a field or perspective change the charts only, and lists of people stay whole. Comparing a group's figures with the lists can still point to someone in a small group.");
  await expect(rows).toHaveCount(4);
  // Decision 0058 (N1): a filter that keeps fewer than 3 people says so in place of "Showing 0 of 4".
  await page.getByTestId("filter-kind-unclear").click();
  await expect(page).toHaveURL(/kind=unclear/);
  await expect(page.getByTestId("too-few")).toHaveText("Fewer than 3 people match these filters. Widen them to see the results.");
  await expect(page.getByTestId("showing-line")).toHaveCount(0);
});
