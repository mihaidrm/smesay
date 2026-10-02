// The main path of workspace settings (stories/E2-5): an owner renames the workspace, uploads
// a PNG logo and sets an accent, sees the contrast line and the saved line, the sidebar name,
// and the logo served by the public route; a light accent shows the banner. The respondent
// side's use of the accent is E7's test.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
const CLIENT = { "x-forwarded-for": "10.0.0.4" };
test.use({ extraHTTPHeaders: CLIENT });

const ONE_PIXEL_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgy04GAAFnAN1T9u7/AAAAAElFTkSuQmCC", "base64");

test("owner sets the name, the logo and the accent", async ({ page, request }) => {
  const email = `e2e-brand-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Brand on the respondent side" })).toBeVisible();
  // The sample project's rows never count (E2-6), so a new workspace starts at zero.
  await expect(page.getByTestId("budget-line")).toHaveText("EUR 50.00 per month, EUR 0.00 used this month");
  await expect(page.getByTestId("usage-line")).toHaveText("0 projects, 0 responses this month, 0 AI runs this month.");

  await page.getByLabel("Workspace name").fill("Marlow Group Ltd");
  await page.getByLabel("Accent colour").fill("#1F4F7A");
  await expect(page.getByTestId("accent-line")).toContainText("Contrast on white 8.54:1");
  await page.getByLabel("Logo").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: ONE_PIXEL_PNG });
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Saved.");
  await expect(page.getByRole("complementary").getByText("Marlow Group Ltd")).toBeVisible();
  const logo = page.getByTestId("logo-preview");
  await expect(logo).toBeVisible();
  const served = await request.get((await logo.getAttribute("src"))!);
  expect(served.status()).toBe(200);
  expect(served.headers()["content-type"]).toBe("image/png");
  expect((await served.body()).equals(ONE_PIXEL_PNG)).toBe(true);

  await page.getByLabel("Accent colour").fill("#FFD500");
  await expect(page.getByTestId("accent-line")).toContainText("Contrast on white 1.42:1");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("This colour is too light on white");

  await page.getByLabel("Accent colour").fill("blue");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("accent-line")).toHaveText("Enter the colour as six hex digits, like #1F4F7A.");
});
