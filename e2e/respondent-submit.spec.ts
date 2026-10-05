// The main path of E7-5: a PM publishes a two-item list and invites Ana. Ana opens her
// personal link on a phone, answers both items, reaches the Wrap up (the tally, Submit off
// until confidence and the sign-off), adds a missing item, submits, and sees "Thank you,
// Ana." with the time in UTC; the receipt reaches her inbox after the reply. The Wrap up's
// answers survive a reload before Submit; Back from Done shows them with the sign-off to tick
// again. "Change my answers" reopens the
// Wrap up with the sign-off cleared; she changes one answer, submits again and sees the new
// time. The PM's invite row reads Submitted. (The PM tracker of the story is E8-2, not built;
// the invite row is the PM's view today, docs/review-list.md.)
import { expect, test } from "@playwright/test";
import { latestInvite, latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.20" } });

test("wrap up, submit, done, change, submit again", async ({ page, request, browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const email = `e2e-submit-${stamp}@marlow.example`;
  const ana = `ana-submit-${stamp}@marlow.example`;
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
  await page.getByLabel("People, one per line").fill(`${ana}, Ana Pop, Finance`);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("invites-form").getByRole("status")).toHaveText("1 invite sent.");
  const invite = await latestInvite(request, ana);

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const link = await phone.newPage();
  await link.goto(invite.link);
  // Start is a button the page handles once it has hydrated (data-ready).
  await link.locator("[data-ready]").waitFor();
  await link.getByTestId("about-you-start").click();
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  await link.getByTestId("item-card").getByRole("radio", { name: "Must" }).click();
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await link.getByTestId("chapter-continue").click();
  await expect(link.getByTestId("chapter-title")).toHaveText("Paying");
  await link.getByTestId("item-card").getByRole("radio", { name: "Should" }).click();
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await link.getByTestId("chapter-continue").click();

  // The Wrap up: the tally, Submit off until confidence and the sign-off.
  await expect(link).toHaveURL(/\?at=wrap$/);
  await expect(link.locator('[data-tile="agreed"]')).toContainText("2");
  await expect(link.getByTestId("wrap-up-submit")).toBeDisabled();
  await expect(link.getByTestId("wrap-up-note")).toHaveText("Still needed: how confident you are, the confirmation.");
  // The Wrap up's answers save to the server as they are written, within a second.
  const wrapSaved = link.waitForResponse((r) => r.url().endsWith("/wrap") && r.request().method() === "PUT" && r.ok());
  await link.getByLabel("What is missing?").fill("Mileage from a start and end address");
  await link.getByLabel("Where does it belong?").selectOption("Submitting");
  await wrapSaved;
  // They survive a reload before Submit.
  await link.reload();
  await link.locator("[data-ready]").waitFor();
  await expect(link.getByLabel("What is missing?")).toHaveValue("Mileage from a start and end address");
  await expect(link.getByLabel("Where does it belong?")).toHaveValue("Submitting");
  await link.getByTestId("wrap-up-confidence").getByRole("radio", { name: "4" }).click();
  await link.getByTestId("wrap-up-signoff").click();
  await expect(link.getByTestId("wrap-up-note")).toHaveText("Everything is in. Submit when you are ready.");
  await link.getByTestId("wrap-up-submit").click();
  await expect(link.getByTestId("done-thanks")).toHaveText("Thank you, Ana.");
  await expect(link.getByTestId("done-when")).toHaveText(/^Submitted \d{1,2} \w{3} \d{4}, \d{2}:\d{2} UTC$/);
  const firstWhen = await link.getByTestId("done-when").innerText();
  // The receipt goes after the reply: wait for it to replace the invitation as the newest.
  await expect.poll(async () => (await latestInvite(request, ana)).subject, { timeout: 15_000 }).toBe("Your answers on Expense tool were submitted");
  expect((await latestInvite(request, ana)).text).toContain("You answered 2 items.");
  // Back from Done shows the Wrap up with the sign-off to tick again, the rest as submitted.
  await link.goBack();
  await expect(link.getByTestId("wrap-up-signoff").locator("input")).not.toBeChecked();
  await expect(link.getByLabel("What is missing?")).toHaveValue("Mileage from a start and end address");
  await link.goForward();
  await expect(link.getByTestId("done-thanks")).toHaveText("Thank you, Ana.");

  // Change one answer and submit again.
  await link.waitForTimeout(61_000 - (Date.now() % 60_000));
  await link.getByTestId("done-change").click();
  await expect(link.getByTestId("wrap-up-signoff").locator("input")).not.toBeChecked();
  await link.getByTestId("row-chapter-2").click();
  await link.getByTestId("item-card").getByRole("radio", { name: "Could" }).click();
  await link.getByTestId("card-reason").fill("Payroll runs only once a month.");
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await link.getByTestId("row-wrap").click();
  await expect(link.getByTestId("wrap-up-section-lower")).toContainText("Paid with the next salary run");
  await link.getByTestId("wrap-up-signoff").click();
  await link.getByTestId("wrap-up-submit").click();
  await expect(link.getByTestId("done-thanks")).toHaveText("Thank you, Ana.");
  await expect(link.getByTestId("done-when")).not.toHaveText(firstWhen);
  await phone.close();

  // The PM's invite row.
  await page.reload();
  await expect(page.getByTestId("invite-row")).toHaveAttribute("data-status", "submitted");
});
