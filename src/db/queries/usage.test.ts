// usage() (stories/E2-6, acceptance 2): rows created here, numbers read back by SQL, the month
// boundary in UTC, and nothing from another workspace.
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "../test-db";
import { aiRuns, instruments, invites, itemSets, projects, responses, workspaces } from "@/db/queries";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import { internal } from "@/db/queries/internal";
import { monthStart, usage } from "@/db/queries/usage";

let sql: ReturnType<typeof postgres>;
const now = new Date("2026-10-15T12:00:00Z");

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
}, 60_000);

async function workspaceWithRows(label: string) {
  const userId = "usage-" + randomUUID();
  await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${userId}, ${label}, ${userId + "@example.com"}, true, now(), now())`;
  const ws = unsafeWorkspaceId((await workspaces.create({ name: label, slug: "usage-" + randomUUID() }, userId)).id);
  const p1 = await projects.create(ws, { name: "P1" });
  await projects.create(ws, { name: "P2" });
  const set = await itemSets.create(ws, { projectId: p1.id, version: 1, source: "csv" });
  const instrument = await instruments.create(ws, { projectId: p1.id, itemSetId: set.id, title: "I" });
  const invite = await invites.create(ws, { instrumentId: instrument.id, kind: "public", token: randomUUID().replace(/-/g, "") });
  for (const submittedAt of ["2026-10-01T00:00:00Z", "2026-10-14T09:00:00Z", "2026-09-30T23:59:59Z", null]) {
    await responses.create(ws, { instrumentId: instrument.id, itemSetId: set.id, inviteId: invite.id, deviceToken: randomUUID().replace(/-/g, ""), fields: {}, signedOff: submittedAt !== null, submittedAt: submittedAt ? new Date(submittedAt) : null, firstSubmittedAt: submittedAt ? new Date(submittedAt) : null });
  }
  for (const [createdAt, cents] of [["2026-10-02T10:00:00Z", 4], ["2026-10-10T10:00:00Z", 5], ["2026-09-28T10:00:00Z", 9]] as const) {
    const run = await aiRuns.create(ws, { projectId: p1.id, purpose: "shape", model: "test", tokensIn: 1, tokensOut: 1, costEurCents: cents, durationMs: 1 });
    await sql`update ai_run set created_at = ${createdAt} where id = ${run.id}`;
  }
  // The sample project's rows never count.
  const sample = await projects.create(ws, { name: "Sample project", isSample: true });
  const sampleSet = await itemSets.create(ws, { projectId: sample.id, version: 1, source: "csv" });
  const sampleInstrument = await instruments.create(ws, { projectId: sample.id, itemSetId: sampleSet.id, title: "S" });
  const sampleInvite = await invites.create(ws, { instrumentId: sampleInstrument.id, kind: "public", token: randomUUID().replace(/-/g, "") });
  await responses.create(ws, { instrumentId: sampleInstrument.id, itemSetId: sampleSet.id, inviteId: sampleInvite.id, deviceToken: randomUUID().replace(/-/g, ""), fields: {}, signedOff: true, submittedAt: new Date("2026-10-05T10:00:00Z"), firstSubmittedAt: new Date("2026-10-05T10:00:00Z") });
  await aiRuns.create(ws, { projectId: sample.id, purpose: "insights", model: "sample", tokensIn: 1, tokensOut: 1, costEurCents: 50, durationMs: 1 });
  return ws;
}

describe("usage", () => {
  it("starts the month at 00:00 UTC on the first", () => {
    expect(monthStart(now).toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(monthStart(new Date("2026-10-31T23:59:59Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("counts projects, the month's submitted responses, the month's runs and their cost, per workspace, never the sample's", async () => {
    const a = await workspaceWithRows("A");
    const b = await workspaceWithRows("B");
    expect(await usage(a, now)).toEqual({ projects: 2, responsesThisMonth: 2, aiRunsThisMonth: 2, aiCostCentsThisMonth: 9 });
    expect(await usage(b, now)).toEqual({ projects: 2, responsesThisMonth: 2, aiRunsThisMonth: 2, aiCostCentsThisMonth: 9 });
    expect(await usage(a, new Date("2026-11-03T00:00:00Z"))).toEqual({ projects: 2, responsesThisMonth: 0, aiRunsThisMonth: 0, aiCostCentsThisMonth: 0 });
  });

  it("sums the month's cost across every workspace for the product cap, never the samples' rows", async () => {
    // Other tests' rows share the database, so the sum is read before and after two more
    // workspaces: 9 cents each this month, 50 on each sample that must not count.
    const november = new Date("2026-11-03T00:00:00Z");
    const before = await internal.productAiCostCentsThisMonth(now);
    const beforeNovember = await internal.productAiCostCentsThisMonth(november);
    await workspaceWithRows("C");
    await workspaceWithRows("D");
    expect(await internal.productAiCostCentsThisMonth(now)).toBe(before + 18);
    expect(await internal.productAiCostCentsThisMonth(november)).toBe(beforeNovember);
  });
});
