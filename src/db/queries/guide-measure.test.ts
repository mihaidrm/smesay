// Measuring the guide (stories/E15-5, acceptance 5): guide_shown is written once a day per tip
// and person; the guide table marks "to review" from fixed rows, by the buttons each card was
// drawn with, and leaves deleted workspaces out; the first-project funnel counts the steps from
// fixed rows by E15-2's rules; each query reads 10,000 events in under 500 ms (one measurement
// each, decision 0004); neither reads without the admin proof.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "@/db/test-db";
import { firstProjectFunnel, guideStats, weekStart, type GuideTipRow } from "@/db/queries/admin";
import { internal } from "@/db/queries/internal";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import type { AdminProof } from "@/db/types";
import { guideShown } from "@/lib/analytics";
import { GUIDE_ADMIN_COPY, actedRate } from "@/lib/admin-copy";
import { GUIDE_LINES, type TipId } from "@/lib/guide-lines";
import { DEFAULT_FIELDS } from "@/lib/respondent-fields";

let sql: ReturnType<typeof postgres>;
const stamp = Date.now();
const userId = `gm-${stamp}`;
const proof = { checked: "admin", userId } as AdminProof;
let wsId: string;

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${userId}, 'Guide', ${userId + "@example.com"}, true, now(), now())`;
  wsId = (await createWorkspaceWithSample({ name: "Measure", slug: `measure-${stamp}` }, userId)).id;
}, 60_000);

afterAll(async () => {
  await internal.hardDeleteWorkspace(wsId);
  await sql`delete from "user" where id = ${userId}`;
  await sql.end();
});

const shown = (tip: string) => sql`select count(*)::int as n from event where user_id = ${userId} and name = 'guide_shown' and properties->>'tip' = ${tip}`.then((r) => r[0].n);

const utcDay = () => sql`select (now() at time zone 'UTC')::date::text as d`.then((r) => r[0].d as string);

describe("guide_shown", () => {
  it("is written once a day per tip and person, with whether the card had an action", async () => {
    const who = { workspaceId: unsafeWorkspaceId(wsId), userId };
    // Three calls that straddle UTC midnight are two days: run again on the new day.
    for (let attempt = 0; attempt < 2; attempt++) {
      await sql`delete from event where user_id = ${userId} and name = 'guide_shown'`;
      const day = await utcDay();
      await guideShown("import.empty", false, who);
      await guideShown("import.empty", false, who);
      await guideShown("import.empty", true, who);
      if ((await utcDay()) === day) break;
    }
    expect(await shown("import.empty")).toBe(1);
    expect((await sql`select properties->>'action' as a from event where user_id = ${userId} and name = 'guide_shown'`)[0].a).toBe("no");
    await guideShown("shape.notRun", false, who);
    expect(await shown("shape.notRun")).toBe(1);
    // Yesterday's show does not count for today.
    await sql`update event set created_at = now() - interval '1 day' where user_id = ${userId} and name = 'guide_shown' and properties->>'tip' = 'import.empty'`;
    await guideShown("import.empty", false, who);
    expect(await shown("import.empty")).toBe(2);
  });
});

describe("the guide table", () => {
  it("refuses a read without the admin proof", async () => {
    await expect(guideStats({} as AdminProof)).rejects.toThrow("The admin check did not run.");
    await expect(firstProjectFunnel({} as AdminProof)).rejects.toThrow("The admin check did not run.");
  });

  it("counts the last 30 days and marks the tips to review", async () => {
    const before = new Map((await guideStats(proof)).map((r) => [r.tip, r]));
    const add = async (name: string, tip: string, n: number, ago = "1 hour", ws = wsId, action?: "yes" | "no") => {
      const props = name === "guide_shown" ? { tip, action: action ?? (GUIDE_LINES[tip as TipId].action ? "yes" : "no") } : { tip };
      for (let k = 0; k < n; k++) await sql`insert into event (workspace_id, user_id, name, properties, created_at) values (${ws}, ${userId}, ${name}, ${JSON.stringify(props)}::jsonb, now() - ${ago}::interval)`;
    };
    // path.import (has an action): 3 dismissed, 1 acted: to review. rescue.mapping: 1 dismissed, 2 acted: fine.
    await add("guide_shown", "path.import", 4); await add("guide_dismissed", "path.import", 3); await add("guide_acted", "path.import", 1);
    await add("guide_shown", "rescue.mapping", 3); await add("guide_dismissed", "rescue.mapping", 1); await add("guide_acted", "rescue.mapping", 2);
    // build.intro (no action): 3 of 4 shows dismissed: to review. share.draft: 1 of 4: fine.
    await add("guide_shown", "build.intro", 4); await add("guide_dismissed", "build.intro", 3);
    await add("guide_shown", "share.draft", 4); await add("guide_dismissed", "share.draft", 1);
    // Older than 30 days: not counted.
    await add("guide_dismissed", "share.draft", 5, "31 days");
    // rescue.shapeFailed drawn without "Try again" (a budget refusal): only Dismiss could be
    // pressed, so it is judged by the share of shows dismissed, 2 of 4: fine.
    await add("guide_shown", "rescue.shapeFailed", 4, "1 hour", wsId, "no"); await add("guide_dismissed", "rescue.shapeFailed", 2);
    // A workspace marked deleted: its events are left out.
    let rows: Map<TipId, GuideTipRow>;
    const gone = (await createWorkspaceWithSample({ name: "Gone", slug: `measure-gone-${stamp}` }, userId)).id;
    try {
      await sql`update workspace set deleted_at = now() where id = ${gone}`;
      await add("guide_shown", "path.done", 3, "1 hour", gone); await add("guide_dismissed", "path.done", 3, "1 hour", gone);
      rows = new Map((await guideStats(proof)).map((r) => [r.tip, r]));
    } finally {
      await internal.hardDeleteWorkspace(gone);
    }
    const delta = (tip: string) => { const a = rows.get(tip as never)!, b = before.get(tip as never)!; return { shown: a.shown - b.shown, dismissed: a.dismissed - b.dismissed, acted: a.acted - b.acted, toReview: a.toReview }; };
    expect(delta("path.import")).toEqual({ shown: 4, dismissed: 3, acted: 1, toReview: true });
    expect(delta("rescue.mapping")).toEqual({ shown: 3, dismissed: 1, acted: 2, toReview: false });
    expect(delta("build.intro")).toMatchObject({ shown: 4, dismissed: 3, toReview: true });
    expect(delta("share.draft")).toMatchObject({ shown: 4, dismissed: 1, toReview: false });
    expect(rows.get("build.intro")!.hasAction).toBe(false);
    expect(delta("rescue.shapeFailed")).toMatchObject({ shown: 4, dismissed: 2, acted: 0, toReview: false });
    expect(rows.get("rescue.shapeFailed")!.hasAction).toBe(false);
    expect(delta("path.done")).toMatchObject({ shown: 0, dismissed: 0 });
    expect([actedRate(1, 4), actedRate(0, 0)]).toEqual(["25%", ""]);
    expect(GUIDE_ADMIN_COPY.benchmark).toContain("37.5 percent");
  });

  it("reads 10,000 events in under 500 ms", async () => {
    await sql`insert into event (workspace_id, user_id, name, properties)
      select ${wsId}, ${userId}, (array['guide_shown','guide_dismissed','guide_acted'])[1 + (g % 3)], jsonb_build_object('tip', (array['path.start','import.empty','share.draft'])[1 + (g % 3)])
      from generate_series(1, 10000) g`;
    await sql`analyze event`;
    const started = performance.now();
    await guideStats(proof);
    expect(performance.now() - started).toBeLessThan(500);
  });
});

describe("the first-project funnel", () => {
  it("counts the steps of the week's sign-ups by E15-2's rules", async () => {
    const now = new Date();
    const before = (await firstProjectFunnel(proof, now))[0];
    const person = `gm-p-${stamp}`, colleague = `gm-c-${stamp}`;
    // Signed up now, by the database's clock, so in this week's row.
    for (const id of [person, colleague]) await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${id}, 'P', ${id + "@example.com"}, true, now() at time zone 'UTC', now())`;
    try {
      const [{ id: p }] = await sql`insert into project (workspace_id, name, created_by) values (${wsId}, 'Funnel', ${person}) returning id`;
      const [{ id: s }] = await sql`insert into item_set (workspace_id, project_id, version, source, shape_runs, shaped_at) values (${wsId}, ${p}, 1, 'csv', 1, now()) returning id`;
      await sql`insert into instrument (workspace_id, project_id, item_set_id, title, intro, respondent_fields) values (${wsId}, ${p}, ${s}, 'F', 'Intro', ${JSON.stringify([{ ...DEFAULT_FIELDS[0] }, { key: "team", label: "Team", type: "dropdown", mandatory: true, options: ["A", "B"] }])}::jsonb)`;
      // The colleague, with no project of their own, publishes the person's project: Share is
      // the person's (the link is for their project), not the colleague's.
      await sql`insert into event (workspace_id, user_id, name, properties) values (${wsId}, ${colleague}, 'invite_sent', ${JSON.stringify({ kind: "public", project: p })}::jsonb)`;
      const week = (await firstProjectFunnel(proof, now))[0];
      expect(week.week.toISOString()).toBe(weekStart(now).toISOString());
      expect({ signups: week.signups - before.signups, imported: week.imported - before.imported, shaped: week.shaped - before.shaped, built: week.built - before.built, shared: week.shared - before.shared })
        .toEqual({ signups: 2, imported: 1, shaped: 1, built: 1, shared: 1 });
      expect(week.medianHoursToLink).not.toBeNull();
      expect(week.medianHoursToLink!).toBeLessThan(1);
    } finally {
      await sql`delete from event where user_id in (${person}, ${colleague})`;
      await sql`delete from project where created_by = ${person}`;
      await sql`delete from "user" where id in (${person}, ${colleague})`;
    }
  });

  it("reads 10,000 events in under 500 ms", async () => {
    // 100 people signed up this week, each with a project, and 10,000 invite_sent events for them.
    const ids = Array.from({ length: 100 }, (_, i) => `gm-load-${stamp}-${i}`);
    await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) select id, 'L', id || '@example.com', true, now() at time zone 'UTC', now() from unnest(${ids}::text[]) id`;
    try {
      await sql`insert into project (workspace_id, name, created_by) select ${wsId}, 'Load', id from unnest(${ids}::text[]) id`;
      await sql`insert into event (workspace_id, user_id, name, properties)
        select ${wsId}, ${userId}, 'invite_sent', jsonb_build_object('kind', 'public', 'project', p.id)
        from generate_series(1, 100) g cross join (select id from project where created_by like ${`gm-load-${stamp}-%`}) p`;
      await sql`analyze event`;
      const started = performance.now();
      const week = (await firstProjectFunnel(proof))[0];
      expect(performance.now() - started).toBeLessThan(500);
      expect(week.shared).toBeGreaterThanOrEqual(100);
    } finally {
      await sql`delete from event where workspace_id = ${wsId} and name = 'invite_sent' and properties->>'project' in (select id::text from project where created_by like ${`gm-load-${stamp}-%`})`;
      await sql`delete from project where created_by like ${`gm-load-${stamp}-%`}`;
      await sql`delete from "user" where id like ${`gm-load-${stamp}-%`}`;
    }
  });
});
