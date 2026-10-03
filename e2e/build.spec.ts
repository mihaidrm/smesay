// The main path of E5-1: sign in, create a project, paste a list, open Build (a draft on
// version 1, titled after the project, Name and Role required), see the preview's About you
// page with Start disabled and its hint, add a dropdown field with its options, save, see the
// select with the options in the preview and the hint naming the required fields (decision
// 0043); fill the required fields in the preview and see Start enabled; the scoring card
// (E5-2): the method switch, a label and the proposal switch seen on the Items screen; the
// three layouts (E5-3) with the side-scroll and pill-height checks in the frame; two
// perspectives defined, two items tagged on Shape, the picked one narrowing the preview (E5-4);
// the Closing card opening the Wrap up in the preview, a closing question seen there and
// the missing-item form switched off (E5-5); Remove refused on the last field.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

// See e2e/sign-in.spec.ts: one client address per file for better-auth's rate limiter.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.11" } });

test("build the intro and the respondent fields, see them in the preview", async ({ page, request }) => {
  // Two stories' main paths in one sign-in (E5-1 and E5-2): the flow runs about 30 s on the
  // dev server, so the limit is doubled here (test.setTimeout: node_modules/playwright/types/test.d.ts).
  test.setTimeout(90_000);
  const email = `e2e-build-${Date.now()}@marlow.example`;
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
  const projectUrl = page.url().replace(/\/import$/, "");

  // Build before a list: the empty state points to Import.
  await page.goto(`${projectUrl}/build`);
  await expect(page.getByTestId("build-empty")).toContainText("Import a list first.");
  await page.getByRole("link", { name: "Go to Import" }).click();
  await page.getByRole("button", { name: "Paste a list instead" }).click();
  await page.getByLabel("Paste a list").fill(["Receipts captured by phone | Submitting | Must", "Approval from the notification email | Approving | Must"].join("\n"));
  await page.getByRole("button", { name: "Use this list" }).click();
  await page.getByRole("button", { name: "Import 2 items" }).click();
  await expect(page.getByTestId("imported-line")).toContainText("Imported 2 items as version 1 on");

  // Build opens a draft on version 1 (acceptance 1): the stepper pill, the title, the fields.
  await page.getByRole("navigation", { name: "Steps" }).getByRole("link", { name: /Build/ }).click();
  await expect(page).toHaveURL(/\/build$/);
  await expect(page.getByRole("heading", { name: "Build the instrument" })).toBeVisible();
  // The stepper says Build on the first open, while the draft is being created, and after.
  await expect(page.getByRole("navigation", { name: "Steps" }).locator("[aria-current='step']")).toHaveText(/Build/);
  await expect(page.getByTestId("build-line")).toHaveText("What respondents see, from version 1 of the list. The preview on the right follows every save.");
  await expect(page.getByLabel("Title")).toHaveValue("New expense tool");
  await expect(page.getByTestId("intro-hint")).toHaveText("Write one or two lines so respondents know what the list is for. They see this first.");
  await expect(page.getByTestId("field-row")).toHaveCount(2);
  await expect(page.getByLabel("Label, field 1")).toHaveValue("Name");
  await expect(page.getByLabel("Label, field 2")).toHaveValue("Role");

  // The preview's About you page (acceptance 3): the two fields, Start disabled, the hint.
  const preview = page.getByTestId("about-you");
  await expect(preview.getByRole("heading", { name: "New expense tool" })).toBeVisible();
  await expect(preview.getByLabel("Name")).toBeVisible();
  await expect(preview.getByLabel("Role")).toBeVisible();
  const start = preview.getByTestId("about-you-start");
  await expect(start).toBeDisabled();
  await expect(start).toHaveText("Start with Submitting");
  await expect(start).toHaveCSS("opacity", "0.4");
  await expect(preview.getByTestId("about-you-hint")).toHaveText("Fill in your name and role to start.");

  // The intro, saved and shown in the preview.
  await page.getByRole("textbox", { name: "Intro" }).fill("Six things the new tool should do. Five minutes.");
  await expect(page.getByTestId("intro-hint")).toHaveText("");
  await page.getByTestId("intro-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("intro-form").getByRole("status")).toHaveText("Saved.");
  await expect(preview.getByTestId("about-you-intro")).toHaveText("Six things the new tool should do. Five minutes.");

  // A dropdown field (acceptance 2 and 5): add, type, options, save, see the select.
  await page.getByRole("button", { name: "Add a field" }).click();
  await expect(page.getByTestId("field-row")).toHaveCount(3);
  // Focus lands on the new row's label (design note 38).
  await expect(page.getByLabel("Label, field 3")).toBeFocused();
  await page.getByLabel("Label, field 3").fill("Team");
  await page.getByLabel("Type").nth(2).selectOption("dropdown");
  await page.getByLabel("Options, one per line").fill("Sales\nFinance\nHR");
  await page.getByRole("switch", { name: "Required, Team" }).click();
  await page.getByTestId("fields-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("fields-form").getByRole("status")).toHaveText("Saved.");
  const team = preview.getByLabel("Team");
  await expect(team).toBeVisible();
  await expect(team.locator("option")).toHaveText(["Choose one", "Sales", "Finance", "HR"]);
  // With a third required field the hint names the required fields (decision 0043).
  await expect(preview.getByTestId("about-you-hint")).toHaveText("Fill in the required fields to start.");

  // Start enables once every required field is filled.
  await preview.getByLabel("Name").fill("Ana");
  await preview.getByLabel("Role").fill("Finance");
  await expect(start).toBeDisabled();
  await team.selectOption("Sales");
  await expect(start).toBeEnabled();
  await expect(preview.getByTestId("about-you-hint")).toHaveText("");

  await page.reload();
  await expect(page.getByRole("navigation", { name: "Steps" }).locator("[aria-current='step']")).toHaveText(/Build/);

  // Scoring (stories/E5-2): the Items screen shows the rating row with MoSCoW and the
  // proposed value dashed; switching to 1 to 5 fit changes the pills; a label renames a
  // pill; the proposal switch off removes the dashed marker.
  await page.getByRole("group", { name: "Preview screen" }).getByRole("button", { name: "Items" }).click();
  const chapter = page.getByTestId("chapter-preview");
  await expect(chapter.getByTestId("item-card")).toHaveCount(1);
  const row = chapter.getByTestId("rating-row").first();
  await expect(row.getByRole("radio")).toHaveText(["Must", "Should", "Could", "Not needed", "Unclear"]);
  await expect(row.locator("[data-proposed]")).toHaveText("Must");
  // One tab stop, the arrow keys move and select (the ARIA radio pattern).
  await row.getByRole("radio", { name: "Must" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(row.getByRole("radio", { name: "Should" })).toBeFocused();
  await expect(row.getByRole("radio", { name: "Should" })).toHaveAttribute("aria-checked", "true");
  await expect(chapter.getByTestId("item-card-note").first()).toHaveText("Should");
  await expect(row.getByRole("radio", { name: "Must" })).toHaveAccessibleDescription("proposed");
  // The radio is visually hidden under its card; the card label takes the click.
  await page.getByText("1 to 5 fit", { exact: true }).click();
  await expect(page.getByRole("radio", { name: /1 to 5 fit/ })).toBeChecked();
  await expect(page.getByTestId("scale-labels").getByRole("textbox")).toHaveCount(5);
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await expect(row.getByRole("radio")).toHaveText(["1", "2", "3", "4", "5", "Unclear"]);
  await expect(row).toContainText("no fit");
  await expect(row.locator("[data-proposed]")).toHaveCount(0);
  await page.getByText("MoSCoW", { exact: true }).click();
  await expect(page.getByRole("radio", { name: /MoSCoW/ })).toBeChecked();
  await page.getByLabel("Label for Must").fill("Essential");
  await page.getByRole("switch", { name: "Show the proposed value to respondents" }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await expect(row.getByRole("radio").first()).toHaveText("Essential");
  await expect(row.locator("[data-proposed]")).toHaveCount(0);
  await page.getByRole("switch", { name: "Show the proposed value to respondents" }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await expect(row.locator("[data-proposed]")).toHaveText("Essential");

  // Layouts (stories/E5-3): one item per screen, the single page, back to chapters; none
  // scrolls sideways in the 390 px frame and every pill keeps its 38 px height.
  const frame = page.getByTestId("preview-frame");
  const noSideScroll = async () => expect(await frame.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  const pillsTall = async () => { const hs = await chapter.getByRole("radio").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height)); expect(hs.length).toBeGreaterThan(0); for (const h of hs) expect(h).toBeGreaterThanOrEqual(38); };
  await expect(chapter.getByTestId("chapter-row")).toBeVisible();
  await expect(chapter.getByTestId("chapter-row")).toHaveText("About youSubmittingApprovingWrap up");
  await noSideScroll(); await pillsTall();
  await page.getByText("One item per screen", { exact: true }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await expect(chapter).toHaveAttribute("data-layout", "item");
  await expect(chapter.getByTestId("layout-note")).toHaveText("Item 1 of 1 in Submitting");
  await expect(chapter.getByTestId("item-card")).toHaveCount(1);
  await noSideScroll(); await pillsTall();
  await page.getByText("Single long page", { exact: true }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await expect(chapter).toHaveAttribute("data-layout", "page");
  await expect(chapter.getByTestId("chapter-row")).toHaveCount(0);
  await expect(chapter.getByTestId("layout-note")).toHaveText("All 2 on one page");
  await expect(chapter.getByTestId("item-card")).toHaveCount(2);
  await noSideScroll(); await pillsTall();
  await page.getByText("Chapters", { exact: true }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await expect(chapter.getByTestId("chapter-row")).toBeVisible();
  await page.getByRole("group", { name: "Preview screen" }).getByRole("button", { name: "About you" }).click();

  // Perspectives (stories/E5-4): two names on Build, one item tagged Finance and one Sales
  // on Shape, the respondent who picks Finance sees one item; the one who picks nothing
  // sees none and gets the "nothing to rate" screen.
  await page.getByLabel("Perspectives, one per line").fill("Finance\nSales");
  await page.getByTestId("perspectives-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("perspectives-form").getByRole("status")).toHaveText("Saved.");
  await expect(page.getByTestId("perspectives-tagged")).toContainText("0 of 2 items carry a perspective.");
  await page.getByTestId("perspectives-tagged").getByRole("link", { name: "Go to Shape" }).click();
  await expect(page).toHaveURL(/\/shape$/);
  const firstTags = page.getByTestId("perspective-tags").first();
  await firstTags.getByRole("button", { name: "Finance" }).click();
  await expect(firstTags.getByRole("button", { name: "Finance" })).toHaveAttribute("aria-pressed", "true");
  await expect(firstTags.getByRole("button", { name: "Finance" })).toBeEnabled();
  await page.getByTestId("perspective-tags").nth(1).getByRole("button", { name: "Sales" }).click();
  await expect(page.getByTestId("perspective-tags").nth(1).getByRole("button", { name: "Sales" })).toHaveAttribute("aria-pressed", "true");
  // The pressed state shows at once; the chip is aria-disabled until the server answers.
  await expect(page.getByTestId("perspective-tags").nth(1).getByRole("button", { name: "Sales" })).not.toHaveAttribute("aria-disabled", "true");
  await page.getByRole("navigation", { name: "Steps" }).getByRole("link", { name: /Build/ }).click();
  await expect(page.getByTestId("perspectives-tagged")).toContainText("2 of 2 items carry a perspective.");
  await expect(preview.getByTestId("about-you-perspectives")).toContainText("Which of these describe you?");
  await page.getByRole("group", { name: "Preview screen" }).getByRole("button", { name: "Items" }).click();
  await expect(chapter.getByTestId("nothing-visible")).toBeVisible();
  await expect(chapter.getByTestId("item-card")).toHaveCount(0);
  await page.getByRole("group", { name: "Preview screen" }).getByRole("button", { name: "About you" }).click();
  await preview.getByLabel("Finance").check();
  await page.getByRole("group", { name: "Preview screen" }).getByRole("button", { name: "Items" }).click();
  await expect(chapter.getByTestId("item-card")).toHaveCount(1);
  await expect(chapter).toContainText("0 of 1");
  await page.getByRole("group", { name: "Preview screen" }).getByRole("button", { name: "About you" }).click();

  // Closing (stories/E5-5): focusing the card opens the Wrap up in the preview; the question
  // saved shows there, the missing-item form goes when switched off, confidence is always
  // on and Submit is disabled with the line naming what is still needed.
  const wrapUp = page.getByTestId("wrap-up");
  await page.getByLabel("Closing question, optional").focus();
  await expect(wrapUp).toBeVisible();
  await expect(wrapUp.getByTestId("wrap-up-missing")).toBeVisible();
  await expect(wrapUp.getByTestId("wrap-up-question")).toHaveCount(0);
  await expect(wrapUp.getByTestId("wrap-up-signoff")).toContainText("I confirm these are my answers and they can be shared with the project team.");
  await page.getByLabel("Closing question, optional").fill("What would make this list complete?");
  await page.getByRole("switch", { name: "Ask for missing items" }).click();
  await page.getByLabel("Sign-off text").fill("I confirm these are my answers.");
  await page.getByTestId("closing-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("closing-form").getByRole("status")).toHaveText("Saved.");
  await expect(wrapUp.getByTestId("wrap-up-question")).toContainText("What would make this list complete?");
  await expect(wrapUp.getByTestId("wrap-up-missing")).toHaveCount(0);
  await expect(wrapUp.getByTestId("wrap-up-signoff")).toContainText("I confirm these are my answers.");
  await expect(wrapUp.getByTestId("closing-confidence")).toHaveCount(0);
  await expect(wrapUp.getByRole("radio", { name: "3" })).toBeVisible();
  await expect(wrapUp.getByTestId("wrap-up-submit")).toBeDisabled();
  await expect(wrapUp.getByTestId("wrap-up-note")).toHaveText("Still needed: 1 item, how confident you are, the confirmation.");
  await page.getByRole("group", { name: "Preview screen" }).getByRole("button", { name: "About you" }).click();

  // The sidebar and the project header stay in view while the page scrolls (design note 43).
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const stepperBox = (await page.getByRole("navigation", { name: "Steps" }).boundingBox())!;
  expect(stepperBox.y).toBeGreaterThanOrEqual(0);
  const signOutBox = (await page.getByRole("button", { name: "Sign out" }).boundingBox())!;
  expect(signOutBox.y + signOutBox.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.evaluate(() => window.scrollTo(0, 0));

  // Removing the last field is refused (acceptance 2).
  await page.getByRole("button", { name: "Remove Team" }).click();
  await expect(page.getByRole("button", { name: "Add a field" })).toBeFocused();
  await page.getByRole("button", { name: "Remove Role" }).click();
  await expect(page.getByTestId("field-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Remove Name" }).click();
  await expect(page.getByTestId("field-row")).toHaveCount(1);
  await expect(page.getByTestId("fields-refusal")).toHaveText("Keep at least one field, so you can tell answers apart. Name is the usual one.");

  // The server refuses it too (acceptance 4): the hidden list posted empty.
  await page.getByTestId("fields-form").locator('input[name="fields"]').evaluate((el) => { (el as HTMLInputElement).value = "[]"; });
  await page.getByTestId("fields-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("fields-form").getByRole("alert").last()).toHaveText("Keep at least one field, so you can tell answers apart. Name is the usual one.");
});
