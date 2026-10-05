// The admin reads (stories/E13-2, acceptances 2 to 5): the funnel counts events per ISO week
// in SQL and leaves deleted workspaces out; the totals and the workspace table leave the sample
// and deleted workspaces out and use E2-6's usage; the plan metric and the share read those
// rows; the access rule takes only the listed emails.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "../test-db";
import { funnel, totals, weekStart, workspaceUsage } from "@/db/queries/admin";
import { internal } from "@/db/queries/internal";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { usage, usageByWorkspace } from "@/db/queries/usage";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import type { AdminProof } from "@/db/types";
import { adminEmails, isAdmin } from "@/lib/admin";
import { ADMIN_COPY, share } from "@/lib/admin-copy";
import { PLAN_METRICS } from "@/lib/plans";

let sql: ReturnType<typeof postgres>;
const userId = `admin-${Date.now()}`;
const made: string[] = [];
const proof = { checked: "admin" } as AdminProof;

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${userId}, 'Admin', ${userId + "@example.com"}, true, now(), now())`;
}, 60_000);

afterAll(async () => {
  for (const id of made) await internal.hardDeleteWorkspace(id);
  await sql`delete from event where user_id = ${userId}`;
  await sql`delete from "user" where id = ${userId}`;
  await sql.end();
});

describe("the access rule and the page's arithmetic", () => {
  it("takes the listed emails only, in any case, and nobody when the list is missing", () => {
    expect(adminEmails(" Mihai@Example.com, ,ops@example.com ")).toEqual(["mihai@example.com", "ops@example.com"]);
    expect(isAdmin("MIHAI@example.com", adminEmails("mihai@example.com"))).toBe(true);
    expect(isAdmin("other@example.com", adminEmails("mihai@example.com"))).toBe(false);
    expect(isAdmin("mihai@example.com", adminEmails(undefined))).toBe(false);
    expect(isAdmin("mihai@example.com", adminEmails("mihai@example.com;ops@example.com"))).toBe(false);
    expect(isAdmin(null, adminEmails("mihai@example.com"))).toBe(false);
  });

  it("refuses a read without the admin proof", async () => {
    await expect(totals({} as AdminProof)).rejects.toThrow("The admin check did not run.");
  });

  it("starts weeks on Monday, UTC, and words shares and the metric", () => {
    expect(weekStart(new Date("2026-10-05T10:00:00Z")).toISOString()).toBe("2026-10-05T00:00:00.000Z");
    expect(weekStart(new Date("2026-10-11T23:59:00Z")).toISOString()).toBe("2026-10-05T00:00:00.000Z");
    expect([share(3, 4), share(40, 1), share(1, 0)]).toEqual(["75%", "4000%", ""]);
    expect(ADMIN_COPY.metric(3, null)).toBe("3. No threshold set yet: paid plans stay off.");
    expect(ADMIN_COPY.metric(3, 10)).toBe("3 of 10 to switch paid plans on.");
    expect(ADMIN_COPY.metric(12, 10)).toBe("12 of 10: the threshold is reached, paid plans can switch on.");
    const rows = [{ projects: 1, responsesThisMonth: 2, aiCostCentsThisMonth: 0 }, { projects: 3, responsesThisMonth: 0, aiCostCentsThisMonth: 5 }];
    expect(PLAN_METRICS.workspacesWithSubmissionsThisMonth.value(rows)).toBe(1);
    expect(PLAN_METRICS.responsesThisMonth.value(rows)).toBe(2);
  });
});

describe("the admin reads", () => {
  it("count weeks, own work only, by last activity, and agree with usage()", async () => {
    const now = new Date();
    const before = await funnel(proof, now);
    const totalsBefore = await totals(proof);
    const stamp = Date.now();
    const w = await createWorkspaceWithSample({ name: "Admin Test", slug: `admin-test-${stamp}` }, userId);
    const gone = await createWorkspaceWithSample({ name: "Admin Gone", slug: `admin-gone-${stamp}` }, userId);
    made.push(w.id, gone.id);
    // An own project with a published instrument and one submitted response this month.
    const [{ id: p }] = await sql`insert into project (workspace_id, name, created_by) values (${w.id}, 'Own', ${userId}) returning id`;
    const [{ id: s }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${w.id}, ${p}, 1, 'csv') returning id`;
    const [{ id: i }] = await sql`insert into instrument (workspace_id, project_id, item_set_id, title, published_at) values (${w.id}, ${p}, ${s}, 'v1', now()) returning id`;
    const [{ id: inv }] = await sql`insert into invite (workspace_id, instrument_id, kind, token) values (${w.id}, ${i}, 'public', ${("t" + stamp).padEnd(32, "0")}) returning id`;
    await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, submitted_at, first_submitted_at) values (${w.id}, ${i}, ${s}, ${inv}, ${("d" + stamp).padEnd(32, "0")}, now(), now())`;
    // Events: two this week, one three weeks ago, one before the 12 weeks, one of the deleted workspace.
    const threeWeeks = new Date(weekStart(now).getTime() - 21 * 86_400_000 + 3_600_000);
    await sql`insert into event (workspace_id, user_id, name) values (${w.id}, ${userId}, 'workspace_created'), (${w.id}, ${userId}, 'project_created')`;
    await sql`insert into event (workspace_id, user_id, name, created_at) values (${w.id}, ${userId}, 'project_created', ${threeWeeks.toISOString()})`;
    await sql`insert into event (workspace_id, user_id, name, created_at) values (${w.id}, ${userId}, 'project_created', ${new Date(now.getTime() - 100 * 86_400_000).toISOString()})`;
    await sql`insert into event (workspace_id, user_id, name) values (${gone.id}, ${userId}, 'workspace_created')`;
    await sql`update workspace set deleted_at = now() where id = ${gone.id}`;

    const weeks = await funnel(proof, now);
    expect(weeks).toHaveLength(12);
    expect(weeks[0].week.toISOString()).toBe(weekStart(now).toISOString());
    expect(weeks[0].counts.workspace_created - before[0].counts.workspace_created).toBe(1);
    expect(weeks[0].counts.project_created - before[0].counts.project_created).toBe(1);
    expect(weeks[3].counts.project_created - before[3].counts.project_created).toBe(1);
    expect(weeks.reduce((n, x) => n + x.counts.project_created, 0) - before.reduce((n, x) => n + x.counts.project_created, 0)).toBe(2);

    // Database test files run one at a time (vitest.config.mts), so the deltas are this test's.
    expect(await totals(proof)).toEqual({ workspaces: totalsBefore.workspaces + 1, projects: totalsBefore.projects + 1, published: totalsBefore.published + 1, submitted: totalsBefore.submitted + 1 });
    const rows = await workspaceUsage(proof, now);
    expect(rows.find((r) => r.id === gone.id)).toBeUndefined();
    const row = rows.find((r) => r.id === w.id)!;
    expect(row).toMatchObject({ name: "Admin Test", members: 1, projects: 1, published: 1, responsesThisMonth: 1, aiCostCentsThisMonth: 0 });
    expect(row.lastActivity.getTime()).toBeGreaterThan(row.createdAt.getTime());
    for (let k = 1; k < rows.length; k++) expect(rows[k - 1].lastActivity.getTime()).toBeGreaterThanOrEqual(rows[k].lastActivity.getTime());
    // The grouped usage equals usage() for every live workspace.
    const grouped = await usageByWorkspace(now);
    for (const r of rows) {
      const one = await usage(unsafeWorkspaceId(r.id), now);
      expect(grouped.get(r.id) ?? { projects: 0, responsesThisMonth: 0, aiRunsThisMonth: 0, aiCostCentsThisMonth: 0 }, r.name).toEqual(one);
    }
  });
});
