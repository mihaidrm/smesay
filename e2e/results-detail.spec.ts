// The main path of E8-5 on the sample, the include-unsubmitted switch off: CL-04's title in
// the Agreement table opens the detail in place of the tabs with the item in the URL, the
// counts (2 agree, 2 different priority, 1 disagree, 2 not yet answered) and Ioana Marin's
// reason; the role filter Sales keeps it open with Sales' counts; Escape goes back to the tab
// and the focus returns to the item's link. The same item opens from the Different priority
// register, and Back returns to it.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.47" } });

test("item detail: open CL-04, see Ioana Marin's reason", async ({ page, request }) => {
  test.setTimeout(90_000);
  const email = `e2e-detail-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  await expect(page).toHaveURL(/\/app\/quickstart$/);
  // The page stamps quickstart_seen_at while it renders; leaving before it shows can cut that off.
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  const href = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  const id = href!.match(/projects\/([0-9a-f-]{36})/)![1];
  await page.goto(`/app/projects/${id}/results?unsubmitted=0`);
  await page.locator("[data-testid=filter-bar][data-ready]").waitFor();

  await page.getByTestId("agreement-item").filter({ hasText: "CL-04" }).click();
  await expect(page).toHaveURL(/item=[0-9a-f-]{36}/);
  const panel = page.getByTestId("detail-panel");
  const counts = async (want: [string, string][]) => { for (const [k, n] of want) await expect(panel.getByTestId(`detail-count-${k}`)).toHaveText(n); };
  await expect(panel.getByTestId("detail-title")).toBeFocused();
  await expect(panel.getByTestId("detail-title")).toHaveText("Expenses over the policy limit are flagged before they reach the approver.");
  await expect(page.getByTestId("results-tabs")).toHaveCount(0);
  await counts([["agree", "2"], ["change", "2"], ["disagree", "1"], ["unclear", "0"], ["notYet", "2"]]);
  const ioana = panel.getByTestId("detail-row").filter({ hasText: "Ioana Marin" });
  await expect(ioana).toContainText("I find out I was over the limit three weeks later, after I have paid.");
  await expect(panel.getByTestId("detail-row").filter({ hasText: "Sam Hill" })).toContainText("No answer yet.");
  // The filter changes with the panel open: it stays, and its counts follow (Sales: Ioana and
  // Tom, Elena not started).
  await page.getByTestId("filter-role").filter({ hasText: "Sales" }).click();
  await expect(page).toHaveURL(/f\.role=Sales/);
  await expect(page).toHaveURL(/item=/);
  await counts([["agree", "0"], ["change", "2"], ["disagree", "0"], ["unclear", "0"], ["notYet", "1"]]);
  await panel.getByTestId("detail-title").focus();
  await page.keyboard.press("Escape");
  await expect(page).not.toHaveURL(/item=/);
  await expect(page.getByTestId("detail-panel")).toHaveCount(0);
  await expect(page.getByTestId("agreement-item").filter({ hasText: "CL-04" })).toBeFocused();

  await page.getByTestId("tab-pushed").click();
  await page.getByTestId("register-change").getByTestId("register-row").filter({ hasText: "Ioana Marin" }).filter({ hasText: "CL-04" }).getByTestId("register-item").click();
  await expect(page).toHaveURL(/tab=pushed.*item=|item=.*tab=pushed/);
  await expect(page.getByTestId("detail-close")).toHaveText("Back to different priority and disagree");
  await expect(panel.getByTestId("detail-row").filter({ hasText: "Ioana Marin" })).toContainText("I find out I was over the limit three weeks later, after I have paid.");
  await page.getByTestId("detail-close").click();
  await expect(page).not.toHaveURL(/item=/);
  await expect(page.getByTestId("register-change")).toBeVisible();
});
