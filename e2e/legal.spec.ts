// The main path of E11-3: the landing page's footer (/landing-page until E12 moves it to /) opens the four legal pages, each with its
// version and date and the lawyer's markers shown; another name under /legal is the 404 page. The
// respondent's privacy link is powered-by.test.tsx's.
import { expect, test } from "@playwright/test";

test("the legal pages from the landing footer", async ({ page, request }) => {
  for (const [name, title] of [["Privacy", "Privacy policy"], ["Terms", "Terms of service"], ["DPA", "Data processing agreement"], ["Subprocessors", "Subprocessors"]] as const) {
    await page.goto("/landing-page");
    await page.getByRole("navigation", { name: "Legal" }).getByRole("link", { name, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByTestId("legal-version")).toHaveText("Version 1, 4 October 2026");
    expect(await page.getByTestId("lawyer-marker").count()).toBeGreaterThan(0);
  }
  expect((await request.get("/legal/cookies")).status()).toBe(404);
});
