// The main path of E8-6 on the sample, the switch off: under the Agreement table, "Where groups
// disagree, by Role" with Role picked; every role has fewer than 3 answers on every item, so
// no item is compared, the banner says why, and "Show all 6 items" lists each item with its
// groups shown without numbers; an item opens its detail (E8-5). The ordering by the gap is
// the unit test's (src/db/queries/results.test.ts, fixed rows).
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.48" } });

test("conflict view: by role on the sample, small groups not compared", async ({ page, request }) => {
  test.setTimeout(90_000);
  const email = `e2e-conflict-${Date.now()}@marlow.example`;
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

  const view = page.getByTestId("conflict-view");
  await expect(view.getByRole("heading", { name: "Where groups disagree, by Role" })).toBeVisible();
  await expect(view.getByTestId("gap-field")).toHaveValue("role");
  await expect(view.getByTestId("gaps-none")).toHaveText("No item has two groups with 3 answers or more yet.");
  await expect(view.getByTestId("gaps-small-groups")).toContainText("Groups with fewer than 3 answers are shown but not compared");
  await view.getByTestId("gaps-show-all").click();
  const rows = view.getByTestId("gaps-all").getByTestId("gap-row");
  await expect(rows).toHaveCount(6);
  const cl04 = rows.filter({ hasText: "CL-04" });
  await expect(cl04.getByTestId("gap-line")).toHaveText("Engineering manager: fewer than 3 answers. Finance: fewer than 3 answers. HR: fewer than 3 answers. Sales: fewer than 3 answers.");
  await cl04.getByTestId("gap-item").click();
  await expect(page).toHaveURL(/item=/);
  await expect(page.getByRole("dialog").getByTestId("detail-title")).toHaveText("Expenses over the policy limit are flagged before they reach the approver.");
});
