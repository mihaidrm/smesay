// Captures the respondent screens as built (E7) for the canvas board "Respondent as built"
// (design note 59; decision 0041: product screens are the imagery). Not a test: the name
// does not match Playwright's test files, so CI never runs it. To run it, copy it to
// e2e/zz-board-shots.spec.ts, run `SHOTS_DIR=<folder> npx playwright test
// e2e/zz-board-shots.spec.ts` with the usual e2e setup, and delete the copy. Writes PNGs to
// SHOTS_DIR (docs/design-notes/prototype-01/respondent-built/ holds the last run). Every context
// takes About you, a chapter and the Wrap up with items still to finish before the phone
// submits; then the phone's Wrap up ready, Done, welcome back and the changed notice, and
// the desktop's welcome back. The dev server's badge is hidden.
import { expect, test, type Browser, type Page } from "@playwright/test";
import { latestInvite, latestLink } from "./mailpit";

const OUT = process.env.SHOTS_DIR ?? "test-results/shots";
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.31" } });

async function ready(p: Page) {
  await p.locator("[data-ready]").waitFor();
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await p.waitForTimeout(400);
}

test("respondent screens for the board", async ({ page, request, browser }) => {
  test.setTimeout(300_000);
  const stamp = Date.now();
  const email = `e2e-shots-${stamp}@marlow.example`;
  const ana = `ana-shots-${stamp}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app\/quickstart$/);
  // The page stamps quickstart_seen_at while it renders; leaving before it shows can cut that off.
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectUrl = page.url().replace(/\/import$/, "");
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill([
    "Receipts captured by phone | Submitting | Must",
    "Split a receipt across projects | Submitting | Should",
    "Mileage from saved addresses | Submitting | Could",
    "Approve from the email | Approving | Must",
    "Paid with the next salary run | Paying | Should",
  ].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: /Import 5 items/ }).click();
  await expect(page.getByTestId("imported-line")).toBeVisible();
  await page.goto(`${projectUrl}/build`);
  await expect(page.getByRole("heading", { name: "Build the instrument" })).toBeVisible();
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  await page.getByLabel("People, one per line").fill(`${ana}, Ana Pop, Finance`);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("invites-form").getByRole("status")).toHaveText("1 invite sent.");
  const invite = await latestInvite(request, ana);

  const open = async (b: Browser, name: string, viewport: { width: number; height: number }, colorScheme: "light" | "dark") => {
    const ctx = await b.newContext({ viewport, colorScheme });
    const p = await ctx.newPage();
    return { name, ctx, p, shot: (n: string) => p.screenshot({ path: `${OUT}/${name}-${n}.png` }) };
  };
  const phone = await open(browser, "390-light", { width: 390, height: 844 }, "light");
  const desk = await open(browser, "1440-light", { width: 1440, height: 900 }, "light");
  const night = await open(browser, "390-dark", { width: 390, height: 844 }, "dark");
  const all = [phone, desk, night];

  for (const v of all) {
    await v.p.goto(invite.link);
    await ready(v.p);
    await expect(v.p.getByTestId("about-you-start")).toBeVisible();
    await v.shot("01-about-you");
  }
  await phone.p.getByTestId("about-you-start").click();
  await expect(phone.p.getByTestId("chapter-title")).toHaveText("Submitting");
  const card = (p: Page, t: string) => p.getByTestId("item-card").filter({ hasText: t });
  await card(phone.p, "Receipts captured by phone").getByRole("radio", { name: /^Must/ }).click();
  await card(phone.p, "Split a receipt across projects").getByRole("radio", { name: /^Could/ }).click();
  await card(phone.p, "Split a receipt across projects").getByTestId("card-reason").fill("Only a few trips a year need it.");
  await expect(card(phone.p, "Split a receipt across projects").getByTestId("item-card-note")).toHaveText("Saved");

  for (const v of all) {
    await v.p.goto(`${invite.link}?at=1`);
    await ready(v.p);
    await expect(v.p.getByTestId("chapter-title")).toHaveText("Submitting");
    await v.shot("02-chapter");
    await v.p.goto(`${invite.link}?at=wrap`);
    await ready(v.p);
    await v.shot("03-wrap-up-to-finish");
  }

  // The phone finishes everything, submits, comes back and changes an answer.
  const p = phone.p;
  await p.goto(`${invite.link}?at=1`);
  await ready(p);
  await card(p, "Mileage from saved addresses").getByRole("radio", { name: /^Could/ }).click();
  await p.getByTestId("chapter-continue").click();
  await p.getByTestId("item-card").getByRole("radio", { name: /^Must/ }).click();
  await p.getByTestId("chapter-continue").click();
  await p.getByTestId("item-card").getByRole("radio", { name: /^Should/ }).click();
  await expect(p.getByTestId("item-card-note")).toHaveText("Saved");
  await p.getByTestId("chapter-continue").click();
  await p.getByTestId("wrap-up-confidence").getByRole("radio", { name: "4" }).click();
  await p.getByTestId("wrap-up-signoff").click();
  await p.waitForTimeout(1200);
  await phone.shot("04-wrap-up-ready");
  await p.getByTestId("wrap-up-submit").click();
  await expect(p.getByTestId("done-thanks")).toBeVisible();
  await phone.shot("05-done");
  for (const v of [phone, desk]) {
    await v.p.goto(invite.link);
    await ready(v.p);
    await expect(v.p.getByTestId("done-thanks")).toBeVisible();
    await v.shot("06-welcome-back");
  }
  await p.getByTestId("done-change").click();
  await p.getByTestId("wrap-up-confidence").getByRole("radio", { name: "3" }).click();
  await expect(p.getByTestId("changed-since")).toBeVisible();
  await p.waitForTimeout(400);
  await phone.shot("07-changed-since");
  for (const v of all) await v.ctx.close();
});
