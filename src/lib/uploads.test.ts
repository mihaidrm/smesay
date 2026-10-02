// stories/E3-2: the checks refuse before anything is stored, a good file is stored under the
// workspace's prefix and gets a row with its preview, another workspace cannot read it, and
// picking a sheet or a header row rebuilds the preview from the stored object.
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { projects, uploads, workspaces } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { memoryOutbox } from "@/lib/mail";
import { getObject } from "@/lib/storage";
import { rechoose, saveUpload, UPLOAD_COPY } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const fixture = (name: string) => new Uint8Array(readFileSync(`src/lib/import/fixtures/${name}`));
let a: { ws: WorkspaceId; userId: string }; let b: { ws: WorkspaceId; userId: string }; let projectA: string; let projectB: string;

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
  const me = await signIn(`uploads-${stamp}@example.com`);
  const wsA = await requireWorkspace(me.headers, (await workspaces.create({ name: "Uploads A", slug: `uploads-a-${stamp}` }, me.id)).id);
  const wsB = await requireWorkspace(me.headers, (await workspaces.create({ name: "Uploads B", slug: `uploads-b-${stamp}` }, me.id)).id);
  a = { ws: wsA, userId: me.id }; b = { ws: wsB, userId: me.id };
  projectA = (await projects.create(wsA, { name: "List A", createdBy: me.id })).id;
  projectB = (await projects.create(wsB, { name: "List B", createdBy: me.id })).id;
}, 60_000);

describe("saveUpload", () => {
  it("refuses a file that is not xlsx or csv, before storing anything", async () => {
    const result = await saveUpload(a, projectA, { name: "list.pdf", bytes: new Uint8Array([1, 2, 3]) });
    expect(result).toEqual({ error: UPLOAD_COPY.notSpreadsheet("pdf") });
    expect(await uploads.latestForProject(a.ws, projectA)).toBeNull();
  });
  it("refuses a file over 5 MB with its size and the limit", async () => {
    const result = await saveUpload(a, projectA, { name: "big.csv", bytes: new Uint8Array(5 * 1024 * 1024 + 1) });
    expect(result).toEqual({ error: "This file is 5 MB. The limit is 5 MB. Remove sheets or columns you do not need and upload again." });
  });
  it("refuses a csv with over 2,000 data rows", async () => {
    const text = "Ref,Requirement\n" + Array.from({ length: 2001 }, (_, i) => `R-${i},Requirement number ${i} with some text`).join("\n");
    const result = await saveUpload(a, projectA, { name: "long.csv", bytes: new TextEncoder().encode(text) });
    expect(result).toEqual({ error: "This file has over 2,000 rows. The limit is 2,000. Split the list and upload the first part." });
    const ok = await saveUpload(a, projectA, { name: "edge.csv", bytes: new TextEncoder().encode(text.split("\n").slice(0, 2001).join("\n")) });
    expect("upload" in ok && ok.upload.preview.rowsRead).toBe(2000);
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
    const chosen = await rechoose(b.ws, result.upload.id, { headerRow: 1 });
    expect(chosen.headerRow).toBe(1);
    expect(chosen.preview.columns.map((c) => c.name)).toEqual(["CL-01", "OCR receipt capture via mobile (auto-fill amt/date/vendor).", "Submitting", "Must"]);
    expect(chosen.preview.rowsRead).toBe(5);
    const none = await rechoose(b.ws, result.upload.id, { headerRow: 0 });
    expect(none.headerRow).toBeNull();
    expect(none.preview.rowsRead).toBe(6);
  });
  it("a workbook with several sheets picks the first with rows, and the PM can pick another", async () => {
    const result = await saveUpload(b, projectB, { name: "two-sheets.xlsx", bytes: fixture("two-sheets.xlsx") });
    if (!("upload" in result)) throw new Error(result.error);
    expect(result.upload.preview.sheets).toEqual(["Notes", "Requirements", "Old"]);
    expect(result.upload.sheet).toBe("Notes");
    expect(result.upload.headerRow).toBeNull();
    const chosen = await rechoose(b.ws, result.upload.id, { sheet: "Requirements" });
    expect(chosen.sheet).toBe("Requirements");
    expect(chosen.headerRow).toBe(1);
    expect(chosen.preview.rowsRead).toBe(6);
  });
});
