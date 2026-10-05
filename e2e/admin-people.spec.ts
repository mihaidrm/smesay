// The admin People pages' main path (stories/E14-3, acceptance 5): a PM has an account; an admin
// finds them by email, sends them a sign-in link through the confirm line, and the link arrives
// in Mailpit and signs the PM in. playwright.config.ts lists e2e-admin-people@marlow.example in
// ADMIN_EMAILS.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// One rate-limit bucket per spec file (e2e/workspace.spec.ts says why).
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.78" } });

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

test("an admin finds a person and sends them a sign-in link", async ({ browser, page, request }) => {
  const stamp = Date.now();
  const pmEmail = `e2e-plover-${stamp}@marlow.example`;
  const signIn = async (p: typeof page, email: string) => {
    await p.goto("/sign-in");
    await p.getByLabel("Email").fill(email);
    await p.getByRole("button", { name: "Send me a link" }).click();
    await expect(p.getByRole("status")).toBeVisible();
    await p.goto(await latestLink(request, email));
  };
  const count = async (to: string) => (await (await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent("to:" + to)}`)).json()).messages_count as number;

  // The PM's account: one sign-in, then out.
  const pm = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.78" } });
  const pmPage = await pm.newPage();
  await signIn(pmPage, pmEmail);
  await expect(pmPage).toHaveURL(/\/app\/new$/);
  await pm.close();
  const before = await count(pmEmail);

  await signIn(page, "e2e-admin-people@marlow.example");
  await expect(page).toHaveURL(/\/app(\/new|\/quickstart)?$/);
  await page.waitForLoadState("networkidle");
  await page.goto("/admin/people");
  await page.getByLabel("Email or name").fill(`plover-${stamp}`);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByTestId("person-row")).toHaveCount(1);
  await expect(page.getByTestId("person-row")).toContainText("Sign-in link");
  await page.getByRole("link", { name: pmEmail }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(pmEmail);
  await expect(page.getByTestId("admin-session")).toHaveCount(1);
  const send = page.getByTestId("send-link-form");
  await send.getByRole("button", { name: "Send a sign-in link" }).click();
  await expect(send.getByTestId("confirm-line")).toContainText(`Send a sign-in link to ${pmEmail}?`);
  await send.getByRole("button", { name: "Confirm" }).click();
  await expect(send.getByRole("status")).toHaveText(`Sign-in link sent to ${pmEmail}.`);
  await expect.poll(() => count(pmEmail), { timeout: 15_000 }).toBe(before + 1);

  // The link works: a fresh browser signs in as the PM.
  const again = await browser.newContext();
  const againPage = await again.newPage();
  await againPage.goto(await latestLink(request, pmEmail));
  await expect(againPage).toHaveURL(/\/app\/new$/);
  await again.close();

  await page.getByRole("navigation", { name: "Admin pages" }).getByRole("link", { name: "Audit log" }).click();
  const row = page.getByTestId("audit-row").filter({ hasText: pmEmail });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Sent a sign-in link");
  await expect(row.getByTestId("audit-outcome")).toHaveText("Done");
});
