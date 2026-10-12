// The main path of E17-1 (acceptance 7): a member sends a report from a project page, sees it
// under the form; the admin sees it on /admin/feedback, marks it solved, the member sees
// Solved; the admin removes it; Mailpit holds the admin email. One person is both here, an
// address playwright.config.ts lists in ADMIN_EMAILS.
import { expect, test } from "@playwright/test";
import { latestLink, latestMessage } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.91" } });

test("a report goes from a project page to the admin inbox and back", async ({ page, request }) => {
  test.setTimeout(90_000);
  const email = "e2e-admin-feedback@marlow.example";
  const text = `The import button does nothing ${Date.now()}.`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  const nameField = page.getByLabel("Workspace name");
  await expect(nameField.or(page.getByTestId("dev-menu"))).toBeVisible({ timeout: 15_000 });
  if (await nameField.isVisible()) {
    await nameField.fill("Feedback Co");
    await page.getByRole("button", { name: "Create workspace" }).click();
    await expect(page).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
    await expect(page.getByTestId("quickstart")).toBeVisible();
  }
  await page.goto("/app");
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const from = new URL(page.url()).pathname;

  // The sidebar item carries the page; the form shows it and sends it.
  await page.getByRole("link", { name: "Feedback" }).click();
  await expect(page).toHaveURL(/\/app\/feedback\?from=/);
  await expect(page.getByTestId("feedback-about")).toHaveText(`About: ${from}`);
  await page.getByRole("radio", { name: "Something is wrong" }).check();
  await page.getByLabel("What would you like to tell us?").fill(text);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("feedback-sent")).toContainText(`Sent. Thank you. If we reply, it goes to ${email}.`);
  const item = page.getByTestId("feedback-item").filter({ hasText: text });
  await expect(item).toHaveCount(1);
  await expect(item.getByTestId("feedback-status")).toHaveText("Open");
  await expect(item).toContainText(`Something is wrong · ${from}`);
  await expect(page.getByLabel("What would you like to tell us?")).toHaveValue("");
  const mail = await latestMessage(request, email);
  expect(mail.subject).toBe("Feedback, something is wrong: Feedback Co");
  expect(mail.text).toContain(text);
  expect(mail.text).toContain(`about ${from}:`);
  expect(mail.text).toContain("/admin/feedback");

  // The admin inbox: the row, Mark solved through the confirm line, then the Solved filter.
  await page.goto("/admin/feedback");
  const row = page.getByTestId("feedback-row").filter({ hasText: text });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Feedback Co");
  await expect(row).toContainText(email);
  await expect(row).toContainText("Open");
  await row.getByRole("button", { name: "Mark solved" }).click();
  await expect(row.getByTestId("solve-form")).toContainText("Mark this report solved?");
  await row.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByTestId("feedback-row").filter({ hasText: text })).toHaveCount(0);
  await page.goto("/admin/feedback?status=solved");
  const solved = page.getByTestId("feedback-row").filter({ hasText: text });
  await expect(solved).toHaveCount(1);
  await expect(solved).toContainText("Solved on");
  await expect(solved).toContainText(email);

  // The member sees Solved; the admin removes the report; it is gone on both sides.
  await page.goto("/app/feedback");
  await expect(page.getByTestId("feedback-item").filter({ hasText: text }).getByTestId("feedback-status")).toHaveText("Solved");
  await page.goto("/admin/feedback?status=solved");
  const again = page.getByTestId("feedback-row").filter({ hasText: text });
  await again.getByRole("button", { name: "Remove" }).click();
  await again.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByTestId("feedback-row").filter({ hasText: text })).toHaveCount(0);
  await page.goto("/app/feedback");
  await expect(page.getByTestId("feedback-item").filter({ hasText: text })).toHaveCount(0);
  await page.goto("/admin/audit");
  await expect(page.getByTestId("audit-row").first()).toContainText("Removed a report");
});
