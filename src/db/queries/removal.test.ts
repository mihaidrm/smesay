// The removal job (stories/E11-2, acceptance 3): a full workspace (the sample with its responses,
// a project of its own, and a row in every other table: an upload with its object, an AI run, an
// invitation, a mapping, a project and a workspace export; a logo in the bucket) is deleted, the job runs, and every
// application table holds zero rows of it and the bucket zero objects under it; the owner who
// deleted it gets one email; a second run finds nothing; another workspace is untouched.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { aiRuns, exportLogs, projects, uploads, workspaceInvites, workspaceMappings, workspaces } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import { prepareTestDatabase } from "@/db/test-db";
import type { Mail } from "@/lib/mail";
import { listKeys, putObject } from "@/lib/storage";
import { purgeDeletedWorkspaces } from "@/lib/workspace-removal";
import { db } from "@/db";
import { user } from "@/db/schema";

// Every table with a workspace_id (src/db/schema.test.ts APP_TABLES without workspace itself).
const TABLES = ["workspace_member", "workspace_invite", "project", "item_set", "item", "instrument", "invite", "response", "answer", "missing_item", "insight", "ai_run", "upload", "workspace_mapping", "export_log"];
let sql: ReturnType<typeof postgres>;

beforeAll(async () => { sql = postgres(await prepareTestDatabase(), { max: 1 }); }, 60_000);
afterAll(async () => { await sql.end(); });

async function rowsOf(ws: string): Promise<number> {
  let total = (await sql`select count(*)::int as n from workspace where id = ${ws}`)[0].n as number;
  for (const t of TABLES) total += (await sql`select count(*)::int as n from ${sql(t)} where workspace_id = ${ws}`)[0].n as number;
  return total;
}

describe("purgeDeletedWorkspaces", () => {
  it("removes every row and object of a deleted workspace and emails the owner once", async () => {
    const ownerId = `removal-${randomUUID()}`;
    await db.insert(user).values({ id: ownerId, name: "Owner", email: `${ownerId}@example.com`, emailVerified: true });
    const gone = unsafeWorkspaceId((await createWorkspaceWithSample({ name: "Gone Ltd", slug: `gone-${randomUUID()}` }, ownerId)).id);
    const kept = unsafeWorkspaceId((await createWorkspaceWithSample({ name: "Kept Ltd", slug: `kept-${randomUUID()}` }, ownerId)).id);
    const own = await projects.create(gone, { name: "Own project", createdBy: ownerId });
    // A row in every table the sample does not fill: an upload with its object, an AI run, an
    // invitation, a mapping, a project export and a whole-workspace export.
    await uploads.create(gone, { projectId: own.id, objectKey: `uploads/${gone}/list.csv`, filename: "list.csv", kind: "csv", byteSize: 1, preview: { sheets: ["csv"], sheet: "csv", headerRow: 1, columns: [], rows: [], rowsRead: 0 } });
    await aiRuns.create(gone, { projectId: own.id, purpose: "shape", model: "test" });
    await workspaceInvites.create(gone, { email: `invitee-${randomUUID()}@example.com`, invitedBy: ownerId });
    await workspaceMappings.create(gone, { headersKey: "Ref\u001fRequirement", mapping: { Ref: "ref", Requirement: "text" } });
    await exportLogs.create(gone, { projectId: own.id, madeBy: ownerId, file: "answers", rows: 1 });
    await exportLogs.create(gone, { projectId: null, madeBy: ownerId, file: "workspace", rows: 2 });
    await putObject(`uploads/${gone}/list.csv`, new Uint8Array([1]), "text/csv");
    await putObject(`logos/${gone}/logo.png`, new Uint8Array([2]), "image/png");
    await putObject(`uploads/${kept}/list.csv`, new Uint8Array([3]), "text/csv");
    const keptBefore = await rowsOf(kept);
    for (const t of TABLES) expect((await sql`select count(*)::int as n from ${sql(t)} where workspace_id = ${gone}`)[0].n, `${t} has a row`).toBeGreaterThan(0);
    const deletedAt = new Date("2026-10-04T13:00:00Z");
    await workspaces.markDeleted(gone, ownerId, deletedAt);

    const sent: Mail[] = [];
    const report = await purgeDeletedWorkspaces(async (m) => { sent.push(m); });
    expect(report.workspaces).toBeGreaterThanOrEqual(1);
    expect(await rowsOf(gone)).toBe(0);
    expect([...(await listKeys(`uploads/${gone}/`)), ...(await listKeys(`logos/${gone}/`))]).toEqual([]);
    const mine = sent.filter((m) => m.to === `${ownerId}@example.com`);
    expect(mine.map((m) => [m.subject, m.text.split("\n")[2]])).toEqual([["Gone Ltd was deleted", "Everything in Gone Ltd was deleted on 4 Oct 2026, 13:00 UTC."]]);

    expect(await rowsOf(kept)).toBe(keptBefore);
    expect(await listKeys(`uploads/${kept}/`)).toEqual([`uploads/${kept}/list.csv`]);
    const again = await purgeDeletedWorkspaces(async (m) => { sent.push(m); });
    expect(again.workspaces).toBe(0);
    expect(sent.filter((m) => m.to === `${ownerId}@example.com`)).toHaveLength(1);
  });

  it("deletes the rows even when the email fails, and counts the failure", async () => {
    const ownerId = `removal-${randomUUID()}`;
    await db.insert(user).values({ id: ownerId, name: "Owner", email: `${ownerId}@example.com`, emailVerified: true });
    const ws = unsafeWorkspaceId((await createWorkspaceWithSample({ name: "Mailless Ltd", slug: `mailless-${randomUUID()}` }, ownerId)).id);
    await workspaces.markDeleted(ws, ownerId);
    const report = await purgeDeletedWorkspaces(async (m) => { if (m.to === `${ownerId}@example.com`) throw new Error("smtp down"); });
    expect(report.failed).toBeGreaterThanOrEqual(1);
    expect(await rowsOf(ws)).toBe(0);
  });
});
