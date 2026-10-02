// The main path of E4-2: paste a list where three items carry an area and three do not,
// import it, open Shape, run the AI (the stand-in in e2e/fake-anthropic.mjs answers), see the
// three imported areas kept with their rationale and the loose items marked "Placed by AI",
// move one item with "Move to" and one by dragging, reload, run again: both stay. Then the
// reader versions (E4-3): Accept, Undo, Edit with a blank refused, Reject all with its
// confirm line, and the counter.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.8" } });

test("shape a list into areas and move items", async ({ page, request }) => {
  const email = `e2e-shape-${Date.now()}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("New expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);

  // Shape before a list: the empty state points to Import.
  const projectUrl = page.url().replace(/\/import$/, "");
  await page.goto(`${projectUrl}/shape`);
  await expect(page.getByTestId("shape-empty")).toContainText("Import a list first.");
  await page.getByRole("link", { name: "Go to Import" }).click();

  // The project context (E4-5): typed on Import, shown on Shape as what the AI was given.
  await page.getByLabel("What is this about?").fill("Replace the expense tool for 400 staff.");
  await page.getByLabel("Terms to keep as written, optional").fill("Marlow, per diem");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();

  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill([
    "1. Receipts captured by phone | Submitting | Must",
    "2. Approval from the notification email | Approving | Must",
    "3. Reimbursement through payroll | Paying | Should",
    "- Travel advances before a trip",
    "- Per diem rates by country",
    "- Mileage from a start and end address",
  ].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 6 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 6 items as version 1 on");

  await page.getByRole("navigation", { name: "Steps" }).getByRole("link", { name: /Shape/ }).click();
  await expect(page).toHaveURL(/\/shape$/);
  await expect(page.getByRole("heading", { name: "Shape the list" })).toBeVisible();
  await expect(page.getByTestId("context-line")).toHaveText("Context used: Replace the expense tool for 400 staff. Kept as written: Marlow, per diem");
  // Before the run: the imported areas and the loose items, read-only.
  await expect(page.getByTestId("area")).toHaveCount(4);
  await expect(page.getByTestId("area").last()).toContainText("Not shaped yet");
  await expect(page.getByRole("button", { name: "Move" })).toHaveCount(0);

  await page.getByRole("button", { name: "Shape with AI" }).click();
  await expect(page.getByTestId("grouped-line")).toContainText("AI grouped 6 items into 3 areas and wrote a readable version of each.");
  const areas = page.getByTestId("area");
  await expect(areas).toHaveCount(3);
  await expect(areas.nth(0)).toContainText("Submitting");
  await expect(areas.nth(0).getByTestId("rationale")).toHaveText("First, because submitting starts it.");
  await expect(areas.nth(0).getByTestId("item")).toHaveCount(4);
  await expect(page.getByTestId("placed-pill")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Run again" })).toBeVisible();

  // Move to, by keyboard-reachable controls.
  const travel = page.getByTestId("item").filter({ hasText: "Travel advances before a trip" });
  await travel.getByLabel(/^Move .* to$/).selectOption("Paying");
  await travel.getByRole("button", { name: "Move" }).click();
  await expect(areas.nth(2).getByTestId("item").filter({ hasText: "Travel advances" })).toHaveCount(1);
  await expect(areas.nth(2).getByTestId("item").filter({ hasText: "Travel advances" }).getByTestId("moved-pill")).toHaveText("Moved by you");
  await expect(page.getByTestId("placed-pill")).toHaveCount(2);

  // Drag and drop (the HTML Drag and Drop API through Playwright's dragTo). The target is
  // scrolled into view first: with the reader rows the page is taller than the viewport and
  // a drop on an off-screen area lands nowhere.
  const mileage = page.getByTestId("item").filter({ hasText: "Mileage from a start" });
  await areas.nth(1).scrollIntoViewIfNeeded();
  await mileage.dragTo(areas.nth(1));
  await expect(areas.nth(1).getByTestId("item").filter({ hasText: "Mileage" })).toHaveCount(1);

  await page.reload();
  await expect(page.getByTestId("area").nth(2).getByTestId("item").filter({ hasText: "Travel advances" })).toHaveCount(1);
  await expect(page.getByTestId("area").nth(1).getByTestId("item").filter({ hasText: "Mileage" })).toHaveCount(1);

  // Run again: the items the model placed are sent without an area, so the stand-in puts the
  // loose ones back in Submitting; the two the PM moved are sent with their area and stay.
  await page.getByRole("button", { name: "Run again" }).click();
  await expect(page.getByTestId("grouped-line")).toContainText("AI grouped 6 items into 3 areas and wrote a readable version of each.");
  await expect(page.getByTestId("area").nth(2).getByTestId("item").filter({ hasText: "Travel advances" })).toHaveCount(1);
  await expect(page.getByTestId("area").nth(1).getByTestId("item").filter({ hasText: "Mileage" })).toHaveCount(1);
  await expect(page.getByTestId("area").nth(0).getByTestId("item")).toHaveCount(2);

  // Flags (E4-4): the stand-in raises one ambiguity and one duplicate. Dismiss the duplicate;
  // it stays dismissed after a reload and a run again (checked at the end).
  await expect(page.getByTestId("flag-ambiguity")).toHaveCount(1);
  await expect(page.getByTestId("flag-ambiguity")).toContainText("Ambiguity in 5. Which countries, and who sets the rate. Respondents may mark it unclear.");
  await expect(page.getByTestId("flag-duplicate")).toContainText("6 may duplicate 1.");
  await expect(page.getByTestId("item").filter({ hasText: "Per diem" }).getByTestId("item-note")).toHaveText("Ambiguity: Which countries, and who sets the rate.");
  await expect(page.getByTestId("item").filter({ hasText: "Mileage" }).getByTestId("item-note")).toHaveText("May duplicate 1.");
  // The refs are links to the rows.
  const refLink = page.getByTestId("flag-duplicate").getByRole("link", { name: "1" });
  await expect(refLink).toHaveAttribute("href", /^#item-[0-9a-f-]{36}$/);
  await expect(page.locator(await refLink.getAttribute("href") as string)).toContainText("Receipts captured by phone");
  await page.getByTestId("flag-duplicate").getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByTestId("flag-duplicate")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("flag-duplicate")).toHaveCount(0);
  await expect(page.getByTestId("flag-ambiguity")).toHaveCount(1);

  // Reader versions (E4-3): every item has a suggested one from the stand-in.
  await expect(page.getByTestId("reader-counter")).toHaveText("0 of 6 reader versions accepted.");
  await expect(page.getByTestId("reader-pill")).toHaveCount(6);
  const receipts = page.getByTestId("item").filter({ hasText: "Receipts captured by phone" });
  await expect(receipts.getByTestId("reader-text")).toHaveText("Receipts captured by phone (in plain words)");
  await expect(receipts.getByTestId("original-text")).toHaveText("Original: Receipts captured by phone");
  await receipts.getByRole("button", { name: "Accept" }).click();
  await expect(receipts.getByTestId("reader-pill")).toHaveText("Reader version used");
  await expect(page.getByTestId("reader-counter")).toHaveText("1 of 6 reader versions accepted.");
  await receipts.getByRole("button", { name: "Undo" }).click();
  await expect(receipts.getByTestId("reader-pill")).toHaveText("Suggested");
  await receipts.getByRole("button", { name: "Edit" }).click();
  await receipts.getByLabel(/Readable version of/).fill("   ");
  await receipts.getByRole("button", { name: "Save" }).click();
  await expect(receipts.getByRole("alert")).toHaveText("Write the readable version, or reject the suggestion to keep the original.");
  await receipts.getByLabel(/Readable version of/).fill("Take a photo of the receipt with your phone.");
  await receipts.getByRole("button", { name: "Save" }).click();
  await expect(receipts.getByTestId("reader-text")).toHaveText("Take a photo of the receipt with your phone.");
  await expect(receipts.getByTestId("reader-pill")).toHaveText("Reader version used");
  await page.getByRole("button", { name: "Reject all" }).click();
  await expect(page.getByTestId("reader-all-confirm")).toContainText("Reject all 5 suggested reader versions and keep the originals?");
  await page.getByTestId("reader-all-confirm").getByRole("button", { name: "Reject all" }).click();
  await expect(page.getByTestId("reader-pill").filter({ hasText: "Original kept" })).toHaveCount(5);
  await expect(page.getByTestId("reader-counter")).toHaveText("1 of 6 reader versions accepted.");
  await expect(page.getByRole("button", { name: "Accept all" })).toHaveCount(0);

  // A run again keeps the dismissal (E4-4, acceptance 3).
  await page.getByRole("button", { name: "Run again" }).click();
  await expect(page.getByTestId("reader-counter")).toHaveText("1 of 6 reader versions accepted.");
  await expect(page.getByTestId("flag-duplicate")).toHaveCount(0);
  await expect(page.getByTestId("flag-ambiguity")).toHaveCount(1);
});
