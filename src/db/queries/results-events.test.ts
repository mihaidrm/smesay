// Live updates (stories/E8-7, acceptance 1, 4 and 5): a committed write to an answer, a
// response or a missing item reaches the instrument's listeners through Postgres LISTEN and
// NOTIFY (drizzle/0020_results_notify.sql), with only the instrument's id; another
// instrument's listener hears nothing.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "../test-db";
import { instruments, projects } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { onResultsChange } from "@/db/queries/results-events";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import type { WorkspaceId } from "@/db/types";

let sql: ReturnType<typeof postgres>;
const userId = `events-${Date.now()}`;
const made: string[] = [];

async function sampleInstrument(ws: WorkspaceId): Promise<string> {
  const [project] = (await projects.list(ws)).filter((p) => p.isSample);
  return (await instruments.latestForProject(ws, project.id))!.id;
}

// Resolves with how many times `count` was called once it has been called `n` times, or after
// `ms` with the count so far.
function waitFor(count: () => number, n: number, ms = 3_000): Promise<number> {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = setInterval(() => {
      if (count() >= n || Date.now() - started > ms) { clearInterval(tick); resolve(count()); }
    }, 20);
  });
}

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${userId}, 'Events', ${userId + "@example.com"}, true, now(), now())`;
}, 60_000);

afterAll(async () => {
  for (const id of made) await internal.hardDeleteWorkspace(id);
  await sql`delete from "user" where id = ${userId}`;
  await sql.end();
});

describe("live updates", () => {
  it("tells the instrument's listeners about a saved answer, a response and a missing item", async () => {
    const stamp = Date.now();
    const a = await createWorkspaceWithSample({ name: "Events A", slug: `events-a-${stamp}` }, userId);
    const b = await createWorkspaceWithSample({ name: "Events B", slug: `events-b-${stamp}` }, userId);
    made.push(a.id, b.id);
    const instrumentA = await sampleInstrument(unsafeWorkspaceId(a.id));
    const instrumentB = await sampleInstrument(unsafeWorkspaceId(b.id));
    let mine = 0;
    let theirs = 0;
    const stopA = await onResultsChange(instrumentA, () => { mine += 1; });
    const stopB = await onResultsChange(instrumentB, () => { theirs += 1; });
    const [{ id: responseId }] = await sql`select id from response where workspace_id = ${a.id} and instrument_id = ${instrumentA} and fields ->> 'name' = 'Sam Hill'`;
    // An autosave (one answer changed), in its own transaction.
    await sql`update answer set reason = 'Changed.', kind = 'disagree' where id = (select id from answer where response_id = ${responseId} limit 1)`;
    expect(await waitFor(() => mine, 1)).toBe(1);
    // A response's Submit, and a missing item, each heard once.
    await sql`update response set submitted_at = now(), first_submitted_at = now() where id = ${responseId}`;
    expect(await waitFor(() => mine, 2)).toBe(2);
    await sql`insert into missing_item (workspace_id, response_id, text) values (${a.id}, ${responseId}, 'Mileage claims.')`;
    expect(await waitFor(() => mine, 3)).toBe(3);
    // Many rows in one transaction: one notification (identical payloads collapse on commit).
    await sql.begin(async (tx) => { await tx`update answer set comment = 'x' where response_id = ${responseId}`; });
    expect(await waitFor(() => mine, 4)).toBe(4);
    expect(await waitFor(() => mine, 5, 500)).toBe(4);
    expect(theirs).toBe(0);
    stopA();
    await sql`update answer set comment = 'y' where response_id = ${responseId}`;
    expect(await waitFor(() => mine, 5, 500)).toBe(4);
    stopB();
  }, 30_000);
});
