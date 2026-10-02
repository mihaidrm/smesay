// stories/E3-2: the checks refuse before anything is stored, a good file is stored under the
// workspace's prefix and gets a row with its preview, another workspace cannot read it, and
// picking a sheet or a header row rebuilds the preview from the stored object.
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { projects, uploads, workspaces } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { memoryOutbox } from "@/lib/mail";
import { getObject } from "@/lib/storage";
import { rechoose, rememberedFrom, saveMapping, savePaste, saveUpload, UPLOAD_COPY } from "@/lib/uploads";
import { PASTE_COPY } from "@/lib/import/paste";
import { MAPPING_COPY } from "@/lib/import/mapping";
import { requireWorkspace } from "@/lib/workspace";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const fixture = (name: string) => new Uint8Array(readFileSync(`src/lib/import/fixtures/${name}`));
let a: { ws: WorkspaceId; userId: string }; let b: { ws: WorkspaceId; userId: string }; let projectA: string; let projectB: string;
let signedIn: { id: string; headers: Headers };

// As in src/lib/projects.test.ts: sign in through the handler, then two workspaces of one user.
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
  signedIn = await signIn(`uploads-${stamp}@example.com`);
  const wsA = await requireWorkspace(signedIn.headers, (await workspaces.create({ name: "Uploads A", slug: `uploads-a-${stamp}` }, signedIn.id)).id);
  const wsB = await requireWorkspace(signedIn.headers, (await workspaces.create({ name: "Uploads B", slug: `uploads-b-${stamp}` }, signedIn.id)).id);
  a = { ws: wsA, userId: signedIn.id }; b = { ws: wsB, userId: signedIn.id };
  projectA = (await projects.create(wsA, { name: "List A", createdBy: signedIn.id })).id;
  projectB = (await projects.create(wsB, { name: "List B", createdBy: signedIn.id })).id;
}, 60_000);

const pick = async (...args: Parameters<typeof rechoose>) => {
  const result = await rechoose(...args);
  if ("error" in result) throw new Error(result.error);
  return result.upload;
};

describe("saveUpload", () => {
  it("refuses a file that is not xlsx or csv, before storing anything", async () => {
    const result = await saveUpload(a, projectA, { name: "list.pdf", bytes: new Uint8Array([1, 2, 3]) });
    expect(result).toEqual({ error: UPLOAD_COPY.notSpreadsheet("pdf") });
    expect(await uploads.latestForProject(a.ws, projectA)).toBeNull();
  });
  it("refuses a file over 5 MB with its size and the limit", async () => {
    const result = await saveUpload(a, projectA, { name: "big.csv", bytes: new Uint8Array(5 * 1024 * 1024 + 1) });
    expect(result).toEqual({ error: "This file is 5,121 KB. The limit is 5 MB. Remove sheets or columns you do not need and upload again." });
    expect(UPLOAD_COPY.tooBig(7 * 1024 * 1024)).toContain("This file is 7 MB.");
  });
  it("refuses a csv with over 2,000 data rows", async () => {
    const text = "Ref,Requirement\n" + Array.from({ length: 2001 }, (_, i) => `R-${i},Requirement number ${i} with some text`).join("\n");
    const result = await saveUpload(a, projectA, { name: "long.csv", bytes: new TextEncoder().encode(text) });
    expect(result).toEqual({ error: "This file has 2,001 rows. The limit is 2,000. Split the list and upload the first part." });
    const ok = await saveUpload(a, projectA, { name: "edge.csv", bytes: new TextEncoder().encode(text.split("\n").slice(0, 2001).join("\n")) });
    expect("upload" in ok && ok.upload.preview.rowsRead).toBe(2000);
    // "No header row" would make 2,001 rows: refused, the stored choice stays.
    const none = await rechoose(a.ws, (ok as { upload: { id: string } }).upload.id, { headerRow: 0 });
    expect(none).toEqual({ error: "This file has 2,001 rows. The limit is 2,000. Split the list and upload the first part." });
    expect((await uploads.get(a.ws, (ok as { upload: { id: string } }).upload.id))?.headerRow).toBe(1);
  });
  it("checks every sheet of a workbook, not only the first", async () => {
    const result = await saveUpload(a, projectA, { name: "big-sheet.xlsx", bytes: fixture("big-second-sheet.xlsx") });
    expect(result).toEqual({ error: "Sheet Big has 2,001 rows. The limit is 2,000. Split the list and upload the first part." });
  });
  it("refuses the sample project and a project of another workspace", async () => {
    const sample = (await projects.list(a.ws)).find((p) => p.isSample);
    expect(sample).toBeUndefined();
    const ws = await createWorkspaceWithSample({ name: "With sample", slug: `with-sample-${Date.now()}` }, a.userId);
    const sampleProject = (await projects.list(ws.id as WorkspaceId)).find((p) => p.isSample)!;
    expect(await saveUpload({ ws: ws.id as WorkspaceId, userId: a.userId }, sampleProject.id, { name: "clean.csv", bytes: fixture("clean.csv") })).toEqual({ error: UPLOAD_COPY.sample });
    await expect(saveUpload(b, projectA, { name: "clean.csv", bytes: fixture("clean.csv") })).rejects.toBeInstanceOf(NotFoundError);
    expect((await uploads.list(b.ws)).filter((u) => u.projectId === projectA)).toHaveLength(0);
  });
  it("refuses a file that is not a workbook", async () => {
    const result = await saveUpload(a, projectA, { name: "fake.xlsx", bytes: new TextEncoder().encode("%PDF-1.4") });
    expect(result).toEqual({ error: UPLOAD_COPY.unreadable });
  });
  it("stores a good file under the workspace prefix and keeps the preview", async () => {
    const result = await saveUpload(a, projectA, { name: "expense-requirements.xlsx", bytes: fixture("title-row.xlsx") });
    if (!("upload" in result)) throw new Error(result.error);
    const { upload } = result;
    expect(upload.objectKey).toMatch(new RegExp(`^uploads/${a.ws}/[0-9a-f]{16}\\.xlsx$`));
    expect((await getObject(upload.objectKey))?.body.byteLength).toBe(fixture("title-row.xlsx").byteLength);
    expect(upload.kind).toBe("xlsx");
    expect(upload.headerRow).toBe(3);
    expect(upload.preview.columns.map((c) => `${c.letter} ${c.name}`)).toEqual(["A Ref", "B Requirement", "C Module", "D Priority"]);
    expect(upload.preview.rows).toHaveLength(6);
    expect(upload.preview.rowsRead).toBe(6);
    expect(UPLOAD_COPY.summary(upload.filename, upload.preview.rowsRead, upload.headerRow)).toBe("expense-requirements.xlsx, 6 rows read, header found on row 3.");
    expect((await uploads.latestForProject(a.ws, projectA))?.id).toBe(upload.id);
    expect(await uploads.get(b.ws, upload.id)).toBeNull();
    expect(await uploads.latestForProject(b.ws, projectA)).toBeNull();
    await expect(rechoose(b.ws, upload.id, { headerRow: 1 })).rejects.toBeInstanceOf(NotFoundError);
  });
  it("a file without a header asks for the picker, and the picked row rebuilds the preview", async () => {
    const result = await saveUpload(b, projectB, { name: "no-header.csv", bytes: fixture("no-header.csv") });
    if (!("upload" in result)) throw new Error(result.error);
    expect(result.upload.headerRow).toBeNull();
    expect(result.upload.preview.columns.map((c) => c.name)).toEqual(["", "", "", ""]);
    expect(result.upload.preview.rowsRead).toBe(6);
    const chosen = await pick(b.ws, result.upload.id, { headerRow: 1 });
    expect(chosen.headerRow).toBe(1);
    expect(chosen.preview.columns.map((c) => c.name)).toEqual(["CL-01", "OCR receipt capture via mobile (auto-fill amt/date/vendor).", "Submitting", "Must"]);
    expect(chosen.preview.rowsRead).toBe(5);
    const none = await pick(b.ws, result.upload.id, { headerRow: 0 });
    expect(none.headerRow).toBeNull();
    expect(none.preview.rowsRead).toBe(6);
  });
  it("a workbook with several sheets picks the first with rows, and the PM can pick another", async () => {
    const result = await saveUpload(b, projectB, { name: "two-sheets.xlsx", bytes: fixture("two-sheets.xlsx") });
    if (!("upload" in result)) throw new Error(result.error);
    expect(result.upload.preview.sheets).toEqual(["Notes", "Requirements", "Old"]);
    expect(result.upload.sheet).toBe("Notes");
    expect(result.upload.headerRow).toBeNull();
    const chosen = await pick(b.ws, result.upload.id, { sheet: "Requirements" });
    expect(chosen.sheet).toBe("Requirements");
    expect(chosen.headerRow).toBe(1);
    expect(chosen.preview.rowsRead).toBe(6);
  });

  it("guesses the mapping from the headers, saves changes and remembers them for the same headers (stories/E3-3)", async () => {
    // A workspace of its own, so no earlier upload in this file has remembered these headers.
    const wsC = await requireWorkspace(signedIn.headers, (await workspaces.create({ name: "Uploads C", slug: `uploads-c-${Date.now()}` }, signedIn.id)).id);
    const c = { ws: wsC, userId: signedIn.id };
    const projectC = (await projects.create(wsC, { name: "List C", createdBy: signedIn.id })).id;
    const first = await saveUpload(c, projectC, { name: "first.xlsx", bytes: fixture("title-row.xlsx") });
    if (!("upload" in first)) throw new Error(first.error);
    expect(first.upload.mapping).toEqual({ Ref: "ref", Requirement: "text", Module: "area", Priority: "value" });
    expect(await rememberedFrom(c.ws, first.upload)).toBeNull();
    // The guess is remembered at once (it has a text column), so a PM who accepts it finds it.
    const sameAgain = await saveUpload(c, projectC, { name: "again.xlsx", bytes: fixture("title-row.xlsx") });
    expect("upload" in sameAgain && (await rememberedFrom(c.ws, sameAgain.upload))).not.toBeNull();
    const changed = await saveMapping(c.ws, first.upload.id, { "Ref": "ref", "Requirement": "skip", "Module": "custom", "Priority": "value" });
    expect(changed.error).toBe(MAPPING_COPY.noText);
    expect(changed.upload.mapping).toEqual({ Ref: "ref", Requirement: "skip", Module: "custom", Priority: "value" });
    // A mapping without a text column is kept on the upload but not remembered.
    const afterBad = await saveUpload(c, projectC, { name: "after-bad.xlsx", bytes: fixture("title-row.xlsx") });
    expect("upload" in afterBad && afterBad.upload.mapping).toEqual({ Ref: "ref", Requirement: "text", Module: "area", Priority: "value" });
    const fixed = await saveMapping(c.ws, first.upload.id, { "Ref": "ref", "Requirement": "text", "Module": "custom", "Priority": "value" });
    expect(fixed.error).toBeNull();
    // The same headers in a csv, in another order: the remembered mapping applies.
    const second = await saveUpload(c, projectC, { name: "second.csv", bytes: new TextEncoder().encode("Priority,Module,Requirement,Ref\nMust,Paying,Pay people on time with the right amount,CL-9\nShould,Paying,Export the payment file,CL-10\n") });
    if (!("upload" in second)) throw new Error(second.error);
    expect(second.upload.mapping).toEqual({ Priority: "value", Module: "custom", Requirement: "text", Ref: "ref" });
    expect(await rememberedFrom(c.ws, second.upload)).not.toBeNull();
    // Another workspace has its own memory.
    const theirs = await saveUpload(b, projectB, { name: "theirs.xlsx", bytes: fixture("title-row.xlsx") });
    if (!("upload" in theirs)) throw new Error(theirs.error);
    expect(theirs.upload.mapping).toEqual({ Ref: "ref", Requirement: "text", Module: "area", Priority: "value" });
    await expect(saveMapping(b.ws, first.upload.id, { Ref: "text" })).rejects.toBeInstanceOf(NotFoundError);
    // B's save leaves C's memory untouched.
    await saveMapping(b.ws, theirs.upload.id, { Ref: "skip", Requirement: "text", Module: "skip", Priority: "skip" });
    const cAgain = await saveUpload(c, projectC, { name: "c-again.xlsx", bytes: fixture("title-row.xlsx") });
    expect("upload" in cAgain && cAgain.upload.mapping).toEqual({ Ref: "ref", Requirement: "text", Module: "custom", Priority: "value" });
  });

  it("stores a pasted list as text with three columns and no pickers (stories/E3-4)", async () => {
    expect(await savePaste(a, projectA, "Only one line")).toEqual({ error: PASTE_COPY.tooFew });
    const result = await savePaste(a, projectA, "1. Receipts by phone | Submitting | Must\n2. Approve from email | Approving\n- Pay by payroll\n\n\u2022 Travel advances\n5) Per diems\n6) Mileage from addresses\n");
    if (!("upload" in result)) throw new Error(result.error);
    const { upload } = result;
    expect(upload.kind).toBe("pasted");
    expect(upload.filename).toBe("Pasted list");
    expect(upload.objectKey).toMatch(new RegExp(`^uploads/${a.ws}/[0-9a-f]{16}\\.txt$`));
    expect(new TextDecoder().decode((await getObject(upload.objectKey))!.body)).toContain("1. Receipts by phone");
    expect(upload.preview.columns.map((c) => c.name)).toEqual(["Item", "Area", "Proposed value"]);
    expect(upload.preview.headerRow).toBeNull();
    expect(upload.preview.rowsRead).toBe(6);
    expect(upload.preview.rows[0]).toEqual(["Receipts by phone", "Submitting", "Must"]);
    expect(upload.preview.rows[2]).toEqual(["Pay by payroll", "", ""]);
    expect(upload.mapping).toEqual({ Item: "text", Area: "area", "Proposed value": "value" });
    expect(PASTE_COPY.summary(upload.preview.rowsRead)).toBe("Pasted list, 6 items.");
    const long = await savePaste(a, projectA, Array.from({ length: 2001 }, (_, i) => `Item ${i}`).join("\n"));
    expect(long).toEqual({ error: "This file has 2,001 rows. The limit is 2,000. Split the list and upload the first part." });
  });
});
