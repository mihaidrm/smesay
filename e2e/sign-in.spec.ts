// The main path of sign-in (stories/E2-1, acceptance 6): ask for a link, read it from Mailpit's
// API (GET /api/v1/search?query=to:<address>, GET /api/v1/message/{ID}: mailpit.axllent.org/docs/
// api-v1, swagger), open it, land in the app, sign out. Needs Mailpit at localhost:8025 (docker
// compose, or the CI service container) and MAIL_SMTP_URL=smtp://localhost:1025.
import { expect, test } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

async function latestLink(request: import("@playwright/test").APIRequestContext, to: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const list = await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent("to:" + to)}&limit=1`);
    const body = await list.json();
    if (body.messages?.length) {
      const message = await (await request.get(`${MAILPIT}/api/v1/message/${body.messages[0].ID}`)).json();
      const link = (message.Text as string).split("\n").find((l) => l.includes("/api/auth/magic-link/verify"));
      if (link) return link.trim();
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No sign-in email for ${to} arrived in Mailpit within 15 seconds.`);
}

test("sign in with a magic link, then sign out", async ({ page, request }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("not an address");
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByText("Enter the email address you signed up with.")).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email. The link works once and stops working in 15 minutes.");
  const link = await latestLink(request, email);
  await page.goto(link);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText(`You are signed in as ${email}.`)).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp$/);
  await page.goto(link);
  await expect(page).toHaveURL(/\/sign-in\/link-used/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("already been used or has expired");
});
