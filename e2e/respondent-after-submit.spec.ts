// The main path of E7-6: Ana submits on her personal link, opens it again and sees "Welcome
// back, Ana. You submitted on [DATE]. You can change your answers until [CLOSE DATE]." with
// the summary line; Change my answers reopens the Wrap up with the sign-off cleared; she
// submits again and the time is the new one.
import { expect, test } from "@playwright/test";
import { latestInvite, latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.21" } });

// The page's time format (src/lib/sharing-format.ts formatUtc): "6 Oct 2026, 09:00 UTC".
const UTC = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const minutesBetween = (from: number, to: number) => {
  const out: string[] = [];
  for (let t = from - (from % 60_000); t <= to; t += 60_000) out.push(`Submitted ${UTC.format(new Date(t))} UTC`);
  return out;
};

test("submit, reopen, welcome back, change, submit again", async ({ page, request, browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const email = `e2e-after-${stamp}@marlow.example`;
  const ana = `ana-after-${stamp}@marlow.example`;
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
  await expect(page.getByRole("heading", { name: "Build the validation" })).toBeVisible();
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
  await link.getByTestId("item-card").getByRole("radio", { name: "Must" }).click();
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await link.getByTestId("chapter-continue").click();
  await link.getByTestId("item-card").getByRole("radio", { name: "Should" }).click();
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await link.getByTestId("chapter-continue").click();
  await link.getByTestId("wrap-up-confidence").getByRole("radio", { name: "5" }).click();
  await link.getByTestId("wrap-up-signoff").click();
  await link.getByTestId("wrap-up-submit").click();
  await expect(link.getByTestId("done-summary")).toHaveText("2 agreed, 0 changed, 0 not needed, 0 unclear, 0 items added");
  const firstWhen = (await link.getByTestId("done-when").innerText()).replace(/^Submitted /, "");

  // Opened again: welcome back, the dates, the summary.
  const again = await phone.newPage();
  await again.goto(invite.link);
  await again.locator("[data-ready]").waitFor();
  await expect(again.getByTestId("done-thanks")).toHaveText("Welcome back, Ana.");
  await expect(again.getByTestId("done-when")).toHaveText(new RegExp(`^You submitted on ${firstWhen}\\. You can change your answers until 20 Jan 2027, \\d{2}:\\d{2} UTC\\.$`));
  await expect(again.getByTestId("done-summary")).toHaveText("2 agreed, 0 changed, 0 not needed, 0 unclear, 0 items added");

  // Change and submit again, a minute later so the time differs.
  await again.waitForTimeout(61_000 - (Date.now() % 60_000));
  await again.getByTestId("done-change").click();
  await expect(again.getByTestId("wrap-up-signoff").locator("input")).not.toBeChecked();
  await again.getByTestId("wrap-up-confidence").getByRole("radio", { name: "4" }).click();
  // A change after Submit: the page says it must be submitted again (E7-6, acceptance 6).
  await expect(again.getByTestId("changed-since")).toHaveText("You changed answers after submitting. Submit again to send them.");
  await again.getByTestId("wrap-up-signoff").click();
  // While the Submit posts nothing moves (held 1.5 s here): Back is disabled and the
  // browser's Back keeps the Wrap up.
  await again.route("**/submit", async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
  const before = Date.now();
  await again.getByTestId("wrap-up-submit").click();
  await expect(again.getByTestId("wrap-up-back")).toBeDisabled();
  await again.goBack();
  await expect(again).toHaveURL(/\?at=wrap$/);
  await expect(again.getByTestId("done-thanks")).toHaveText("Thank you, Ana.");
  // The new time: the minute the Submit was made in (the server's clock, the same machine).
  expect(minutesBetween(before, Date.now())).toContain(await again.getByTestId("done-when").innerText());
  await expect(again.getByTestId("done-when")).not.toHaveText(`Submitted ${firstWhen}`);
  await expect(again.getByTestId("changed-since")).toHaveCount(0);
  await phone.close();
});
