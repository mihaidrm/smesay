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

test("the mode toggle flips the mode, keeps it across a reload and the system setting applies until a choice is made", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/styleguide");
  // No stored choice: the system setting wins, the switch reads on.
  const toggle = page.getByRole("switch", { name: "Dark mode" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  expect(await page.evaluate(() => localStorage.getItem("smesay-mode"))).toBe("light");
  // The choice survives a reload and beats the system setting.
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.getByRole("switch", { name: "Dark mode" })).toHaveAttribute("aria-checked", "false");
});
