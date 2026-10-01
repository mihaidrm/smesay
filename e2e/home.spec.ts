import { expect, test } from "@playwright/test";

test("the home page loads with the product name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("SMEsay");
  await expect(page.getByText("Send the list as a link. Get back who agrees, and why.")).toBeVisible();
});
