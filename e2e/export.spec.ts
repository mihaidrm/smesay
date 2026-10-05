// The main path of E10-1 on the sample: the Export tab lists the four files; Answers downloads
// as a CSV with the byte order mark, the watermark line and the header, and a row per answer; a
// filtered page's link carries the filter and the file names it; a failed download says so; a
// member of another workspace gets 404 and a request from another site 403.
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.51" } });

test("export the answers as CSV, with the page's filter", async ({ page, request, browser, baseURL }) => {
  test.setTimeout(90_000);
  const email = `e2e-export-${Date.now()}@marlow.example`;
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
  const href = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  const id = href!.match(/projects\/([0-9a-f-]{36})/)![1];

  await page.goto(`/app/projects/${id}/results?unsubmitted=0&tab=export`);
  await expect(page.getByTestId("export-tab")).toBeVisible();
  for (const f of ["answers", "items", "people", "missing"]) await expect(page.getByTestId(`export-${f}-download`)).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export-answers-download").click()]);
  expect(download.suggestedFilename()).toMatch(/^Sample-project-answers-\d{4}-\d{2}-\d{2}\.csv$/);
  const text = await (await page.request.get((await page.getByTestId("export-answers-download").getAttribute("href"))!)).text();
  expect(text.charCodeAt(0)).toBe(0xfeff);
  const lines = text.slice(1).split("\r\n");
  expect(lines[0]).toBe('"Sample data, invented"');
  expect(lines[1]).toMatch(/^"Respondent","Name","Role",.*"Reference","Area","Item","Proposed value","Proposed label","Answer"/);
  // 30 answers from the submitted responses (src/db/seed/sample.ts expected.submittedAnswers).
  expect(lines.filter((l) => l.length > 0).length - 2).toBe(30);

  // A filtered page exports what it shows.
  await page.goto(`/app/projects/${id}/results?unsubmitted=0&kind=disagree&tab=export`);
  const filtered = await page.getByTestId("export-answers-download").getAttribute("href");
  expect(filtered).toContain("kind=disagree");
  const ftext = await (await page.request.get(filtered!)).text();
  const flines = ftext.slice(1).split("\r\n").filter((l) => l.length > 0);
  expect(flines[1]).toBe('"Filtered: Disagree"');
  // The answer filter keeps the people who gave such an answer, with all their answers, as
  // Results does; the file's Disagree rows are the page's 2.
  expect(flines.filter((l) => l.includes(',"Disagree",')).length).toBe(2);

  // A request another site starts gets 403.
  expect((await page.request.get(filtered!, { headers: { "sec-fetch-site": "cross-site" } })).status()).toBe(403);

  // A download the route refuses shows the error under its card.
  await page.route("**/export/people*", (route) => route.fulfill({ status: 500, body: "" }));
  await page.getByTestId("export-people-download").click();
  await expect(page.getByTestId("export-people-download-error")).toHaveText("The CSV export did not finish. Try again; if it fails again, reload the page and export again.");
  await page.unroute("**/export/people*");

  // A member of another workspace cannot read this project's files.
  const other = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": "10.0.0.52" } });
  const page2 = await other.newPage();
  const email2 = `e2e-export-b-${Date.now()}@marlow.example`;
  await page2.goto("/sign-in");
  await page2.getByLabel("Email").fill(email2);
  await page2.getByRole("button", { name: "Send me a link" }).click();
  await expect(page2.getByRole("status")).toBeVisible();
  await page2.goto(await latestLink(request, email2));
  await page2.getByLabel("Workspace name").fill("Other Group");
  await page2.getByRole("button", { name: "Create workspace" }).click();
  // Naming the first workspace opens the quickstart once (stories/E12-2).
  await expect(page2).toHaveURL(/\/app\/quickstart$/);
  await page2.goto("/app");
  await expect(page2).toHaveURL(/\/app$/);
  for (const f of ["answers", "items", "people", "missing"]) expect((await page2.request.get(`/api/projects/${id}/export/${f}`)).status()).toBe(404);
  await other.close();
});
