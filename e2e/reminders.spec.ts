// The main path of E6-3: sign in, create a project, paste a list, build, publish, send one
// personal invite, press Remind on its row, see "1 reminder sent.", the row's "1 sent,
// last ..." and the too-soon line in place of the button; read email 3 in Mailpit (the
// subject, the "not started" branch, Carry on); "Remind everyone" then says nobody is due.
import { expect, test } from "@playwright/test";
import { latestInvite, latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.14" } });

test("remind one invitee, read email 3, see the three-day rule", async ({ page, request }) => {
  test.setTimeout(90_000);
  const stamp = Date.now();
  const email = `e2e-remind-${stamp}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
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
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  const ana = `ana-${stamp}@marlow.example`;
  await page.getByLabel("People, one per line").fill(`${ana}, Ana Pop, Finance`);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("invites-form").getByRole("status")).toHaveText("1 invite sent.");
  const invite = await latestInvite(request, ana);
  expect(invite.subject).toContain("asks for your view on Expense tool");

  // Remind on the row: the count, the row's reminders cell, the rule in place of the button.
  const row = page.getByTestId("invite-row").first();
  await expect(row.getByTestId("reminders-cell")).toHaveText("None sent");
  await row.getByRole("button", { name: "Remind" }).click();
  await expect(page.getByTestId("remind-form").getByRole("status")).toHaveText("1 reminder sent.");
  await expect(row.getByTestId("reminders-cell")).toContainText("1 sent, last");
  await expect(row.getByTestId("remind-too-soon")).toContainText("Reminded 0 days ago. The next reminder can go on");
  await expect(row.getByRole("button", { name: "Remind" })).toHaveCount(0);
  // Email 3 in Mailpit: the newest message to Ana.
  await expect.poll(async () => (await latestInvite(request, ana)).subject, { timeout: 15_000 }).toBe("Reminder: Expense tool closes on 20 Jan 2027");
  const reminder = await latestInvite(request, ana);
  expect(reminder.from).toContain(`${email} via SMEsay`);
  expect(reminder.text).toContain("Hi Ana Pop,");
  expect(reminder.text).toContain("is still waiting for your answers on Expense tool.");
  expect(reminder.text).toContain("You have not started yet.");
  expect(reminder.text).toContain("will stop reminding you.");
  expect(reminder.link).toBe(invite.link);
  // Remind everyone: nobody is due now.
  await expect(page.getByTestId("remind-all-form").getByRole("button")).toBeDisabled();
  await expect(page.getByTestId("remind-all-form")).toContainText("Nobody is due a reminder.");
});
