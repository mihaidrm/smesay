// The main path of members (stories/E2-4, acceptance 5): the owner invites an address from
// Settings, the invitee signs in through the emailed link (Mailpit, e2e/mailpit.ts) and lands in
// the workspace, and the owner's list shows them as a member. Two browser contexts, one per
// person: playwright.dev/docs/browser-contexts.
import { expect, test, type Browser, type Page } from "@playwright/test";
import { latestLink } from "./mailpit";

// CI runs the production server, where better-auth rate-limits the magic link paths to 5 per
// minute per client address, and with no forwarded address every test shares one bucket
// (node_modules/better-auth/dist/api/rate-limiter/index.mjs; the plugin's rule in
// node_modules/better-auth/dist/plugins/magic-link/index.mjs). Each spec file therefore sends
// its own x-forwarded-for, the header better-auth reads by default, so files do not count
// against each other. E11-1 sets the real limits. extraHTTPHeaders: node_modules/playwright/
// types/test.d.ts.
const CLIENT = { "x-forwarded-for": "10.0.0.3" };
test.use({ extraHTTPHeaders: CLIENT });

// A person in their own browser context. The owner asks for a link; the invitee opens the
// link the invite email carries, so the main path of acceptance 5 is the one tested.
async function person(browser: Browser, email: string, request: boolean): Promise<Page> {
  const context = await browser.newContext({ extraHTTPHeaders: CLIENT });
  const page = await context.newPage();
  if (request) {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send me a link" }).click();
    await expect(page.getByRole("status")).toBeVisible();
  }
  await page.goto(await latestLink(await context.request, email));
  return page;
}

test("owner invites, the invitee signs in and appears as a member", async ({ browser }) => {
  const stamp = Date.now();
  const ownerEmail = `e2e-owner-${stamp}@marlow.example`;
  const inviteeEmail = `e2e-invitee-${stamp}@marlow.example`;

  const owner = await person(browser, ownerEmail, true);
  await expect(owner).toHaveURL(/\/app\/new$/);
  await owner.getByLabel("Workspace name").fill("Marlow Group");
  await owner.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  // Naming it seeds the sample project, which can take more than the default 5 seconds on CI.
  await expect(owner).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  // The page stamps quickstart_seen_at while it renders; leaving before it shows can cut that off.
  await expect(owner.getByTestId("quickstart")).toBeVisible();
  await owner.goto("/app");
  await expect(owner).toHaveURL(/\/app$/);
  await owner.getByRole("link", { name: "Settings" }).click();
  await expect(owner).toHaveURL(/\/app\/settings$/);
  await expect(owner.getByRole("heading", { level: 1 })).toHaveText("Workspace settings");
  await expect(owner.getByTestId("member-row")).toHaveCount(1);
  await expect(owner.getByTestId("member-row").first()).toContainText(ownerEmail);

  const sendInvite = owner.getByRole("button", { name: "Send invite" });
  await expect(sendInvite).toBeDisabled();
  await owner.getByLabel("Invite by email").fill(ownerEmail);
  await sendInvite.click();
  await expect(owner.locator("#invite-error")).toHaveText(`${ownerEmail} is already a member of this workspace.`);
  await owner.getByLabel("Invite by email").fill(inviteeEmail);
  await sendInvite.click();
  await expect(owner.getByRole("status")).toContainText("Invite sent.");
  await expect(owner.getByTestId("invited-row")).toHaveCount(1);
  await expect(owner.getByTestId("invited-row").first()).toContainText(inviteeEmail);

  const invitee = await person(browser, inviteeEmail, false);
  // A member's first visit to a workspace shows its quickstart once too (stories/E12-2).
  await expect(invitee).toHaveURL(/\/app\/quickstart$/);
  await expect(invitee.getByTestId("breadcrumb")).toHaveText("Marlow Group");
  await invitee.goto("/app/settings");
  await expect(invitee.getByTestId("member-row")).toHaveCount(2);
  await expect(invitee.getByRole("button", { name: "Send invite" })).toHaveCount(0);

  await owner.reload();
  await expect(owner.getByTestId("invited-row")).toHaveCount(0);
  const rows = owner.getByTestId("member-row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText(inviteeEmail);
  await expect(rows.nth(1).getByRole("combobox", { name: `Role of ${inviteeEmail}` })).toHaveValue("member");
  await rows.nth(1).getByRole("button", { name: "Remove" }).click();
  await expect(rows).toHaveCount(1);
  await invitee.goto("/app");
  await expect(invitee).toHaveURL(/\/app\/new$/);
});
