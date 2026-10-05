// The main path of E8-4 on the sample, the include-unsubmitted switch off: the Different
// priority and Disagree tab holds 7 and 2 rows with the counts in the headings and the tab,
// Ioana's reason on CL-04 among them; sorting by respondent puts the sort in the URL; the
// Questions and gaps tab holds the 2 questions and Dana's missing item.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.46" } });

test("registers: different priority and disagree, questions and gaps", async ({ page, request }) => {
  test.setTimeout(90_000);
  const email = `e2e-registers-${Date.now()}@marlow.example`;
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
  const href = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  const id = href!.match(/projects\/([0-9a-f-]{36})/)![1];
  await page.goto(`/app/projects/${id}/results?unsubmitted=0&tab=pushed`);
  await page.locator("[data-testid=filter-bar][data-ready]").waitFor();
  await expect(page.getByTestId("tab-pushed")).toHaveText("Different priority and Disagree (9)");
  await expect(page.getByTestId("register-change-count")).toHaveText("7");
  await expect(page.getByTestId("register-disagree-count")).toHaveText("2");
  const ioana = page.getByTestId("register-change").getByTestId("register-row").filter({ hasText: "Ioana Marin" }).filter({ hasText: "CL-04" });
  await expect(ioana).toContainText("I find out I was over the limit three weeks later, after I have paid.");
  await expect(ioana).toContainText("Must");
  await page.getByTestId("register-change").getByRole("link", { name: /Respondent/ }).click();
  await expect(page).toHaveURL(/sort=respondent&dir=asc/);
  await expect(page.getByTestId("register-change").getByTestId("register-row").first()).toContainText("Dana Okafor");

  await page.getByTestId("tab-questions").click();
  await expect(page.getByTestId("register-unclear-count")).toHaveText("2");
  await expect(page.getByTestId("register-missing").getByTestId("register-row")).toContainText("Dana Okafor");
});
