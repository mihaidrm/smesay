// The main path of E7-3: a published project with three items in two areas, opened on a
// phone. A pick reaches PUT /r/[token]/answers in under a second. With the network cut, two
// answers show "Not saved" in the header and the connection banner, a complete card "Not
// saved yet"; with it back, both
// read Saved. An answer given offline on a tab that is then closed stays on the device and
// is sent when the link opens again; a returning visit with no screen in the address lands
// on the first chapter with an unfinished item. A change kept unsent on one device does not
// replace an answer another device saved since (the version it was made on,
// src/lib/answer-queue.ts), and the card says so. A browser whose localStorage throws gets
// the notice once and still saves. The project is the test's own (the sample link collects
// nothing, docs/review-list.md).
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.18" } });

test("autosave within a second, offline queue, resume, no storage", async ({ page, request, browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const email = `e2e-autosave-${stamp}@marlow.example`;
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(await latestLink(request, email));
  await page.getByLabel("Workspace name").fill("Marlow Group");
  await page.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  await expect(page).toHaveURL(/\/app\/quickstart$/);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole("link", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Expense tool");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/import$/);
  const projectUrl = page.url().replace(/\/import$/, "");
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Approval from the notification email | Approving | Must", "Split a receipt across projects | Submitting | Should"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 3 items" }).click();
  await expect(page.getByTestId("imported-line")).toBeVisible();
  await page.goto(`${projectUrl}/build`);
  await expect(page.getByRole("heading", { name: "Build the instrument" })).toBeVisible();
  await page.goto(`${projectUrl}/share`);
  await expect(page.getByTestId("share-zone")).not.toBeEmpty();
  await page.getByLabel("Closes").fill("2027-01-20T18:00");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByTestId("link-state")).toHaveText("Published");
  const url = await page.getByTestId("share-link").inputValue();

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const link = await phone.newPage();
  await link.goto(url);
  await link.locator("[data-ready]").waitFor();
  await link.getByLabel("Name").fill("Ana Pop");
  await link.getByLabel("Role").fill("Finance lead");
  await link.getByTestId("about-you-start").click();
  await expect(link.getByTestId("chapter-title")).toHaveText("Submitting");
  const receipts = link.getByTestId("item-card").filter({ hasText: "Receipts captured by phone" });
  const split = link.getByTestId("item-card").filter({ hasText: "Split a receipt across projects" });

  // Within a second of the pick, the request is on its way.
  const sent = link.waitForRequest((r) => r.method() === "PUT" && r.url().endsWith("/answers"));
  const picked = Date.now();
  await receipts.getByRole("radio", { name: "Must" }).click();
  await sent;
  expect(Date.now() - picked).toBeLessThan(1000);
  await expect(receipts.getByTestId("item-card-note")).toHaveText("Saved");

  // The network cut: two answers wait, the header and the banner say so; back, both save.
  await phone.setOffline(true);
  await split.getByRole("radio", { name: "Should" }).click();
  await receipts.getByRole("radio", { name: "Could" }).click();
  await receipts.getByTestId("card-reason").fill("Most receipts arrive by email.");
  await expect(link.getByTestId("saving-banner")).toContainText("Your connection dropped; this page keeps trying.");
  await expect(link.getByTestId("respondent-note")).toHaveText("Not saved");
  await expect(split.getByTestId("item-card-note")).not.toHaveText("Saved");
  // A complete card that has not reached the server says so (the respondent board).
  await expect(receipts.getByTestId("item-card-note")).toHaveText("Not saved yet");
  await phone.setOffline(false);
  await expect(split.getByTestId("item-card-note")).toHaveText("Saved", { timeout: 15_000 });
  await expect(receipts.getByTestId("item-card-note")).toHaveText("Saved");
  await expect(link.getByTestId("saving-banner")).toHaveCount(0);

  // An answer given offline on a tab then closed is sent when the link opens again.
  await phone.setOffline(true);
  await split.getByRole("radio", { name: "Unclear" }).click();
  await split.getByTestId("card-reason").fill("Which projects?");
  await link.getByTestId("chapter-title").click();
  await expect(link.getByTestId("respondent-note")).toHaveText("Not saved");
  await link.close();
  await phone.setOffline(false);
  const again = await phone.newPage();
  await again.goto(url);
  await again.locator("[data-ready]").waitFor();
  // Every Submitting item is complete, so the visit lands on Approving.
  await expect(again.getByTestId("chapter-title")).toHaveText("Approving");
  await again.getByTestId("chapter-back").click();
  await expect(again.getByTestId("chapter-title")).toHaveText("Submitting");
  const splitAgain = again.getByTestId("item-card").filter({ hasText: "Split a receipt across projects" });
  await expect(splitAgain.getByTestId("card-reason")).toHaveValue("Which projects?");
  await expect(splitAgain.getByTestId("item-card-note")).toHaveText("Saved");
  await again.reload();
  await again.locator("[data-ready]").waitFor();
  await expect(splitAgain.getByTestId("card-reason")).toHaveValue("Which projects?");

  // A change kept unsent on one device never replaces an answer another device saved since
  // (the same response: the second context carries the device cookie, not the storage).
  // Every save from the phone fails, the one sent as the tab closes too.
  await phone.route("**/answers", (route) => route.abort());
  const receiptsAgain = again.getByTestId("item-card").filter({ hasText: "Receipts captured by phone" });
  // Typed key by key: many more saves than the laptop's one below, and still not sent over it.
  await receiptsAgain.getByTestId("card-reason").fill("");
  await receiptsAgain.getByTestId("card-reason").pressSequentially("Old text from the phone, typed at length on the train.");
  await expect(again.getByTestId("respondent-note")).toHaveText("Not saved");
  const laptop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await laptop.addCookies(await phone.cookies());
  const desk = await laptop.newPage();
  await desk.goto(`${url}?at=1`);
  // Typed only once the page has hydrated (data-ready). Typed into before, the run failed 1 in
  // 2 with the old value left after the new text; that hydration put the server's value back
  // between Playwright's select-all and its typing is unverified.
  await desk.locator("[data-ready]").waitFor();
  const receiptsDesk = desk.getByTestId("item-card").filter({ hasText: "Receipts captured by phone" });
  await receiptsDesk.getByTestId("card-reason").fill("Newer, from the laptop.");
  await expect(receiptsDesk.getByTestId("item-card-note")).toHaveText("Saved");
  await laptop.close();
  // The phone's tab closes with the change unsent; the next visit finds it was made on an
  // answer the laptop has replaced since: the card shows the laptop's and says so.
  await again.close();
  await phone.unroute("**/answers");
  const third = await phone.newPage();
  await third.goto(`${url}?at=1`);
  await third.locator("[data-ready]").waitFor();
  const receiptsThird = third.getByTestId("item-card").filter({ hasText: "Receipts captured by phone" });
  await expect(receiptsThird.getByTestId("card-reason")).toHaveValue("Newer, from the laptop.");
  await expect(receiptsThird.getByTestId("item-card-note")).toHaveText("This answer was changed in another window or on another device. The card shows the saved one; change it again if yours should stand.");
  // The phone's change is dropped: the visit after shows the laptop's answer as saved.
  await third.reload();
  await third.locator("[data-ready]").waitFor();
  await expect(receiptsThird.getByTestId("card-reason")).toHaveValue("Newer, from the laptop.");
  await expect(receiptsThird.getByTestId("item-card-note")).toHaveText("Saved");
  await phone.close();

  // A browser that keeps no localStorage: the notice once, and answers still save.
  const locked = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await locked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("The operation is insecure.", "SecurityError"); } });
  });
  const tab = await locked.newPage();
  await tab.goto(url);
  await tab.locator("[data-ready]").waitFor();
  await tab.getByLabel("Name").fill("Bo");
  await tab.getByLabel("Role").fill("Sales");
  await tab.getByTestId("about-you-start").click();
  await expect(tab.getByTestId("chapter-title")).toHaveText("Submitting");
  await expect(tab.getByTestId("storage-notice")).toContainText("This browser does not keep answers between visits.");
  const lockedCard = tab.getByTestId("item-card").filter({ hasText: "Receipts captured by phone" });
  await lockedCard.getByRole("radio", { name: "Must" }).click();
  await expect(lockedCard.getByTestId("item-card-note")).toHaveText("Saved");
  await tab.getByTestId("chapter-back").click();
  await tab.getByTestId("about-you-start").click();
  await expect(tab.getByTestId("chapter-title")).toHaveText("Submitting");
  await expect(tab.getByTestId("storage-notice")).toHaveCount(0);
  await locked.close();
});
