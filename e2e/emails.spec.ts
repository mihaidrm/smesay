// The main path of E16-1, acceptance 5: the Emails to you card in Settings. A person turns the
// digest on and the validation emails off; each switch shows its state after a reload. The
// emails themselves are sent by the job and tested in src/lib/notifications.test.ts.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.72" } });

test("the email switches save and show their state after a reload", async ({ page, request }) => {
  const email = `e2e-emails-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  await expect(page).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app/settings");
  const card = page.getByTestId("emails-card");
  await expect(card.getByRole("heading", { name: "Emails to you" })).toBeVisible();
  const validations = card.getByTestId("email-switch-validations");
  const digest = card.getByTestId("email-switch-digest");
  const guide = card.getByTestId("email-switch-guide");
  await expect(validations).toHaveAttribute("aria-checked", "true");
  await expect(digest).toHaveAttribute("aria-checked", "false");
  await expect(guide).toHaveAttribute("aria-checked", "true");
  // A switch shows its new state at once (useOptimistic) while the save travels; the reload
  // waits for each save's reply, else it cuts the request.
  const saved = () => page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/app/settings");
  let reply = saved();
  await digest.click();
  await expect(digest).toHaveAttribute("aria-checked", "true");
  await reply;
  reply = saved();
  await validations.click();
  await expect(validations).toHaveAttribute("aria-checked", "false");
  await reply;
  await page.reload();
  await expect(card.getByTestId("email-switch-digest")).toHaveAttribute("aria-checked", "true");
  await expect(card.getByTestId("email-switch-validations")).toHaveAttribute("aria-checked", "false");
  await expect(card.getByTestId("email-switch-guide")).toHaveAttribute("aria-checked", "true");
});
