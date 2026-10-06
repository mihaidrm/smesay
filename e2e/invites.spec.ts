// The main path of E6-2: sign in, create a project, paste a list, build, publish the public
// link, paste two people in Personal invites (one with a name and a role), Send, see both
// rows Invited; read both emails in Mailpit (sender "[PM] via SMEsay", subject, the link);
// open one link in a fresh context and see About you answering as that person with the name
// and role not asked; a repeat is refused; a bad address is refused.
import { expect, test } from "@playwright/test";
import { latestInvite, latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.13" } });

test("send two personal invites, read the emails, open one link", async ({ page, request, browser }) => {
  test.setTimeout(90_000);
  const stamp = Date.now();
  const email = `e2e-invites-${stamp}@marlow.example`;
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
  await expect(page.getByRole("heading", { name: "Build the validation" })).toBeVisible();
  await page.goto(`${projectUrl}/share`);

  // Before the public link: the box is off and says why; nobody invited yet.
  await expect(page.getByTestId("invites-card")).toBeVisible();
  await expect(page.getByLabel("People, one per line")).toBeDisabled();
  await expect(page.getByTestId("invites-card")).toContainText("Publish the public link first.");
  await expect(page.getByTestId("invites-empty")).toHaveText("Nobody invited yet.");
  // The form fills its fields after it mounts (share-form.tsx): wait for the zone line.
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");

  // A bad address is refused; then two people are sent.
  const ana = `ana-${stamp}@marlow.example`;
  const bo = `bo-${stamp}@marlow.example`;
  const box = page.getByLabel("People, one per line");
  await box.fill("not an address");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("invites-form").getByRole("alert")).toHaveText("not an address is not an email address. Check it and try again.");
  await box.fill(`${ana}, Ana Pop, Finance\n${bo}`);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("invites-form").getByRole("status")).toHaveText("2 invites sent.");
  await expect(box).toHaveValue("");
  const rows = page.getByTestId("invite-row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Ana Pop");
  await expect(rows.nth(0)).toContainText(`${ana}, Finance`);
  await expect(rows.nth(0)).toHaveAttribute("data-status", "invited");
  await expect(rows.nth(0)).toContainText("None sent");
  await expect(rows.nth(1)).toContainText(bo);
  await expect(rows.nth(1)).toHaveAttribute("data-status", "invited");

  // The emails in Mailpit: the sender, the subject, the count and minutes, the link.
  const anaMail = await latestInvite(request, ana);
  const boMail = await latestInvite(request, bo);
  expect(anaMail.subject).toBe(`${email} asks for your view on Expense tool`);
  expect(anaMail.from).toContain(`${email} via SMEsay`);
  expect(anaMail.text).toContain("Hi Ana Pop,");
  expect(anaMail.text).toContain("a list of 2 requirements for Expense tool");
  expect(anaMail.text).toContain("It takes about 5 minutes.");
  expect(anaMail.text).toContain("It closes on 20 Jan 2027");
  expect(boMail.text).toContain("Hi,");
  expect(anaMail.link).not.toBe(boMail.link);

  // A repeat is refused whole.
  await box.fill(`${ana}\ncy-${stamp}@marlow.example`);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("invites-form").getByRole("alert")).toHaveText(`${ana} already has a personal link. Press Remind to send it again.`);
  await expect(rows).toHaveCount(2);

  // Ana's link in a fresh context: About you, answering as Ana Pop, Finance; Name and Role
  // not asked; Start enabled since nothing mandatory is missing.
  const respondent = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const link = await respondent.newPage();
  await link.goto(anaMail.link);
  await expect(link.getByTestId("about-you")).toBeVisible();
  await expect(link.getByTestId("answering-as")).toContainText("Answering as Ana Pop, Finance.");
  await expect(link.getByLabel("Name")).toHaveCount(0);
  await expect(link.getByLabel("Role")).toHaveCount(0);
  await expect(link.getByTestId("about-you-start")).toBeEnabled();
  await expect(link.getByTestId("about-you-note")).toContainText("Closes 20 Jan 2027");
  // Bo's link asks for the name and the role.
  await link.goto(boMail.link);
  await expect(link.getByLabel("Name")).toBeVisible();
  await expect(link.getByTestId("about-you-start")).toBeDisabled();
  await respondent.close();
});
