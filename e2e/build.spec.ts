// The main path of E5-1: sign in, create a project, paste a list, open Build (a draft on
// version 1, titled after the project, Name and Role required), see the preview's About you
// page with Start disabled and its hint, add a dropdown field with its options, save, see the
// select with the options in the preview and the hint naming the required fields (decision
// 0043); fill the required fields in the preview and see Start enabled; the scoring card
// (E5-2): the method switch, a label and the proposal switch seen in the preview's chapter
// (E5-6, acceptance 6: switch the method, see the pills change); the three layouts (E5-3)
// with the side-scroll and pill-height checks in the phone preview; two perspectives defined,
// two items tagged on Shape, the picked one narrowing the preview after Start (E5-4); a
// closing question seen on the preview's Wrap up and the missing-item form switched off
// (E5-5); Remove refused on the last field. The preview is the respondent app in an iframe
// (E5-6): it opens on the first chapter and reloads after every save.
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
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  // Naming it seeds the sample project, which can take more than the default 5 seconds on CI.
  await expect(page).toHaveURL(/\/app\/quickstart$/, { timeout: 15_000 });
  // The page stamps quickstart_seen_at while it renders; leaving before it shows can cut that off.
  await expect(page.getByTestId("quickstart")).toBeVisible();
  await page.goto("/app");
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
  await expect(page.getByRole("heading", { name: "Build the validation" })).toBeVisible();
  // The stepper says Build on the first open, while the draft is being created, and after.
  await expect(page.getByRole("navigation", { name: "Steps" }).locator("[aria-current='step']")).toHaveText(/Build/);
  await expect(page.getByTestId("build-line")).toHaveText("This is what respondents see, built from version 1 of the list. The preview on the right follows every save.");
  await expect(page.getByLabel("Title")).toHaveValue("New expense tool");
  await expect(page.getByTestId("intro-hint")).toHaveText("Write one or two lines so respondents know what the list is for. They see this first.");
  await expect(page.getByTestId("field-row")).toHaveCount(2);
  await expect(page.getByLabel("Label, field 1")).toHaveValue("Name");
  await expect(page.getByLabel("Label, field 2")).toHaveValue("Role");
  // The filled pill follows the open page (design note 106): Share while Share is open,
  // Build again on the way back.
  await page.getByRole("navigation", { name: "Steps" }).getByRole("link", { name: /Share/ }).click();
  await expect(page).toHaveURL(/\/share$/);
  await expect(page.getByRole("navigation", { name: "Steps" }).locator("[aria-current='step']")).toHaveText(/Share/);
  await page.getByRole("navigation", { name: "Steps" }).getByRole("link", { name: /Build/ }).click();
  await expect(page).toHaveURL(/\/build$/);
  await expect(page.getByRole("navigation", { name: "Steps" }).locator("[aria-current='step']")).toHaveText(/Build/);

  // The preview (E5-6): the panel, its caption, the phone at true size; the app opens on the
  // first chapter, and its row goes to About you. Every save reloads it.
  const panel = page.getByTestId("preview-panel");
  await expect(panel.getByTestId("preview-caption")).toHaveText("Build changes the rating row, the chapter row, About you and the Wrap up.");
  await panel.getByRole("group", { name: "Device" }).getByRole("button", { name: "Phone" }).click();
  const app = page.frameLocator("[data-testid=preview-iframe]");
  const ready = async () => { await app.locator("[data-ready]").waitFor(); };
  // A save reloads the preview a moment later, so a move inside it is tried again until it
  // holds (expect.toPass: node_modules/playwright/types/test.d.ts).
  const toAbout = () => expect(async () => { await ready(); await app.getByTestId("row-about").click({ timeout: 2_000 }); await expect(app.getByTestId("about-you")).toBeVisible({ timeout: 1_000 }); }).toPass({ timeout: 15_000 });
  // Start in the preview as Ana from Finance, in Sales, with the perspective Finance picked.
  const startAs = () => expect(async () => {
    await ready();
    await app.getByRole("button", { name: "About you" }).first().click({ timeout: 2_000 });
    await preview.getByLabel("Name").fill("Ana", { timeout: 2_000 });
    await preview.getByLabel("Role").fill("Finance");
    await preview.getByLabel("Team").selectOption("Sales");
    await preview.getByLabel("Finance").check();
    await preview.getByTestId("about-you-start").click();
    await expect(app.getByTestId("chapter-screen")).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
  await ready();
  await expect(app.getByTestId("chapter-screen")).toBeVisible();
  await expect(app.getByTestId("preview-note")).toHaveText("Preview: nothing you enter here is saved");
  await toAbout();
  // The preview's About you page (acceptance 3): the two fields, Start disabled, the hint.
  const preview = app.getByTestId("about-you");
  await expect(preview.getByRole("heading", { name: "New expense tool" })).toBeVisible();
  await expect(preview.getByLabel("Name")).toBeVisible();
  await expect(preview.getByLabel("Role")).toBeVisible();
  const start = preview.getByTestId("about-you-start");
  await expect(start).toBeDisabled();
  await expect(start).toHaveText("Start section 1: Submitting");
  await expect(start).toHaveCSS("opacity", "0.4");
  await expect(preview.getByTestId("about-you-hint")).toHaveText("Fill in your name and role to start.");

  // The intro, saved and shown in the preview.
  await page.getByRole("textbox", { name: "Intro" }).fill("Six things the new tool should do. Five minutes.");
  await expect(page.getByTestId("intro-hint")).toHaveText("");
  await page.getByTestId("intro-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("intro-form").getByRole("status")).toHaveText("Saved.");
  await toAbout();
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
  await toAbout();
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
  await page.getByTestId("preview-panel").getByRole("group", { name: "Device" }).getByRole("button", { name: "Phone" }).click();

  // Scoring (stories/E5-2): the chapter shows the rating row with MoSCoW and the proposed
  // value dashed; switching to 1 to 5 fit changes the pills (E5-6, acceptance 6); a label
  // renames a pill; the proposal switch off removes the dashed marker. The panel's compact
  // view shows the chapter row and one card without a ring (decision 0061); the Build step's
  // rings are in the full view.
  await ready();
  const chapter = app.getByTestId("chapter-screen");
  await expect(chapter.getByTestId("item-card")).toHaveCount(1);
  await expect(app.getByTestId("chapter-row")).toBeVisible();
  await expect(app.locator("nav[data-ring]")).toHaveCount(0);
  const row = chapter.getByTestId("rating-row").first();
  await expect(row.getByRole("radio")).toHaveText(["Must", "Should", "Could", "Not needed", "Unclear"]);
  await expect(row.locator("[data-proposed]")).toHaveText("Must");
  // One tab stop, the arrow keys move and select (the ARIA radio pattern).
  await row.getByRole("radio", { name: "Must" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(row.getByRole("radio", { name: "Should" })).toBeFocused();
  await expect(row.getByRole("radio", { name: "Should" })).toHaveAttribute("aria-checked", "true");
  // The preview mirrors the respondent card: a value other than the proposal asks why, in the
  // box (design note 99).
  await expect(chapter.getByTestId("item-card").first()).toHaveAttribute("data-note", "sayWhy");
  await expect(chapter.getByTestId("card-reason").first()).toBeVisible();
  // The proposed pill names its value and "proposed" (E7-7: the caption is in the name).
  await expect(row.getByRole("radio", { name: "Must" })).toHaveAccessibleName("Must, proposed");
  // The radio is visually hidden under its card; the card label takes the click.
  await page.getByText("1 to 5 fit", { exact: true }).click();
  await expect(page.getByRole("radio", { name: /1 to 5 fit/ })).toBeChecked();
  await expect(page.getByTestId("scale-labels").getByRole("textbox")).toHaveCount(5);
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await ready();
  await expect(row.getByRole("radio")).toHaveText(["1", "2", "3", "4", "5", "Unclear"]);
  await expect(row).toContainText("no fit");
  await expect(row.locator("[data-proposed]")).toHaveCount(0);
  await page.getByText("MoSCoW", { exact: true }).click();
  await expect(page.getByRole("radio", { name: /MoSCoW/ })).toBeChecked();
  await page.getByLabel("Label for Must").fill("Essential");
  await page.getByRole("switch", { name: "Show the proposed value to respondents" }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await ready();
  await expect(row.getByRole("radio").first()).toHaveText("Essential");
  await expect(row.locator("[data-proposed]")).toHaveCount(0);
  await page.getByRole("switch", { name: "Show the proposed value to respondents" }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await ready();
  await expect(row.locator("[data-proposed]")).toHaveText("Essential");

  // When a reason is required (stories/E5-2, acceptance 6; design note 98): On every answer
  // makes an agreeing answer ask for a comment, its box open on its own and named as required,
  // with no "+ comment" toggle; back to the default, it closes.
  await page.getByText("On every answer", { exact: true }).click();
  await expect(page.getByRole("radio", { name: /On every answer/ })).toBeChecked();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await expect(page.getByRole("radio", { name: /On every answer/ })).toBeChecked();
  const ruled = chapter.getByTestId("item-card").first();
  // The save reloads the preview a moment later, so the pick is tried again until it holds.
  await expect(async () => {
    await ready();
    await row.getByRole("radio", { name: "Essential, proposed" }).click({ timeout: 2_000 });
    await expect(ruled.getByLabel("Comment, required")).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await expect(ruled).toHaveAttribute("data-note", "sayWhy");
  await expect(ruled.getByRole("button", { name: "+ comment" })).toHaveCount(0);
  await page.getByText("When the answer differs", { exact: true }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await expect(async () => {
    await ready();
    await row.getByRole("radio", { name: "Essential, proposed" }).click({ timeout: 2_000 });
    await expect(ruled).toHaveAttribute("data-note", "pending", { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await expect(ruled.getByTestId("card-comment")).toHaveCount(0);

  // Layouts (stories/E5-3): one item per screen, the single page, back to chapters; none
  // scrolls sideways in the 390 px phone preview and every pill keeps its 38 px height.
  const noSideScroll = async () => expect(await app.locator("html").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  const pillsTall = async () => { const hs = await chapter.getByRole("radio").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height)); expect(hs.length).toBeGreaterThan(0); for (const h of hs) expect(h).toBeGreaterThanOrEqual(38); };
  await expect(app.getByTestId("chapter-row")).toBeVisible();
  await expect(app.getByTestId("chapter-row")).toHaveText(/About you\s*Submitting.*Approving.*Wrap up/);
  await noSideScroll(); await pillsTall();
  await page.getByText("One item per screen", { exact: true }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await ready();
  await expect(chapter).toHaveAttribute("data-layout", "item");
  await expect(chapter.getByTestId("layout-note")).toHaveText("Item 1 of 1 in Submitting");
  await expect(chapter.getByTestId("item-card")).toHaveCount(1);
  await noSideScroll(); await pillsTall();
  await page.getByText("Single long page", { exact: true }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await ready();
  await expect(chapter).toHaveAttribute("data-layout", "page");
  await expect(app.getByTestId("chapter-row")).toHaveCount(0);
  await expect(chapter.getByTestId("layout-note")).toHaveText("All 2 on one page");
  // The compact view keeps one card (decision 0061); the note counts both.
  await expect(chapter.getByTestId("item-card")).toHaveCount(1);
  await expect(chapter.getByTestId("compact-note")).toHaveText("1 of 2 cards. The full view shows them all.");
  await noSideScroll(); await pillsTall();
  await page.getByText("Chapters", { exact: true }).click();
  await page.getByTestId("scoring-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("scoring-form").getByRole("status")).toHaveText("Saved.");
  await ready();
  await expect(app.getByTestId("chapter-row")).toBeVisible();

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
  // Only the first area's card is open on Shape (design note 110); the second item's card
  // opens from its summary when it is closed.
  const secondArea = page.getByTestId("perspective-tags").nth(1).locator("xpath=ancestor::details[1]");
  if (!(await secondArea.evaluate((el) => (el as HTMLDetailsElement).open))) await secondArea.locator("summary").click();
  await page.getByTestId("perspective-tags").nth(1).getByRole("button", { name: "Sales" }).click();
  await expect(page.getByTestId("perspective-tags").nth(1).getByRole("button", { name: "Sales" })).toHaveAttribute("aria-pressed", "true");
  // The pressed state shows at once; the chip is aria-disabled until the server answers.
  await expect(page.getByTestId("perspective-tags").nth(1).getByRole("button", { name: "Sales" })).not.toHaveAttribute("aria-disabled", "true");
  await page.getByRole("navigation", { name: "Steps" }).getByRole("link", { name: /Build/ }).click();
  await expect(page.getByTestId("perspectives-tagged")).toContainText("2 of 2 items carry a perspective.");
  await page.getByTestId("preview-panel").getByRole("group", { name: "Device" }).getByRole("button", { name: "Phone" }).click();
  // The preview opens with no perspective picked: no item to rate.
  await ready();
  await expect(app.getByTestId("nothing-to-rate")).toBeVisible();
  await startAs();
  await expect(chapter.getByTestId("item-card")).toHaveCount(1);
  await expect(app.getByTestId("chapter-row")).toContainText("0/1");

  // Closing (stories/E5-5): the preview's Wrap up; the question saved shows there, the
  // missing-item form goes when switched off, confidence is always on and Submit is
  // disabled (nothing is submitted from a preview, E5-6 acceptance 4).
  const wrapUp = app.getByTestId("wrap-up");
  await app.getByTestId("row-wrap").click();
  await expect(wrapUp).toBeVisible();
  await expect(wrapUp.getByTestId("wrap-up-missing")).toBeVisible();
  await expect(wrapUp.getByTestId("wrap-up-question")).toHaveCount(0);
  await expect(wrapUp.getByTestId("wrap-up-signoff")).toContainText("I confirm these are my answers and they can be shared with the project team.");
  await page.getByLabel("Closing question, optional").fill("What would make this list complete?");
  // The Closing card focused opens the Wrap up in the preview (E5-5, acceptance 3); a control
  // of another card opens the first screen again.
  await expect(page.getByTestId("preview-iframe")).toHaveAttribute("src", /&screen=wrap&compact=1$/);
  await expect(async () => { await ready(); await expect(wrapUp).toBeVisible({ timeout: 1_000 }); }).toPass({ timeout: 15_000 });
  await page.getByRole("switch", { name: "Ask for missing items" }).click();
  await page.getByLabel("Sign-off text").fill("I confirm these are my answers.");
  await page.getByTestId("closing-form").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("closing-form").getByRole("status")).toHaveText("Saved.");
  await page.getByRole("radio", { name: /One item per screen/ }).focus();
  await expect(page.getByTestId("preview-iframe")).not.toHaveAttribute("src", /screen=wrap/);
  await startAs();
  await app.getByTestId("row-wrap").click();
  await expect(wrapUp.getByTestId("wrap-up-question")).toContainText("What would make this list complete?");
  await expect(wrapUp.getByTestId("wrap-up-missing")).toHaveCount(0);
  await expect(wrapUp.getByTestId("wrap-up-signoff")).toContainText("I confirm these are my answers.");
  await expect(page.getByTestId("closing-confidence")).toContainText("Always on");
  await expect(page.getByTestId("closing-confidence").getByRole("switch")).toHaveCount(0);
  await expect(wrapUp.getByTestId("confidence-slider")).toBeVisible();
  // The compact Wrap up has no Submit and no note (decision 0061); e2e/preview.spec.ts proves
  // the preview saves nothing and e2e/respondent-submit.spec.ts proves the Submit rules.
  await expect(wrapUp.getByTestId("wrap-up-submit")).toHaveCount(0);

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
