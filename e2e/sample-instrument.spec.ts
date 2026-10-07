// The visitors' sample's main path (stories/E12-4, acceptance 4): open /sample on a phone with
// no account, answer one item and see it kept on this device, answer the rest, submit and reach
// Done with Start free. Along the way: the band says nothing is saved, a reload and Back keep
// the screen and the answers (the tab's session storage), the page sends no write and sets no
// cookie (acceptances 1 and 3), and Powered by SMEsay links to the landing page (acceptance 2).
import { expect, test } from "@playwright/test";

// One rate-limit bucket per spec file (e2e/workspace.spec.ts says why).
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.74" }, viewport: { width: 390, height: 844 } });

test("a visitor answers the sample and reaches Done, with nothing saved", async ({ page, context }) => {
  const writes: string[] = [];
  page.on("request", (r) => { if (r.method() !== "GET" && r.method() !== "HEAD") writes.push(`${r.method()} ${r.url()}`); });

  await page.goto("/sample");
  await expect(page.getByTestId("sample-band")).toHaveText("Sample: nothing you enter here is saved");
  await expect(page.getByTestId("powered-by").first()).toHaveAttribute("href", "/landing-page");
  await page.locator("[data-ready]").waitFor();
  await page.getByLabel("Name", { exact: true }).fill("Dana");
  await page.getByLabel("Role", { exact: true }).selectOption("Finance");
  await page.getByTestId("about-you-start").click();
  await expect(page.getByTestId("chapter-title")).toHaveText("Submitting");

  const cards = page.getByTestId("item-card");
  await cards.nth(0).getByRole("radio", { name: "Must" }).click();
  await expect(cards.nth(0).getByTestId("item-card-note")).toHaveText("Saved on this device");
  // Kept in the tab: a reload opens the same screen with the answer.
  await page.reload();
  await page.locator("[data-ready]").waitFor();
  await expect(page.getByTestId("chapter-title")).toHaveText("Submitting");
  await expect(cards.nth(0).getByTestId("item-card-note")).toHaveText("Saved on this device");

  await cards.nth(1).getByRole("radio", { name: "Should" }).click();
  await page.getByTestId("chapter-continue").click();
  await expect(page.getByTestId("chapter-title")).toHaveText("Approving");
  // Back goes to the screen before, as on a live link.
  await page.goBack();
  await expect(page.getByTestId("chapter-title")).toHaveText("Submitting");
  await page.goForward();
  await expect(page.getByTestId("chapter-title")).toHaveText("Approving");
  await cards.nth(0).getByRole("radio", { name: "Must" }).click();
  await cards.nth(1).getByRole("radio", { name: "Should" }).click();
  await page.getByTestId("chapter-continue").click();
  await expect(page.getByTestId("chapter-title")).toHaveText("Paying");
  await cards.nth(0).getByRole("radio", { name: "Must" }).click();
  await cards.nth(1).getByRole("radio", { name: "Could" }).click();
  await page.getByTestId("chapter-continue").click();

  await page.getByTestId("confidence-slider").focus();
  await page.getByTestId("confidence-slider").press("ArrowRight");
  await page.getByTestId("wrap-up-signoff").click();
  await page.getByTestId("wrap-up-submit").click();
  await expect(page.getByTestId("done-thanks")).toHaveText("Thank you, Dana.");
  await expect(page.getByTestId("done-when")).toHaveText("Nothing was sent: this is the sample.");
  await expect(page.getByTestId("sample-start-free")).toHaveAttribute("href", "/sign-in");

  expect(writes).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

// The light and dark switch in the respondent header (design note 97): a phone set to light
// opens the sample in light; the switch turns it dark, keeps the choice in the browser for the
// next visit, and turns it back.
test("the header's switch turns the sample dark and keeps the choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/sample");
  const html = page.locator("html");
  const mode = page.getByRole("switch", { name: "Dark mode" });
  await expect(mode).toHaveAttribute("aria-checked", "false");
  await expect(html).not.toHaveClass(/\bdark\b/);
  await mode.click();
  await expect(mode).toHaveAttribute("aria-checked", "true");
  await expect(html).toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => localStorage.getItem("smesay-mode"))).toBe("dark");
  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(mode).toHaveAttribute("aria-checked", "true");
  await mode.click();
  await expect(html).not.toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => localStorage.getItem("smesay-mode"))).toBe("light");
});

// The card and the moves between chapters (design note 99; Mihai, 2026-10-05): "Requirement
// CL-01" over the summary, the details behind View more above the rating, the reason box the
// only box under it, the two cards of a row the same height whatever opens in one of them, the
// generic reason question, no "Say why." note, and the content sliding in from the side the
// respondent moved to.
test("the sample's cards: reference line, View more, equal heights, the slide", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/sample");
  await page.locator("[data-ready]").waitFor();
  await page.getByLabel("Name", { exact: true }).fill("Dana");
  await page.getByLabel("Role", { exact: true }).selectOption("Finance");
  await page.getByTestId("about-you-start").click();
  await expect(page.locator("[data-slide]")).toHaveAttribute("data-slide", "next");
  const cards = page.getByTestId("item-card");
  const first = cards.nth(0);
  await expect(first.getByTestId("card-reference")).toHaveText("Requirement CL-01");
  // The details are closed, above the rating row, and open in place.
  await expect(first.getByTestId("card-details")).toBeHidden();
  const more = first.getByTestId("card-more");
  await expect(more).toHaveText(/^View more/);
  await expect(more).toHaveAttribute("aria-expanded", "false");
  const heights = async () => [Math.round((await cards.nth(0).boundingBox())!.height), Math.round((await cards.nth(1).boundingBox())!.height)];
  const [a0, b0] = await heights();
  expect(a0).toBe(b0);
  await more.click();
  await expect(first.getByTestId("card-details")).toBeVisible();
  await expect(more).toHaveText(/^View less/);
  expect((await first.getByTestId("card-details").boundingBox())!.y).toBeLessThan((await first.getByRole("radiogroup").boundingBox())!.y);
  const [a1, b1] = await heights();
  expect(a1).toBe(b1);
  // A value other than the proposal: the generic question in the reason box, no note.
  const proposed = await first.locator("[data-proposed]").textContent();
  await first.getByRole("radio", { name: proposed === "Should" ? "Must" : "Should" }).click();
  await expect(first.getByText("Could you tell us why you think the priority should be different?")).toBeVisible();
  await expect(first.getByTestId("item-card-note")).toHaveText("");
  await expect(first.getByTestId("item-card-missing")).toHaveText("Reason not written yet");
  await expect(first.getByTestId("card-reason")).toHaveAttribute("aria-required", "true");
  const [a2, b2] = await heights();
  expect(a2).toBe(b2);
  // Continue slides the next chapter in from the right; Back from the left.
  await page.getByTestId("chapter-continue").click();
  await expect(page.getByTestId("chapter-title")).toHaveText("Approving");
  await expect(page.locator("[data-slide]")).toHaveAttribute("data-slide", "next");
  await page.getByTestId("chapter-back").click();
  await expect(page.getByTestId("chapter-title")).toHaveText("Submitting");
  await expect(page.locator("[data-slide]")).toHaveAttribute("data-slide", "prev");
  // The Wrap up names what the card left unsaid.
  await page.getByTestId("row-wrap").click();
  await expect(page.getByTestId("wrap-up")).toContainText("Reason not written yet");
});
