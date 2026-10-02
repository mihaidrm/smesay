// The seed on the test database (stories/E1-4, acceptance 1 to 4): runs once, says so the
// second time, creates no user and no member, and the rows add up to the numbers the prototype
// boards show (sample.expected).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "../test-db";
import { aiRuns, answers, insights, invites, items, members, missingItems, projects, responses } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import { seedSample } from "./sample-seed";
import { SAMPLE_WORKSPACE_ID, expected } from "./sample";

let sql: ReturnType<typeof postgres>;
const ws = unsafeWorkspaceId(SAMPLE_WORKSPACE_ID);

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await internal.hardDeleteWorkspace(SAMPLE_WORKSPACE_ID);
}, 60_000);

afterAll(async () => {
  await internal.hardDeleteWorkspace(SAMPLE_WORKSPACE_ID);
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
    const tokens = [...(await invites.list(ws)).map((i) => i.token), ...(await responses.list(ws)).map((r) => r.deviceToken)];
    expect(new Set(tokens).size).toBe(tokens.length);
    for (const t of tokens) expect(t).toMatch(/^[0-9a-f]{32}$/);
  });

  it("cites, in each action, the answers its text names", async () => {
    const byRef = Object.fromEntries((await items.list(ws)).map((i) => [i.sourceRef, i.id]));
    const byName = Object.fromEntries((await responses.list(ws)).map((r) => [(r.fields as { name: string }).name, r.id]));
    const all = await answers.list(ws);
    const answerId = (ref: string, name: string) => all.find((a) => a.itemId === byRef[ref] && a.responseId === byName[name])!.id;
    const list = await insights.list(ws);
    const cited = (title: string) => list.find((i) => i.title.startsWith(title))!.citedAnswerIds.sort();
    expect(cited("Decide whether policy flags")).toEqual([answerId("CL-04", "Ioana Marin"), answerId("CL-04", "Tom Reyes")].sort());
    expect(cited("Answer two open questions")).toEqual([answerId("CL-02", "Tom Reyes"), answerId("CL-06", "Lukas Berg")].sort());
    expect(cited("Rewrite CL-06")).toEqual([answerId("CL-06", "Priya Nair"), answerId("CL-06", "Lukas Berg")].sort());
    expect(cited("Consider adding mileage")).toEqual([]);
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
    const record = await sql`select fields->>'name' as name, confidence, submitted_at from response where workspace_id = ${SAMPLE_WORKSPACE_ID} and submitted_at is not null order by submitted_at`;
    expect(record.map((r) => [r.name, r.confidence, new Date(r.submitted_at as string).toISOString()])).toEqual([
      ["Ioana Marin", 4, "2026-10-07T14:05:00.000Z"], ["Tom Reyes", 3, "2026-10-08T08:41:00.000Z"], ["Dana Okafor", 5, "2026-10-08T09:12:00.000Z"],
      ["Lukas Berg", 4, "2026-10-09T16:30:00.000Z"], ["Priya Nair", 3, "2026-10-12T08:55:00.000Z"]]);
  });
});
