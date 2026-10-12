// The main path of E11-3: the landing page's footer (/landing-page until E12 moves it to /) opens the four legal pages, each with its
// version and date (the lawyer approved version 3 on 2026-10-07, decision 0059; version 4 of 2026-10-08 fills in the company
// details; version 5 of the privacy policy, 2026-10-12, adds the paragraph on service emails, decision 0067); another name under
// /legal is the 404 page. The
// respondent's privacy link is powered-by.test.tsx's.
import { expect, test } from "@playwright/test";

test("the legal pages from the landing footer", async ({ page, request }) => {
  for (const [name, title, version] of [["Privacy", "Privacy policy", "Version 5, 12 October 2026"], ["Terms", "Terms of service", "Version 4, 8 October 2026"], ["DPA", "Data processing agreement", "Version 4, 8 October 2026"], ["Subprocessors", "Subprocessors", "Version 4, 8 October 2026"]] as const) {
    await page.goto("/landing-page");
    await page.getByRole("navigation", { name: "Legal" }).getByRole("link", { name, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByTestId("legal-version")).toHaveText(version);
  }
  expect((await request.get("/legal/cookies")).status()).toBe(404);
});
