// The main path of E8-1: sign in, create a workspace (it gets the sample project), open the
// sample's Results; the switch on by default counts the in-progress respondent's 4 answers
// (23 of 34), off it reads 5 of 7 and 63% (19 of 30); the role filter Sales narrows the strip,
// the tab counts and says what is showing; Clear filters; a tile swapped in Choose tiles is
// kept after a reload; a project with nothing built shows the empty state; the sample carries
// its watermark band.
import { expect, test, type Page } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.41" } });

const ready = (page: Page) => page.locator("[data-testid=filter-bar][data-ready]").waitFor();

test("results: switch, filter, tiles, empty state", async ({ page, request }) => {
  test.setTimeout(120_000);
  const email = `e2e-results-${Date.now()}@marlow.example`;
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
  const sampleHref = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  const sampleId = sampleHref!.match(/projects\/([0-9a-f-]{36})/)![1];
  const results = `/app/projects/${sampleId}/results`;
  await page.goto(results);
  await ready(page);
  const tile = (id: string) => page.locator(`[data-tile="${id}"]`);
  await expect(page.getByRole("navigation", { name: "Steps" }).locator("[aria-current='step']")).toHaveText(/Results/);
  await expect(page.getByTestId("sample-band")).toHaveText("Sample data: invented answers, for looking around");

  // On by default: the in-progress respondent's 4 answers count.
  const sw = page.getByRole("switch", { name: "Include unsubmitted answers" });
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await expect(tile("submitted")).toContainText("5 of 7");
  await expect(tile("agreement")).toContainText("Agreement, 23 of 34 answers");
  await sw.click();
  await expect(tile("agreement")).toContainText("63%");
  await expect(tile("agreement")).toContainText("Agreement, 19 of 30 answers");
  await expect(tile("submitted")).toContainText("5 of 7");
  await page.reload();
  await ready(page);
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await sw.click();
  await expect(tile("agreement")).toContainText("Agreement, 23 of 34 answers");

  // The role filter Sales: Ioana and Tom submitted, Elena has not opened her invite.
  const pushedTab = page.getByTestId("tab-pushed");
  const before = await pushedTab.textContent();
  await page.getByTestId("filter-role").filter({ hasText: "Sales" }).click();
  await expect(tile("submitted")).toContainText("2 of 3");
  await expect(page).toHaveURL(/f\.role=Sales/);
  await expect(page.getByTestId("showing-line")).toHaveText("Showing 2 of 6 responses: Role: Sales.");
  await expect(pushedTab).not.toHaveText(before!);
  await page.getByTestId("clear-filters").click();
  await expect(tile("submitted")).toContainText("5 of 7");
  await expect(page.getByTestId("showing-line")).toHaveCount(0);

  // Swap Missing items suggested for Median minutes to submit; kept after a reload.
  await page.getByTestId("choose-tiles").click();
  await page.getByTestId("tile-option-missing").uncheck();
  await page.getByTestId("tile-option-medianMinutes").check();
  await page.getByTestId("save-tiles").click();
  await expect(page.getByTestId("tile-chooser")).not.toBeVisible();
  await expect(tile("medianMinutes")).toBeVisible();
  await page.reload();
  await ready(page);
  await expect(tile("medianMinutes")).toBeVisible();
  await expect(tile("missing")).toHaveCount(0);

  // A project with nothing built yet: the empty state.
  await page.goto("/app");
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Empty one");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  await page.goto(page.url().replace(/\/import$/, "/results"));
  await expect(page.getByTestId("no-answers")).toHaveText("The link is not published. Share it, or open the sample project to see what results look like.");
  await expect(page.getByRole("link", { name: "Open the sample project" })).toHaveAttribute("href", results);
});
