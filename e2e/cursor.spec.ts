// The hand cursor on every control (design note 101): the computed cursor of a button, a
// summary and a link on the landing page, and of a rating pill, the role select, the dark mode
// switch on /sample; a text field keeps the I-beam and a disabled button the arrow.
import { expect, test, type Locator } from "@playwright/test";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.75" } });

const cursorOf = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).cursor);

test("controls show the hand, text fields the I-beam, disabled buttons the arrow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/landing-page");
  expect(await cursorOf(page.getByRole("link", { name: "Compare" }))).toBe("pointer");
  expect(await cursorOf(page.getByRole("button").first())).toBe("pointer");
  expect(await cursorOf(page.locator("summary").first())).toBe("pointer");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sample");
  await page.locator("[data-ready]").waitFor();
  expect(await cursorOf(page.getByRole("switch", { name: "Dark mode" }).first())).toBe("pointer");
  expect(await cursorOf(page.getByLabel("Role", { exact: true }))).toBe("pointer");
  expect(await cursorOf(page.getByLabel("Name", { exact: true }))).toBe("text");
  expect(await cursorOf(page.getByTestId("about-you-start"))).not.toBe("pointer");
  await page.getByLabel("Name", { exact: true }).fill("Dana");
  await page.getByLabel("Role", { exact: true }).selectOption("Finance");
  expect(await cursorOf(page.getByTestId("about-you-start"))).toBe("pointer");
  await page.getByTestId("about-you-start").click();
  expect(await cursorOf(page.getByRole("radio", { name: "Must" }).first())).toBe("pointer");
});
