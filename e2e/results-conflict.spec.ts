// The main path of E8-6 on the sample, the switch off: under the Agreement table, "Where groups
// disagree, by Role" with Role picked; every role has fewer than 3 answers on every item, so
// no item is compared, the banner says why, and "Show all 6 items" lists each item with its
// groups shown without numbers; an item opens its detail (E8-5). Then four respondents are
// added to the sample's rows (two in Finance, two in Sales, agreeing on CL-04), so CL-04 has
// two groups of 3 or more: Finance 3 of 3, Sales 2 of 4, 50 points apart. The ordering by the
// gap is the unit test's (src/db/queries/results.test.ts, fixed rows).
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import postgres from "postgres";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.48" } });

async function sampleResults(page: Page, request: APIRequestContext, tag: string): Promise<string> {
  const email = `e2e-conflict-${tag}-${Date.now()}@marlow.example`;
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
  return href!.match(/projects\/([0-9a-f-]{36})/)![1];
}

test("conflict view: by role on the sample, small groups not compared", async ({ page, request }) => {
  test.setTimeout(90_000);
  const id = await sampleResults(page, request, "small");
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
  await expect(page.getByTestId("detail-panel").getByTestId("detail-title")).toHaveText("Expenses over the policy limit are flagged before they reach the approver.");
});

test("conflict view: two groups of 3 or more on CL-04, 50 points apart", async ({ page, request }) => {
  test.setTimeout(90_000);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set: this test adds respondents to the sample in the database.");
  const id = await sampleResults(page, request, "gap");
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    const [ins] = await sql`select ins.id, ins.workspace_id, ins.item_set_id, i.id as invite from instrument ins join invite i on i.instrument_id = ins.id and i.kind = 'public' where ins.project_id = ${id}`;
    const [item] = await sql`select id from item where item_set_id = ${ins.item_set_id} and source_ref = 'CL-04'`;
    for (const [name, role] of [["Ana Field", "Finance"], ["Ben Lowe", "Finance"], ["Cara Diaz", "Sales"], ["Dev Shah", "Sales"]]) {
      const [r] = await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, fields, submitted_at, first_submitted_at, signed_off)
        values (${ins.workspace_id}, ${ins.id}, ${ins.item_set_id}, ${ins.invite}, md5(random()::text) || md5(${name}), ${sql.json({ name, role })}, now(), now(), true) returning id`;
      await sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind, value) values (${ins.workspace_id}, ${r.id}, ${ins.item_set_id}, ${item.id}, 'agree', 'S')`;
    }
  } finally {
    await sql.end();
  }
  await page.goto(`/app/projects/${id}/results?unsubmitted=0`);
  await page.locator("[data-testid=filter-bar][data-ready]").waitFor();
  const top = page.getByTestId("conflict-view").getByTestId("gaps-top").getByTestId("gap-row");
  await expect(top).toHaveCount(1);
  await expect(top.getByTestId("gap-item")).toContainText("CL-04");
  await expect(top.getByTestId("gap-points")).toHaveText("50 points apart");
  await expect(top.getByTestId("gap-line")).toHaveText("Engineering manager: fewer than 3 answers. Finance: 3 of 3 agree. HR: fewer than 3 answers. Sales: 2 of 4 agree.");
  await expect(top.locator("[data-group=Finance]")).toContainText("3 of 3");
  await expect(top.locator("[data-group=HR]")).not.toContainText("of");
  // Under a filter that keeps one role, nothing is compared and the line says what to do.
  await page.getByTestId("filter-role").filter({ hasText: "Sales" }).click();
  await expect(page).toHaveURL(/f\.role=Sales/);
  await expect(page.getByTestId("gaps-none")).toHaveText("No item has two groups with 3 answers or more under this filter. Clear the filter or compare by another field.");
});
