// stories/E3-5, acceptance 3 and 4: the commit writes the set and its items in one transaction
// with the next version number; a bad row rolls everything back; another workspace's project
// gets nothing.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { user } from "@/db/schema";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { itemSets, items, projects, workspaces } from "./index";
import { commitImport } from "./importCommit";
import { unsafeWorkspaceId } from "./scoped";

const REPORT = { emptyRows: 0, exactDuplicates: 0, overLimit: 0, rowsRead: 2, headerRow: 1, unrecognisedValues: 0, duplicateRefs: [] };
let ws: WorkspaceId; let other: WorkspaceId; let userId: string; let projectId: string;

beforeAll(async () => {
  await prepareTestDatabase();
  userId = "user-" + randomUUID();
  await db.insert(user).values({ id: userId, name: "Importer", email: `${userId}@example.com` });
  ws = unsafeWorkspaceId((await workspaces.create({ name: "Commit", slug: "commit-" + randomUUID() }, userId)).id);
  other = unsafeWorkspaceId((await workspaces.create({ name: "Commit other", slug: "commit-o-" + randomUUID() }, userId)).id);
  projectId = (await projects.create(ws, { name: "P" })).id;
}, 60_000);

describe("commitImport", () => {
  it("creates version 1 then 2 with the items in order", async () => {
    const v1 = await commitImport(ws, { projectId, uploadId: null, source: "csv", filename: "list.csv", report: REPORT, userId, items: [
      { ref: "A-1", text: "First", area: "Paying", value: "Must", custom: { Owner: "Dana" } },
      { ref: null, text: "Second", area: null, value: null, custom: null },
    ] });
    expect(v1?.version).toBe(1);
    expect(v1?.importedBy).toBe(userId);
    const rows = (await items.list(ws)).filter((i) => i.itemSetId === v1!.id).sort((a, b) => a.position - b.position);
    expect(rows.map((r) => [r.position, r.sourceRef, r.originalText, r.area, r.proposedValue, r.custom])).toEqual([[1, "A-1", "First", "Paying", "Must", { Owner: "Dana" }], [2, null, "Second", null, null, null]]);
    const v2 = await commitImport(ws, { projectId, uploadId: null, source: "pasted", filename: null, report: REPORT, userId, items: [{ ref: null, text: "Only", area: null, value: null, custom: null }] });
    expect(v2?.version).toBe(2);
    expect((await itemSets.list(ws)).filter((s) => s.projectId === projectId).map((s) => s.version).sort()).toEqual([1, 2]);
  });
  it("rolls back the set when a row is bad, so nothing is imported", async () => {
    const before = (await itemSets.list(ws)).length;
    await expect(commitImport(ws, { projectId, uploadId: null, source: "csv", filename: null, report: REPORT, userId, items: [
      { ref: null, text: "Fine", area: null, value: null, custom: null },
      { ref: null, text: "   ", area: null, value: null, custom: null },
    ] })).rejects.toThrow();
    expect((await itemSets.list(ws)).length).toBe(before);
    expect((await items.list(ws)).some((i) => i.originalText === "Fine")).toBe(false);
  });
  it("gives another workspace nothing for this project", async () => {
    expect(await commitImport(other, { projectId, uploadId: null, source: "csv", filename: null, report: REPORT, userId, items: [] })).toBeNull();
    expect((await itemSets.list(other)).length).toBe(0);
  });
});
