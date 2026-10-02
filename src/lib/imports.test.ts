// stories/E3-5: the check over a stored upload with its mapping, and the commit writing the
// set with the same report; another workspace refused.
import { beforeAll, describe, expect, it } from "vitest";
import { items, projects, workspaces } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { checkUpload, commitUpload, IMPORT_COPY, latestSet } from "@/lib/imports";
import { memoryOutbox } from "@/lib/mail";
import { savePaste, saveUpload, saveMapping } from "@/lib/uploads";
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
    expect(IMPORT_COPY.counts(check!.report)).toEqual({ empty: "1 empty row, skipped.", duplicates: "1 exact duplicate, imported once.", long: "0 items over 1,000 characters, imported whole; consider splitting them in Shape.", values: "1 proposed value not recognised, kept as written." });
    expect(await latestSet(a.ws, projectA)).toBeNull();
    const committed = await commitUpload(a.ws, saved.upload.id, a.userId);
    if (!("set" in committed)) throw new Error(committed.error);
    expect(committed.set).toMatchObject({ version: 1, source: "csv", sourceFilename: "list.csv", uploadId: saved.upload.id, importedBy: a.userId });
    expect(committed.set.importReport).toEqual(check!.report);
    const rows = (await items.list(a.ws)).filter((i) => i.itemSetId === committed.set.id).sort((x, y) => x.position - y.position);
    expect(rows.map((r) => [r.sourceRef, r.originalText, r.area, r.proposedValue])).toEqual([["CL-01", "OCR receipt capture", "Submitting", "Must"], ["CL-03", "Approve from email", "Approving", "High"], ["CL-04", "Pay by payroll", "Paying", "Should"]]);
    expect((await latestSet(a.ws, projectA))?.id).toBe(committed.set.id);
    await expect(commitUpload(b.ws, saved.upload.id, b.userId)).rejects.toBeInstanceOf(NotFoundError);
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
