// The main path of E11-6, acceptances 1 and 2: an unknown address shows the 404 in the product's
// words with the way to the projects; an unknown address below a respondent link shows the
// link's own 404, with no PM navigation. The 500 pages and maintenance are unit-tested
// (src/lib/error-pages-copy.test.ts, src/proxy.test.ts). The 404's scene (stories/E11-7): the
// pointer lights the big 404 and moving it moves the light, each rating of the missing page
// gets the robot's line and pose, under reduced motion and on a touch screen the 404 is fully
// lit and still, and Go back goes back.
import { expect, test } from "@playwright/test";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.72" } });

test("the 404 pages of the PM side and of a respondent link", async ({ page }) => {
  const missing = await page.goto("/no-such-page");
  expect(missing!.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page does not exist.");
  await expect(page.getByText("Check the address, or go to your projects.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to your projects" })).toHaveAttribute("href", "/app");

  // The torch follows the pointer; rating the card gets the robot's line and pose.
  const scene = page.getByTestId("lost-page");
  await expect(scene).toHaveAttribute("data-checked", "true");
  await expect(scene).toHaveAttribute("data-live", "true");
  const lx = () => scene.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--lx"));
  await page.mouse.move(200, 220);
  await expect.poll(lx).not.toBe("");
  const first = await lx();
  await page.mouse.move(640, 260);
  await expect.poll(lx).not.toBe(first);
  const line = page.getByTestId("robot-line");
  const card = page.getByTestId("lost-card");
  await expect(line).toHaveText("The robot looked everywhere and found nothing to read.");
  await card.getByRole("radio", { name: "Not needed" }).click();
  await expect(line).toHaveText("You rated it Not needed. Then nothing is missing.");
  await expect(page.getByTestId("mascot")).toHaveAttribute("data-pose", "analysis");
  await card.getByRole("radio", { name: "Should" }).click();
  await expect(line).toHaveText("You rated it Should. So it is a lower priority. Fair enough: it can wait, and your projects cannot.");
  await expect(page.getByTestId("mascot")).toHaveAttribute("data-pose", "idea");
  await card.getByRole("radio", { name: "Unclear" }).click();
  await expect(line).toHaveText("You rated it Unclear. It is unclear to the robot too. Check the address for a typo.");
  await card.getByRole("radio", { name: "Must, proposed" }).click();
  await expect(line).toHaveText("You rated it Must. Agreed, it is a must. It still does not exist. Your projects do.");
  await expect(page.getByTestId("mascot")).toHaveAttribute("data-pose", "hi");

  // Reduced motion: lit and still, no torch line, the robot does not float.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.getByTestId("lost-page")).toHaveAttribute("data-checked", "true");
  await expect(page.getByTestId("lost-page")).toHaveAttribute("data-live", "false");
  await expect(page.getByTestId("lights-off")).toHaveCount(0);
  await expect(page.getByTestId("mascot")).not.toHaveClass(/landing-float/);

  // Go back: after an earlier page, it goes there.
  await page.goto("/sign-in");
  await page.goto("/still-no-such-page");
  await page.getByRole("button", { name: "Go back" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  const below = await page.goto("/r/0123456789abcdef0123456789abcdef/no-such-page");
  expect(below!.status()).toBe(404);
  await expect(page.getByTestId("link-not-found")).toContainText("Check the link you were sent, or ask the person who sent it for a new one.");
  await expect(page.getByRole("link", { name: "Go to your projects" })).toHaveCount(0);
});

// A touch screen (stories/E11-7, acceptance 3): no pointer to hold a torch, so the 404 is lit
// and still, and the robot does not float.
test.describe("on a touch screen", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test("the 404 is lit and nothing moves", async ({ page }) => {
    await page.goto("/no-such-page");
    const scene = page.getByTestId("lost-page");
    await expect(scene).toHaveAttribute("data-checked", "true");
    await expect(scene).toHaveAttribute("data-live", "false");
    await expect(page.getByTestId("lights-off")).toHaveCount(0);
    await expect(page.getByTestId("mascot")).not.toHaveClass(/landing-float/);
    await page.getByTestId("lost-card").getByRole("radio", { name: "Could" }).tap();
    await expect(page.getByTestId("robot-line")).toHaveText("You rated it Could. So it is a lower priority. Fair enough: it can wait, and your projects cannot.");
  });
});

