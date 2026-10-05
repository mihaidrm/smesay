// The main path of E7-7: axe-core (through @axe-core/playwright) over About you, a chapter,
// the Wrap up and Done finds no serious or critical violation (WCAG 2.0 A and AA, 2.1 AA);
// one card is answered with the keyboard alone, the focus ring showing; the proposed pill is
// named "[VALUE], proposed"; the progress bar carries its value text; no request leaves for
// a font host; "Powered by SMEsay" shows on the Free plan; reduced motion stops the
// transitions; on dark the selected pill takes the lifted accent. The project is the test's
// own (the sample link collects nothing, docs/review-list.md).
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.22" } });

async function noSeriousViolations(page: Page, where: string) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  // Each violation names its elements and axe's message, so a failure says what to fix.
  expect(serious.map((v) => `${where}: ${v.id} (${v.nodes.length}): ${v.nodes.map((n) => `${n.target.join(" ")} ${n.any[0]?.message ?? ""}`).join("; ")}`)).toEqual([]);
}

test("accessible journey: axe, keyboard, names, fonts, motion, dark accent", async ({ page, request, browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const email = `e2e-a11y-${stamp}@marlow.example`;
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
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectUrl = page.url().replace(/\/import$/, "");
  // A file with a Notes column, so every card carries details and axe sees the details slot:
  // long enough to scroll on a phone, with a long link that must wrap.
  const notes = [
    "Staff photograph the receipt in the app; the amount, date and merchant are read from the photo and can be corrected before sending.",
    "Paper receipts are kept for six years, as the tax office asks, and a receipt in another currency is converted at the rate of the day it was paid.",
    "Receipts over 250 pounds need a second approver, and a receipt that cannot be read goes back to the person who sent it with the reason.",
    "Policy: https://intranet.marlow.example/finance/policies/expenses/receipts-and-retention-policy-2026-version-3",
  ].join(" ");
  const csv = ["Requirement,Area,Priority,Notes", `Receipts captured by phone,Submitting,Must,"${notes}"`, `Paid with the next salary run,Paying,Should,"${notes}"`].join("\n");
  await page.getByLabel("Your file").setInputFiles({ name: "requirements.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.getByLabel("Requirement", { exact: true }).selectOption("text");
  await page.getByLabel("Area", { exact: true }).selectOption("area");
  await page.getByLabel("Priority", { exact: true }).selectOption("value");
  await page.getByLabel("Notes", { exact: true }).selectOption("custom");
  await page.getByRole("button", { name: "Import 2 items" }).click();
  await expect(page.getByTestId("imported-line")).toBeVisible();
  await page.goto(`${projectUrl}/build`);
  await expect(page.getByRole("heading", { name: "Build the instrument" })).toBeVisible();
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  const url = await page.getByTestId("share-link").inputValue();

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const link = await phone.newPage();
  const hosts = new Set<string>();
  link.on("request", (r) => hosts.add(new URL(r.url()).hostname));
  await link.goto(url);
  await link.locator("[data-ready]").waitFor();
  await expect(link.getByTestId("about-you")).toBeVisible();
  await expect(link.getByTestId("powered-by")).toBeVisible();
  await noSeriousViolations(link, "About you");
  await link.getByLabel("Name").fill("Ana Pop");
  await link.getByLabel("Role").fill("Finance lead");
  // Tab to Start and to Submit: each shows the ring (the first audit found them without one).
  const tabTo = async (target: ReturnType<typeof link.getByTestId>) => {
    for (let i = 0; i < 20 && !(await target.evaluate((e) => e === document.activeElement)); i++) await link.keyboard.press("Tab");
    await expect(target).toBeFocused();
    expect(await target.evaluate((e) => getComputedStyle(e).boxShadow)).toContain("rgb(109, 76, 245)");
  };
  await tabTo(link.getByTestId("about-you-start"));
  await link.keyboard.press("Enter");
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  await expect(link.getByTestId("chapter-title")).toBeFocused();
  // Details longer than their slot scroll and take a tab stop, named for the item; the long
  // link wraps, so they never scroll sideways. Checked before axe runs, so axe reads the
  // details once their size has been measured.
  const details = link.getByRole("region", { name: "Details: Receipts captured by phone" });
  await expect(details).toHaveAttribute("tabindex", "0");
  expect(await details.evaluate((e) => [e.scrollHeight > e.clientHeight + 1, e.scrollWidth <= e.clientWidth])).toEqual([true, true]);
  await noSeriousViolations(link, "Chapter");

  // The keyboard alone: Tab to the rating row, an arrow picks the next value, Tab to the box.
  await expect(link.getByRole("radio", { name: "Must, proposed" })).toHaveCount(1);
  const first = link.getByRole("radio", { name: "Must, proposed" });
  for (let i = 0; i < 20 && !(await first.evaluate((e) => e === document.activeElement)); i++) await link.keyboard.press("Tab");
  await expect(first).toBeFocused();
  expect(await first.evaluate((e) => getComputedStyle(e).boxShadow)).not.toBe("none");
  await link.keyboard.press("ArrowRight");
  await expect(link.getByRole("radio", { name: "Should" })).toHaveAttribute("aria-checked", "true");
  await link.keyboard.press("Tab");
  await expect(link.getByTestId("card-reason")).toBeFocused();
  await link.keyboard.type("Most receipts arrive by email.");
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await expect(link.getByRole("progressbar", { name: "Items answered" })).toHaveAttribute("aria-valuetext", "1 of 2");

  // Reduced motion stops the transitions.
  await link.emulateMedia({ reducedMotion: "reduce" });
  expect(await first.evaluate((e) => getComputedStyle(e).transitionDuration)).toBe("0s");
  await link.emulateMedia({ reducedMotion: "no-preference" });

  await link.getByTestId("chapter-continue").click();
  await link.getByTestId("item-card").getByRole("radio", { name: "Should, proposed" }).click();
  await expect(link.getByTestId("item-card-note")).toHaveText("Saved");
  await link.getByTestId("chapter-continue").click();
  await expect(link.getByTestId("wrap-up")).toBeVisible();
  await noSeriousViolations(link, "Wrap up");
  await link.getByTestId("wrap-up-confidence").getByRole("radio", { name: "4" }).click();
  await link.getByTestId("wrap-up-signoff").click();
  await tabTo(link.getByTestId("wrap-up-submit"));
  await link.keyboard.press("Enter");
  await expect(link.getByTestId("done-thanks")).toHaveText("Thank you, Ana.");
  await noSeriousViolations(link, "Done");
  expect([...hosts].filter((h) => h.includes("fonts.googleapis.com") || h.includes("fonts.gstatic.com"))).toEqual([]);
  await phone.close();

  // On dark the selected pill takes the lifted accent with the dark ink: violet 400 for the
  // default violet (src/lib/brand-rules.ts darkAccent).
  const dark = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  const night = await dark.newPage();
  await night.goto(url);
  await night.locator("[data-ready]").waitFor();
  await noSeriousViolations(night, "About you, dark");
  await night.getByLabel("Name").fill("Bo");
  await night.getByLabel("Role").fill("Sales");
  await night.getByTestId("about-you-start").click();
  const pill = night.getByRole("radio", { name: "Must, proposed" });
  await pill.click();
  // toHaveCSS retries until the colour transition has ended (the read mid-transition failed).
  await expect(pill).toHaveCSS("background-color", "rgb(155, 134, 255)");
  await expect(pill).toHaveCSS("color", "rgb(22, 21, 42)");
  await dark.close();
});
