// The main path of sign-in (stories/E2-1, acceptance 6): ask for a link, read it from Mailpit's
// API (e2e/mailpit.ts), open it, land in the app (the workspace step on a first sign-in,
// stories/E2-3), sign out, and see the used link refused.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

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
  await expect(page).toHaveURL(/\/app\/new$/);
  await expect(page.getByText(`Signed in as ${email}.`)).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/sign-in\?next=(\/|%2F)app$/);
  await page.goto("/app/projects?tab=items");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Fprojects%3Ftab%3Ditems$/);
  await page.goto(link);
  await expect(page).toHaveURL(/\/sign-in\/link-used/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("already been used or has expired");
});
