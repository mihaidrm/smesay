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

  await page.getByTestId("wrap-up-confidence").getByRole("radio", { name: "4" }).click();
  await page.getByTestId("wrap-up-signoff").click();
  await page.getByTestId("wrap-up-submit").click();
  await expect(page.getByTestId("done-thanks")).toHaveText("Thank you, Dana.");
  await expect(page.getByTestId("done-when")).toHaveText("Nothing was sent: this is the sample.");
  await expect(page.getByTestId("sample-start-free")).toHaveAttribute("href", "/sign-in");

  expect(writes).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});
