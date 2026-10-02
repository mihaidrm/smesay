// The seed on the test database (stories/E1-4, acceptance 1 to 4): runs once, says so the
// second time, creates no user and no member, and the rows add up to the numbers the prototype
// boards show (sample.expected).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "../test-db";
import { aiRuns, answers, insights, invites, items, members, missingItems, projects, responses, workspaces } from "@/db/queries";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import { seedSample } from "./sample-seed";
import { SAMPLE_WORKSPACE_ID, expected } from "./sample";

let sql: ReturnType<typeof postgres>;
const ws = unsafeWorkspaceId(SAMPLE_WORKSPACE_ID);

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await workspaces.hardDelete(SAMPLE_WORKSPACE_ID);
}, 60_000);

afterAll(async () => {
  await workspaces.hardDelete(SAMPLE_WORKSPACE_ID);
  await sql.end();
});

describe("npm run db:seed", () => {
  it("creates the sample once and says so the second time", async () => {
    const [{ n: usersBefore }] = await sql`select count(*)::int as n from "user"`;
    expect(await seedSample()).toEqual({ status: "created", workspaceId: SAMPLE_WORKSPACE_ID });
    expect(await seedSample()).toEqual({ status: "exists", workspaceId: SAMPLE_WORKSPACE_ID });
    const [{ n: usersAfter }] = await sql`select count(*)::int as n from "user"`;
    expect(usersAfter).toBe(usersBefore);
    expect(await members.list(ws)).toEqual([]);
  });

  it("holds the Marlow Group sample, marked as the sample", async () => {
    const [project] = await projects.list(ws);
    expect(project).toMatchObject({ name: "New expense tool", isSample: true });
    expect(await items.count(ws)).toBe(expected.items);
    expect(await invites.count(ws)).toBe(expected.invites);
    expect((await invites.list(ws)).filter((i) => i.kind === "personal").length).toBe(6);
    expect(await responses.count(ws)).toBe(expected.responses);
    expect(await answers.count(ws)).toBe(expected.answers);
    expect(await missingItems.count(ws)).toBe(expected.missing);
    expect(await insights.count(ws)).toBe(expected.insights);
    expect(await aiRuns.count(ws)).toBe(expected.aiRuns);
    for (const ins of await insights.list(ws)) expect(ins.citedAnswerIds.length).toBeGreaterThan(0);
  });

  it("adds up to the numbers on the PM app board, over submitted responses", async () => {
    const rows = await sql`
      select a.kind, count(*)::int as n from answer a join response r on r.id = a.response_id
      where r.workspace_id = ${SAMPLE_WORKSPACE_ID} and r.submitted_at is not null group by a.kind`;
    const byKind = Object.fromEntries(rows.map((r) => [r.kind, r.n]));
    expect(byKind).toEqual({ agree: expected.agree, change: expected.change, disagree: expected.disagree, unclear: expected.unclear });
    const [{ submitted, avg }] = await sql`
      select count(*)::int as submitted, round(avg(confidence)::numeric, 1)::float as avg from response
      where workspace_id = ${SAMPLE_WORKSPACE_ID} and submitted_at is not null`;
    expect(submitted).toBe(expected.submitted);
    expect(avg).toBe(expected.confidenceAverage);
    expect(expected.agree + expected.change + expected.disagree + expected.unclear).toBe(expected.submittedAnswers);
  });
});
