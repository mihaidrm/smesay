// The main path of E10-3: Summary for the deck downloads the sample as a PDF with its page
// count; then a generated project of 200 items and 50 submitted responses, imported through
// Import a project (E10-2), renders its summary in under 10 seconds (acceptance 2), timed from
// the request to the last byte; with each register stopped at 20 rows (decision 0048) it fits
// 30 pages, so the Export tab shows no note.
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { latestLink } from "./mailpit";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.53" } });

const KINDS = ["agree", "agree", "agree", "change", "disagree", "unclear"] as const;

test("download the summary PDF, and render 200 items and 50 responses under 10 seconds", async ({ page, request }) => {
  test.setTimeout(120_000);
  const email = `e2e-summary-${Date.now()}@marlow.example`;
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
  const href = await page.getByRole("link", { name: /Sample project/ }).first().getAttribute("href");
  const id = href!.match(/projects\/([0-9a-f-]{36})/)![1];

  // The sample's summary.
  await page.goto(`/app/projects/${id}/results?unsubmitted=0&tab=export`);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export-summary-download").click()]);
  expect(download.suggestedFilename()).toMatch(/^Sample-project-summary-\d{4}-\d{2}-\d{2}\.pdf$/);
  const sample = await page.request.get(`/api/projects/${id}/export/summary?unsubmitted=0`);
  expect(sample.headers()["content-type"]).toBe("application/pdf");
  expect((await sample.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  expect(Number(sample.headers()["x-summary-pages"])).toBeGreaterThanOrEqual(3);
  await expect(page.getByTestId("export-summary-download-pages")).toHaveCount(0);

  // A generated project: the sample's file with 200 items in 5 areas and 50 submitted responses
  // answering every item, imported as a PM's project.
  const file = await (await page.request.get(`/api/projects/${id}/export/project`)).json();
  const instrument = file.instruments[0];
  const set = file.itemSets.find((s: { id: string }) => s.id === instrument.itemSetId);
  const areas = ["Submitting", "Approving", "Paying", "Reporting", "Admin"];
  const items = Array.from({ length: 200 }, (_, i) => ({ ...set.items[0], id: randomUUID(), position: i + 1, sourceRef: `GEN-${String(i + 1).padStart(3, "0")}`, originalText: `Generated requirement ${i + 1}: the tool records the expense with its receipt.`, readerText: null, readerStatus: null, area: areas[i % 5], perspectives: [] }));
  const invite = file.invites.find((v: { kind: string }) => v.kind === "public");
  const at = "2026-10-09T16:30:00.000Z";
  const responses = Array.from({ length: 50 }, (_, r) => ({
    id: randomUUID(), instrumentId: instrument.id, itemSetId: set.id, inviteId: invite.id, fields: { name: `Person ${r + 1}`, role: ["Sales", "Finance", "HR", "Engineering manager", "Office manager"][r % 5] }, perspectives: [],
    confidence: 1 + (r % 5), signedOff: true, submittedAt: at, firstSubmittedAt: at, closingAnswer: null, signOffText: null, createdAt: at, updatedAt: at,
    answers: items.map((it, i) => { const kind = KINDS[(r + i) % KINDS.length]; return { id: randomUUID(), itemId: it.id, kind, value: kind === "change" ? "M" : null, reason: kind === "agree" ? null : "Because the receipt is often missing.", comment: null, updatedAt: at }; }),
  }));
  const generated = { ...file, sample: false, note: null, project: { ...file.project, name: "Generated 200" }, itemSets: [{ ...set, areas: areas.map((name) => ({ name, rationale: "" })), items }], instruments: [instrument], invites: [invite], responses, missingItems: [], insights: [] };
  await page.goto("/app/projects/import");
  await page.getByLabel("Project file (.json)").setInputFiles({ name: "generated.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(generated)) });
  await page.getByTestId("import-project").click();
  await expect(page.getByTestId("import-error")).toHaveCount(0);
  await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]{36}\/results(\?.*)?$/, { timeout: 30_000 });
  const generatedId = page.url().match(/projects\/([0-9a-f-]{36})/)![1];

  const started = Date.now();
  const pdf = await page.request.get(`/api/projects/${generatedId}/export/summary?unsubmitted=0`, { timeout: 30_000 });
  const body = await pdf.body();
  const elapsed = Date.now() - started;
  console.log(`summary of 200 items and 50 responses: ${elapsed} ms, ${pdf.headers()["x-summary-pages"]} pages, ${body.length} bytes`);
  expect(pdf.status()).toBe(200);
  expect(elapsed).toBeLessThan(10_000);

  // Each register stops at 20 rows (decision 0048), so the generated case fits the 30 pages a
  // deck takes and the Export tab shows no note; the note over the limit is
  // export-download.test.ts's.
  expect(Number(pdf.headers()["x-summary-pages"])).toBeLessThanOrEqual(30);
  await page.goto(`/app/projects/${generatedId}/results?unsubmitted=0&tab=export`);
  await Promise.all([page.waitForEvent("download", { timeout: 30_000 }), page.getByTestId("export-summary-download").click()]);
  await expect(page.getByTestId("export-summary-download-pages")).toHaveCount(0);
});
