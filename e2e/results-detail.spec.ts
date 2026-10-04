// The main path of E8-5 on the sample, the include-unsubmitted switch off: CL-04's title in
// the Agreement table opens the detail with the item in the URL, the counts (2 agree, 2
// different priority, 1 disagree, 2 not yet answered) and Ioana Marin's reason; the role filter
// Sales keeps it open with Sales' counts; Escape closes it back to the tab. The same item opens
// from the Different priority register.
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
  await expect(page).toHaveURL(/\/app$/);
  const href = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  const id = href!.match(/projects\/([0-9a-f-]{36})/)![1];
  await page.goto(`/app/projects/${id}/results?unsubmitted=0`);
  await page.locator("[data-testid=filter-bar][data-ready]").waitFor();

  await page.getByTestId("agreement-item").filter({ hasText: "CL-04" }).click();
  await expect(page).toHaveURL(/item=[0-9a-f-]{36}/);
  const panel = page.getByRole("dialog");
  await expect(panel.getByTestId("detail-title")).toBeFocused();
  await expect(panel.getByTestId("detail-title")).toHaveText("Expenses over the policy limit are flagged before they reach the approver.");
  await expect(panel.getByTestId("detail-counts")).toHaveText("2 agree · 2 different priority · 1 disagree · 0 unclear · 2 not yet answered");
  const ioana = panel.getByTestId("detail-row").filter({ hasText: "Ioana Marin" });
  await expect(ioana).toContainText("I find out I was over the limit three weeks later, after I have paid.");
  await expect(panel.getByTestId("detail-row").filter({ hasText: "Sam Hill" })).toContainText("No answer yet.");
  // The filter changes with the panel open: it stays, and its counts follow (Sales: Ioana and
  // Tom, Elena not started).
  await page.getByTestId("filter-role").filter({ hasText: "Sales" }).click();
  await expect(page).toHaveURL(/f\.role=Sales/);
  await expect(page).toHaveURL(/item=/);
  await expect(panel.getByTestId("detail-counts")).toHaveText("0 agree · 2 different priority · 0 disagree · 0 unclear · 1 not yet answered");
  await panel.getByTestId("detail-title").focus();
  await page.keyboard.press("Escape");
  await expect(page).not.toHaveURL(/item=/);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByTestId("tab-pushed").click();
  await page.getByTestId("register-change").getByTestId("register-row").filter({ hasText: "Ioana Marin" }).filter({ hasText: "CL-04" }).getByTestId("register-item").click();
  await expect(page).toHaveURL(/tab=pushed.*item=|item=.*tab=pushed/);
  await expect(page.getByRole("dialog").getByTestId("detail-row").filter({ hasText: "Ioana Marin" })).toContainText("I find out I was over the limit three weeks later, after I have paid.");
  await page.getByTestId("detail-close").click();
  await expect(page).not.toHaveURL(/item=/);
  await expect(page.getByTestId("register-change")).toBeVisible();
});
