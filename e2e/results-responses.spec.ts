// The main path of E8-2: the sample's Responses tab lists everyone, the role filter Sales
// keeps three rows (Ioana and Tom submitted, Elena invited), and sorting by the submitted date
// flips the order; the sort is in the URL.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.43" } });

test("responses tab: filter by role, sort by submitted date", async ({ page, request }) => {
  test.setTimeout(90_000);
  const email = `e2e-tracker-${Date.now()}@marlow.example`;
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
  await page.goto(`/app/projects/${id}/results?tab=responses`);
  await page.locator("[data-testid=filter-bar][data-ready]").waitFor();
  const rows = page.getByTestId("response-row");
  await expect(rows).toHaveCount(7);
  await expect(rows.filter({ hasText: "Sam Hill" })).toContainText("In progress");
  await expect(rows.filter({ hasText: "Sam Hill" })).toContainText("4 of 6");
  await page.getByTestId("filter-role").filter({ hasText: "Sales" }).click();
  await expect(rows).toHaveCount(3);
  await expect(page).toHaveURL(/tab=responses/);
  await page.getByTestId("sort-submitted").click();
  await expect(page).toHaveURL(/sort=submitted&dir=asc/);
  await expect(rows.first().getByRole("rowheader")).toHaveText("Ioana Marin");
  await page.getByTestId("sort-submitted").click();
  await expect(page).toHaveURL(/sort=submitted&dir=desc/);
  await expect(rows.first().getByRole("rowheader")).toHaveText("Tom Reyes");
  await expect(page.getByRole("columnheader", { name: /Submitted/ })).toHaveAttribute("aria-sort", "descending");
});
