// The main path of E8-3 on the sample, the include-unsubmitted switch off: the Table view lists
// the six items; Columns shows one bar per kind for Submitting; Share shows the list donut with
// "18 of 30 agree" with the two shares beside it (decision 0062); the view is kept after a reload; split by Role draws Sales and Finance bars
// on CL-04, Finance's not compared (one answer); sorted by disagree, CL-06 leads Paying.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.44" } });

test("agreement tab: three views, split by role, sort by disagree", async ({ page, request }) => {
  test.setTimeout(120_000);
  const email = `e2e-agreement-${Date.now()}@marlow.example`;
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
  await page.goto(`/app/projects/${id}/results?unsubmitted=0`);
  await page.locator("[data-testid=filter-bar][data-ready]").waitFor();
  await expect(page.getByTestId("agreement-row")).toHaveCount(6);
  // CL-05: 4 agree and Lukas's not needed, so 80% agree, 0% a different priority, 20% not needed.
  const cl05 = page.getByTestId("agreement-row").filter({ hasText: "CL-05" });
  await expect(cl05.getByTestId("row-change-share")).toHaveText("0%");
  await expect(cl05.getByTestId("row-disagree-share")).toHaveText("20%");

  const views = page.getByRole("group", { name: "View" });
  await views.getByRole("button", { name: "Columns" }).click();
  const submitting = page.locator('[data-testid=columns-area][data-area="Submitting"]');
  await expect(submitting.locator("[data-series]")).toHaveCount(5);
  await views.getByRole("button", { name: "Share" }).click();
  await expect(page.getByTestId("share-list").getByTestId("donut-line")).toHaveText("18 of 30 agree · 23% different priority · 10% not needed");
  await page.reload();
  await page.locator("[data-testid=filter-bar][data-ready]").waitFor();
  await expect(page.getByRole("group", { name: "View" }).getByRole("button", { name: "Share" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Table" }).click();
  await expect(page.getByTestId("agreement-row")).toHaveCount(6);
  await page.getByTestId("split-by").selectOption("role");
  await expect(page).toHaveURL(/split=role/);
  // The group rows that follow CL-04's row (each item's groups sit under it).
  const onCl04 = (group: string) => page.locator(`xpath=//tr[@data-testid='agreement-group' and @data-group='${group}'][preceding-sibling::tr[@data-testid='agreement-row'][1][@data-ref='CL-04']]`);
  await expect(onCl04("Sales")).toHaveCount(1);
  await expect(onCl04("Finance")).toHaveCount(1);
  await expect(onCl04("Finance")).toHaveClass(/opacity-60/);
  await expect(page.getByTestId("small-groups")).toBeVisible();

  await page.getByTestId("split-by").selectOption("");
  await page.getByTestId("sort-items").selectOption("disagree");
  await expect(page).toHaveURL(/sort=disagree&dir=desc/);
  const paying = page.locator('[data-testid=agreement-area][data-area="Paying"]');
  await expect(paying.getByTestId("agreement-row").first()).toHaveAttribute("data-ref", "CL-06");
});
