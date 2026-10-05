// track() (stories/E13-1, acceptances 1, 3 and 5): the catalogue is the only list, personal data
// cannot fit any property, respondent events carry no user, and a deleted workspace's events go
// with it while the events kept without a workspace stay.
import { readdirSync, readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "@/db/test-db";
import { internal } from "@/db/queries/internal";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import { EVENTS } from "@/lib/analytics-catalogue";
import { track, trackProblem, wasFirst } from "@/lib/analytics";

let sql: ReturnType<typeof postgres>;
const userId = `analytics-${Date.now()}`;
const INSTRUMENT = "3f9c2a7b-e41d-4c58-a6e1-9f7b2d4c8e05";

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${userId}, 'Analytics', ${userId + "@example.com"}, true, now(), now())`;
}, 60_000);

afterAll(async () => {
  await sql`delete from event where user_id = ${userId} or name = 'signed_up'`;
  await sql`delete from "user" where id = ${userId}`;
  await sql.end();
});

const ws = unsafeWorkspaceId("00000000-0000-4000-8000-0000000000aa");

describe("trackProblem", () => {
  it("refuses a name that is not in the catalogue", () => {
    expect(trackProblem("page_viewed", {}, { workspaceId: ws, userId })).toBe("not in the catalogue");
    expect(trackProblem("__proto__", {}, { workspaceId: ws, userId })).toBe("not in the catalogue");
  });

  it("refuses an email, a name or typed text in any property", () => {
    // An email, a name, typed text, a respondent's field value and a slug made from a name.
    for (const value of ["ana@marlow.example", "Ana Pop", "Receipts should be optional", "finance", "ana-pop", "anapop-marlow-com"]) {
      expect(trackProblem("export_downloaded", { format: value }, { workspaceId: ws, userId })).toBe("property format does not fit");
      expect(trackProblem("link_opened", { kind: "public", instrument: value }, { workspaceId: ws, userId: null })).toBe("property instrument does not fit");
      expect(trackProblem("guide_shown", { tip: value }, { workspaceId: ws, userId })).toBe("property tip does not fit");
      expect(trackProblem("import_committed", { source: value, rows: 1 }, { workspaceId: ws, userId })).toBe("property source does not fit");
    }
    expect(trackProblem("import_committed", { source: "upload", rows: 6, email: "ana@marlow.example" }, { workspaceId: ws, userId })).toBe("unknown property");
    expect(trackProblem("import_committed", { source: "upload", rows: -1 }, { workspaceId: ws, userId })).toBe("property rows does not fit");
    expect(trackProblem("import_committed", { source: "upload" }, { workspaceId: ws, userId })).toBe("missing property rows");
  });

  it("keeps the user off respondent events and the workspace off the kept ones", () => {
    expect(trackProblem("response_started", { instrument: INSTRUMENT }, { workspaceId: ws, userId })).toBe("a respondent event carries no user");
    expect(trackProblem("signed_up", {}, { workspaceId: ws, userId })).toBe("this event is kept without a workspace");
    expect(trackProblem("project_created", { from: "new" }, { workspaceId: null, userId })).toBe("this event needs a workspace");
    expect(trackProblem("response_submitted", { instrument: INSTRUMENT, items: 6, minutes: 4 }, { workspaceId: ws, userId: null })).toBeNull();
  });

  it("lists the 21 events of the story and shape_failed (stories/E15-4)", () => {
    expect(Object.keys(EVENTS)).toHaveLength(22);
  });
});

describe("track", () => {
  it("writes a fitting event, refuses the rest without throwing, and the workspace's events go with it", async () => {
    const w = await createWorkspaceWithSample({ name: "Analytics", slug: `analytics-${Date.now()}` }, userId);
    const wsId = unsafeWorkspaceId(w.id);
    expect(await track("signed_up", {}, { workspaceId: null, userId })).toBe(true);
    expect(await track("workspace_deleted", {}, { workspaceId: null, userId })).toBe(true);
    expect(await track("workspace_created", {}, { workspaceId: wsId, userId })).toBe(true);
    expect(await track("import_committed", { source: "paste", rows: 6 }, { workspaceId: wsId, userId })).toBe(true);
    // wasFirst (E13-3's "first" goals): true after the workspace's first event of a name only.
    expect(await track("project_created", { from: "new" }, { workspaceId: wsId, userId })).toBe(true);
    expect(await wasFirst("project_created", wsId)).toBe(true);
    expect(await track("project_created", { from: "import" }, { workspaceId: wsId, userId })).toBe(true);
    expect(await wasFirst("project_created", wsId)).toBe(false);
    expect(await wasFirst("instrument_published", wsId)).toBe(false);
    // @ts-expect-error: not in the catalogue, refused at run time too
    expect(await track("page_viewed", {}, { workspaceId: wsId, userId })).toBe(false);
    const rows = await sql`select name, properties, workspace_id from event where user_id = ${userId} order by created_at`;
    expect(rows.map((r) => r.name)).toEqual(["signed_up", "workspace_deleted", "workspace_created", "import_committed", "project_created", "project_created"]);
    expect(rows[3].properties).toEqual({ source: "paste", rows: 6 });

    await sql`update workspace set deleted_at = now() where id = ${w.id}`;
    await internal.purgeWorkspace(w.id);
    expect((await sql`select name from event where user_id = ${userId} order by created_at`).map((r) => r.name)).toEqual(["signed_up", "workspace_deleted"]);
  });
});

describe("the event table", () => {
  it("refuses a user id on a respondent event", async () => {
    await expect(sql`insert into event (user_id, name) values (${userId}, 'link_opened')`).rejects.toThrow(/event_respondent_no_user_check/);
  });
});

// Acceptance 4, the wiring: every event of a built story is called somewhere in the app. The
// guide's (E15-5): guide_shown through guideShown at each of the three places a card is drawn,
// guide_dismissed and guide_acted in the guide's actions, which the card calls on Dismiss and on
// its action. That each is written after its step is tested where the step is
// (respondent-submit.test.ts for response_started and response_submitted).
describe("the call sites", () => {
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${dir}/${e.name}`) : /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []));
  const source = files("src").filter((f) => !f.endsWith("analytics-catalogue.ts") && !f.endsWith("lib/analytics.ts")).map((f) => readFileSync(f, "utf8")).join("\n");
  it.each(Object.keys(EVENTS).filter((n) => !n.startsWith("guide_")))("%s is tracked", (name) => {
    expect(source).toContain(`track("${name}"`);
  });
  it("the guide's events are tracked where a card is drawn, dismissed or used", () => {
    const read = (f: string) => readFileSync(f, "utf8");
    for (const f of ["src/app/app/(shell)/page.tsx", "src/app/app/(shell)/projects/[projectId]/step-tip.tsx", "src/app/app/(shell)/projects/[projectId]/results/page.tsx"]) expect(read(f), f).toMatch(/await guideShown\(/);
    expect(read("src/lib/analytics.ts")).toContain('trackOncePerDay("guide_shown"');
    const actions = read("src/app/app/(shell)/guide-actions.ts");
    expect(actions).toContain('trackOncePerDay("guide_dismissed"');
    expect(actions).toContain('trackOncePerDay("guide_acted"');
    const card = read("src/components/app/guide-card.tsx");
    expect(card).toContain("await dismissTipAction(id)");
    expect(card).toContain("actedTipAction(id)");
    expect(card.match(/onClick=\{acted\}/g)).toHaveLength(2);
  });
});
