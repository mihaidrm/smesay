// stories/E3-5: the check over a stored upload with its mapping, and the commit writing the
// set with the same report; another workspace refused.
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { items, projects, workspaces } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { checkUpload, commitUpload, IMPORT_COPY, importLog, latestSet, sheetsError } from "@/lib/imports";
import { memoryOutbox } from "@/lib/mail";
import { chooseSheets, rechoose, savePaste, saveUpload, saveMapping, UPLOAD_COPY } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let a: { ws: WorkspaceId; userId: string }; let b: { ws: WorkspaceId; userId: string }; let projectA: string;

async function signIn(email: string) {
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, headers };
}

beforeAll(async () => {
  await prepareTestDatabase();
  const stamp = Date.now();
  const signedIn = await signIn(`imports-${stamp}@example.com`);
  const wsA = await requireWorkspace(signedIn.headers, (await workspaces.create({ name: "Imports A", slug: `imports-a-${stamp}` }, signedIn.id)).id);
  const wsB = await requireWorkspace(signedIn.headers, (await workspaces.create({ name: "Imports B", slug: `imports-b-${stamp}` }, signedIn.id)).id);
  a = { ws: wsA, userId: signedIn.id }; b = { ws: wsB, userId: signedIn.id };
  projectA = (await projects.create(wsA, { name: "List A", createdBy: signedIn.id })).id;
}, 60_000);

describe("checkUpload and commitUpload", () => {
  it("checks the whole stored file, then commits the set with the same report", async () => {
    const csv = ["Ref,Requirement,Module,Priority", "CL-01,OCR receipt capture,Submitting,Must", ",,,", "CL-02,  OCR  receipt capture,Submitting,M", "CL-03,Approve from email,Approving,High", "CL-04,Pay by payroll,Paying,Should"].join("\n");
    const saved = await saveUpload(a, projectA, { name: "list.csv", bytes: new TextEncoder().encode(csv) });
    if (!("upload" in saved)) throw new Error(saved.error);
    const check = await checkUpload(saved.upload);
    expect(check?.report).toMatchObject({ rowsRead: 5, headerRow: 1, emptyRows: 1, exactDuplicates: 1, overLimit: 0, unrecognisedValues: 1, duplicateRefs: [{ kept: "CL-01", folded: ["CL-02"] }] });
    expect(check?.items.map((i) => i.text)).toEqual(["OCR receipt capture", "Approve from email", "Pay by payroll"]);
    expect(IMPORT_COPY.counts(check!.report)).toEqual({ empty: "1 empty row was skipped.", duplicates: "1 exact duplicate was imported once.", long: "0 items are over 1,000 characters and were imported whole; consider splitting them in Shape.", values: "1 proposed value was not recognised and is kept as written." });
    expect(await latestSet(a.ws, projectA)).toBeNull();
    const committed = await commitUpload(a.ws, saved.upload.id, a.userId);
    if (!("set" in committed)) throw new Error(committed.error);
    expect(committed.set).toMatchObject({ version: 1, source: "csv", sourceFilename: "list.csv", uploadId: saved.upload.id, importedBy: a.userId });
    expect(committed.set.importReport).toEqual(check!.report);
    const rows = (await items.list(a.ws)).filter((i) => i.itemSetId === committed.set.id).sort((x, y) => x.position - y.position);
    expect(rows.map((r) => [r.sourceRef, r.originalText, r.area, r.proposedValue])).toEqual([["CL-01", "OCR receipt capture", "Submitting", "Must"], ["CL-03", "Approve from email", "Approving", "High"], ["CL-04", "Pay by payroll", "Paying", "Should"]]);
    expect((await latestSet(a.ws, projectA))?.id).toBe(committed.set.id);
    expect(rows[0].flags).toEqual({ foldedRefs: ["CL-02"] });
    expect(rows[1].flags).toBeNull();
    await expect(commitUpload(b.ws, saved.upload.id, b.userId)).rejects.toBeInstanceOf(NotFoundError);
    // The same upload is imported once (audit finding 1): a replayed form is refused.
    expect(await commitUpload(a.ws, saved.upload.id, a.userId)).toEqual({ error: IMPORT_COPY.already(1) });
    expect((await importLog(a.ws, projectA)).versions).toHaveLength(1);
    expect((await importLog(b.ws, projectA)).versions).toHaveLength(0);
  });
  it("refuses without a text column and with nothing to import; a pasted list commits as pasted with version 2", async () => {
    const pasted = await savePaste(a, projectA, "One thing\nAnother thing | Paying | Must");
    if (!("upload" in pasted)) throw new Error(pasted.error);
    await saveMapping(a.ws, pasted.upload.id, { Item: "skip", Area: "area", "Proposed value": "value" });
    const noText = await commitUpload(a.ws, pasted.upload.id, a.userId);
    expect("error" in noText && noText.error).toContain("Pick the column that holds the requirement text.");
    await saveMapping(a.ws, pasted.upload.id, { Item: "text", Area: "area", "Proposed value": "value" });
    const committed = await commitUpload(a.ws, pasted.upload.id, a.userId);
    expect("set" in committed && [committed.set.version, committed.set.source, committed.set.sourceFilename]).toEqual([2, "pasted", null]);
    // The text column mapped to a column that is empty on every row: nothing to import.
    const emptyText = await saveUpload(a, projectA, { name: "empty.csv", bytes: new TextEncoder().encode("Ref,Requirement,Notes\nCL-01,OCR receipt capture by phone,\nCL-02,Approval from the notification email,\n") });
    if (!("upload" in emptyText)) throw new Error(emptyText.error);
    await saveMapping(a.ws, emptyText.upload.id, { Ref: "ref", Requirement: "skip", Notes: "text" });
    expect(await commitUpload(a.ws, emptyText.upload.id, a.userId)).toEqual({ error: IMPORT_COPY.nothing });
  });
});

// stories/E3-7, acceptance 7: two sheets of the two-sheets fixture ticked, the mapping over
// their union, a sheet without the text column refused, the sheet names as areas, then the
// commit in sheet order with the folded duplicates and the per-sheet report.
describe("several sheets", () => {
  it("imports two sheets as one version, in sheet order then row order", async () => {
    const bytes = new Uint8Array(readFileSync("src/lib/import/fixtures/two-sheets.xlsx"));
    const saved = await saveUpload(a, projectA, { name: "two-sheets.xlsx", bytes });
    if (!("upload" in saved)) throw new Error(saved.error);
    expect(saved.upload.sheets).toBeNull();
    expect(saved.upload.preview.sheetRows).toEqual([{ name: "Notes", rows: 1 }, { name: "Requirements", rows: 7 }, { name: "Old", rows: 3 }]);
    // Notes has no header, so its one column is "A" and the text column is not there.
    const withNotes = await chooseSheets(a.ws, saved.upload.id, ["Requirements", "Notes"]);
    if (!("upload" in withNotes)) throw new Error(withNotes.error);
    expect(withNotes.upload.sheets).toEqual([{ name: "Notes" }, { name: "Requirements" }]);
    expect(withNotes.upload.preview.columns.map((c) => c.name)).toEqual(["", "Ref", "Requirement", "Module", "Priority"]);
    expect(sheetsError(withNotes.upload)).toBe("Sheet Notes has no column Requirement. Untick it, or map the item text to a column every ticked sheet has.");
    expect(await checkUpload(withNotes.upload)).toBeNull();
    expect(await commitUpload(a.ws, saved.upload.id, a.userId)).toEqual({ error: sheetsError(withNotes.upload) });
    expect(await chooseSheets(a.ws, saved.upload.id, [])).toEqual({ error: UPLOAD_COPY.noSheet });
    await expect(chooseSheets(b.ws, saved.upload.id, ["Old"])).rejects.toBeInstanceOf(NotFoundError);

    const two = await chooseSheets(a.ws, saved.upload.id, ["Old", "Requirements"]);
    if (!("upload" in two)) throw new Error(two.error);
    expect(two.upload.sheets).toEqual([{ name: "Requirements" }, { name: "Old" }]);
    expect(two.upload.preview.perSheet?.map((s) => [s.name, s.headerRow, s.rowsRead])).toEqual([["Requirements", 1, 6], ["Old", 1, 2]]);
    expect(two.upload.preview.rowsRead).toBe(8);
    expect(two.upload.mapping).toEqual({ Ref: "ref", Requirement: "text", Module: "area", Priority: "value" });
    expect(sheetsError(two.upload)).toBeNull();
    // The area column wins; the duplicates on Old fold into Requirements.
    const check = await checkUpload(two.upload);
    expect(check?.items.map((i) => [i.sheet, i.ref, i.area])).toEqual([["Requirements", "CL-01", "Submitting"], ["Requirements", "CL-02", "Submitting"], ["Requirements", "CL-03", "Approving"], ["Requirements", "CL-04", "Approving"], ["Requirements", "CL-05", "Paying"], ["Requirements", "CL-06", "Paying"]]);
    expect(check?.report.sheets).toEqual([
      { name: "Requirements", rowsRead: 6, headerRow: 1, items: 6, emptyRows: 0, exactDuplicates: 0, overLimit: 0, unrecognisedValues: 0 },
      { name: "Old", rowsRead: 2, headerRow: 1, items: 0, emptyRows: 0, exactDuplicates: 2, overLimit: 0, unrecognisedValues: 0 },
    ]);
    expect(check?.sheets?.[1].duplicateRows).toEqual([{ row: 2, keptRow: 2, keptSheet: "Requirements" }, { row: 3, keptRow: 3, keptSheet: "Requirements" }]);
    // No area column: the sheet names stand in while the switch is on.
    const noArea = await saveMapping(a.ws, saved.upload.id, { Ref: "ref", Requirement: "text", Module: "skip", Priority: "value" });
    expect(noArea.upload.sheetAreas).toBe(true);
    expect((await checkUpload(noArea.upload))?.items.map((i) => i.area)).toEqual(["Requirements", "Requirements", "Requirements", "Requirements", "Requirements", "Requirements"]);
    const off = await saveMapping(a.ws, saved.upload.id, { Ref: "ref", Requirement: "text", Module: "skip", Priority: "value" }, false);
    expect(off.upload.sheetAreas).toBe(false);
    expect((await checkUpload(off.upload))?.items.every((i) => i.area === null)).toBe(true);
    // A header row picked for one sheet lands on that sheet alone.
    const picked = await rechoose(a.ws, saved.upload.id, { sheet: "Old", headerRow: 0 });
    if (!("upload" in picked)) throw new Error(picked.error);
    expect(picked.upload.sheets).toEqual([{ name: "Requirements" }, { name: "Old", headerRow: 0 }]);
    expect(picked.upload.preview.perSheet?.map((s) => [s.name, s.headerRow, s.rowsRead])).toEqual([["Requirements", 1, 6], ["Old", null, 3]]);
    const back = await rechoose(a.ws, saved.upload.id, { sheet: "Old", headerRow: 1 });
    if (!("upload" in back)) throw new Error(back.error);
    await saveMapping(a.ws, saved.upload.id, { Ref: "ref", Requirement: "text", Module: "skip", Priority: "value" }, true);

    const committed = await commitUpload(a.ws, saved.upload.id, a.userId);
    if (!("set" in committed)) throw new Error(committed.error);
    expect(committed.set.source).toBe("xlsx");
    expect(committed.set.importReport?.sheets?.map((s) => s.name)).toEqual(["Requirements", "Old"]);
    expect(committed.set.importReport).toMatchObject({ rowsRead: 8, exactDuplicates: 2, duplicateRefs: [{ kept: "CL-01", folded: ["CL-01"] }, { kept: "CL-02", folded: ["CL-02"] }] });
    const rows = (await items.list(a.ws)).filter((i) => i.itemSetId === committed.set.id).sort((x, y) => x.position - y.position);
    expect(rows.map((r) => [r.position, r.sourceRef, r.area])).toEqual([[1, "CL-01", "Requirements"], [2, "CL-02", "Requirements"], [3, "CL-03", "Requirements"], [4, "CL-04", "Requirements"], [5, "CL-05", "Requirements"], [6, "CL-06", "Requirements"]]);
    expect(rows[0].flags).toEqual({ foldedRefs: ["CL-01"] });
    expect((await importLog(a.ws, projectA)).versions[0].importReport?.sheets).toHaveLength(2);
  });
});
