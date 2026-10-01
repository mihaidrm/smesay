import { expect, test } from "@playwright/test";

test("the styleguide shows the tokens and the components", async ({ page }) => {
  await page.goto("/styleguide");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Styleguide");
  // The status table lists the five statuses.
  await expect(page.locator("#colour table tbody tr")).toHaveCount(5);
  // The segmented control switches.
  const phone = page.getByRole("button", { name: "Phone" });
  await phone.click();
  await expect(phone).toHaveAttribute("aria-pressed", "true");
  // The banner dismisses and can come back.
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByRole("button", { name: "Show the banner again" })).toBeVisible();
});
