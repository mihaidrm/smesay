// The guide's rows (stories/E15-1 acceptance 4, E15-2 acceptance 5): the state is per person and
// a dismissal is kept once; the first-project facts come from fixed rows, are the person's own,
// ignore the sample and an imported project file, and never read another workspace.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "@/db/test-db";
import { firstProjectFacts, guide } from "@/db/queries/guide";
import { internal } from "@/db/queries/internal";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import { DEFAULT_FIELDS } from "@/lib/respondent-fields";

let sql: ReturnType<typeof postgres>;
const stamp = Date.now();
const userId = `guide-${stamp}`;
const otherId = `guide-b-${stamp}`;
let wsId: string;
let otherWs: string;

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  for (const id of [userId, otherId]) await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${id}, 'Guide', ${id + "@example.com"}, true, now(), now())`;
  wsId = (await createWorkspaceWithSample({ name: "Guide", slug: `guide-${stamp}` }, userId)).id;
  otherWs = (await createWorkspaceWithSample({ name: "Guide B", slug: `guide-b-${stamp}` }, otherId)).id;
  await sql`insert into workspace_member (workspace_id, user_id, role) values (${wsId}, ${otherId}, 'member')`;
}, 60_000);

afterAll(async () => {
  for (const w of [wsId, otherWs]) await internal.hardDeleteWorkspace(w);
  await sql`delete from "user" where id in (${userId}, ${otherId})`;
  await sql.end();
});

describe("the guide state", () => {
  it("starts on with nothing dismissed, keeps a dismissal once, switches, and is the person's own", async () => {
    expect(await guide.state(userId)).toEqual({ tipsOff: false, dismissed: [] });
    await guide.dismiss(userId, "import.empty");
    await guide.dismiss(userId, "import.empty");
    await guide.dismiss(userId, "path.start");
    expect((await guide.state(userId)).dismissed.sort()).toEqual(["import.empty", "path.start"]);
    await guide.setTipsOff(userId, true);
    expect(await guide.state(userId)).toMatchObject({ tipsOff: true });
    // Another person's state is untouched.
    expect(await guide.state(otherId)).toEqual({ tipsOff: false, dismissed: [] });
    // Tips back on keeps the dismissals.
    await guide.setTipsOff(userId, false);
    expect(await guide.state(userId)).toEqual({ tipsOff: false, dismissed: expect.arrayContaining(["import.empty", "path.start"]) });
    expect(await guide.state("nobody")).toEqual({ tipsOff: false, dismissed: [] });
  });
});

describe("firstProjectFacts", () => {
  const facts = (ws: string, user = userId) => firstProjectFacts(unsafeWorkspaceId(ws), user);
  const named = [{ key: "name", label: "Name", type: "text", mandatory: true }, { key: "team", label: "Team", type: "select", mandatory: true, options: ["Finance", "Sales"] }];

  it("ticks from the data, the person's own project, the sample ignored", async () => {
    // Only the sample (which has a set, a run and a published link): nothing of the person's own.
    expect(await facts(wsId)).toEqual({ project: null, hasSet: false, shaped: false, built: false, published: false, firstPublishedAt: null });
    const [{ id: p }] = await sql`insert into project (workspace_id, name, created_by) values (${wsId}, 'Own', ${userId}) returning id`;
    expect(await facts(wsId)).toMatchObject({ project: { id: p, name: "Own" }, hasSet: false });
    // Another member's newest project is not this person's.
    expect((await facts(wsId, otherId)).project).toBeNull();
    const [{ id: s }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${wsId}, ${p}, 1, 'pasted') returning id`;
    await sql`insert into item (workspace_id, item_set_id, position, original_text, reader_text) values (${wsId}, ${s}, 1, 'Photograph a receipt', 'Photograph a receipt')`;
    expect(await facts(wsId)).toMatchObject({ hasSet: true, shaped: false });
    await sql`update item_set set shape_runs = 1, shaped_at = now() where id = ${s}`;
    expect(await facts(wsId)).toMatchObject({ shaped: true, built: false });
    // Build: an intro and the default fields is not built; fields of the person's own are.
    const [{ id: i }] = await sql`insert into instrument (workspace_id, project_id, item_set_id, title, intro, respondent_fields) values (${wsId}, ${p}, ${s}, 'Own', 'What we plan to build next.', ${JSON.stringify(DEFAULT_FIELDS)}::jsonb) returning id`;
    expect((await facts(wsId)).built).toBe(false);
    await sql`update instrument set respondent_fields = ${JSON.stringify(named)}::jsonb where id = ${i}`;
    expect(await facts(wsId)).toMatchObject({ built: true, published: false, firstPublishedAt: null });
    // Share: an invite_sent event for the project (the publish writes it, E13-1).
    await sql`insert into event (workspace_id, user_id, name, properties) values (${wsId}, ${userId}, 'invite_sent', ${JSON.stringify({ kind: "public", project: p })}::jsonb)`;
    const f = await facts(wsId);
    expect(f.published).toBe(true);
    expect(f.firstPublishedAt).toBeInstanceOf(Date);
    // The workspace's first link counts for every member.
    expect((await facts(wsId, otherId)).firstPublishedAt).toEqual(f.firstPublishedAt);
  });

  it("does not count a project file imported with its old dates", async () => {
    const [{ id: p }] = await sql`insert into project (workspace_id, name, created_by, created_at) values (${otherWs}, 'Imported', ${otherId}, now()) returning id`;
    const [{ id: s }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${otherWs}, ${p}, 1, 'csv') returning id`;
    await sql`insert into instrument (workspace_id, project_id, item_set_id, title, intro, respondent_fields, published_at) values (${otherWs}, ${p}, ${s}, 'Imported', 'Old intro', ${JSON.stringify(named)}::jsonb, now() - interval '1 hour')`;
    expect(await facts(otherWs, otherId)).toMatchObject({ project: { name: "Imported" }, published: false, firstPublishedAt: null });
  });

  it("ticks Shape for a list that came with areas once the person has gone on to Build", async () => {
    const [{ id: p }] = await sql`insert into project (workspace_id, name, created_by, created_at) values (${wsId}, 'Areas', ${userId}, now() + interval '1 minute') returning id`;
    const [{ id: s }] = await sql`insert into item_set (workspace_id, project_id, version, source) values (${wsId}, ${p}, 1, 'csv') returning id`;
    await sql`insert into item (workspace_id, item_set_id, position, original_text, reader_text, area) values (${wsId}, ${s}, 1, 'Approve in one tap', 'Approve in one tap', 'Approval')`;
    expect(await facts(wsId)).toMatchObject({ project: { name: "Areas" }, hasSet: true, shaped: false });
    await sql`insert into instrument (workspace_id, project_id, item_set_id, title, respondent_fields) values (${wsId}, ${p}, ${s}, 'Areas', ${JSON.stringify(DEFAULT_FIELDS)}::jsonb)`;
    expect(await facts(wsId)).toMatchObject({ shaped: true });
  });

  it("reads workspace A only: B's projects, sets and events never count", async () => {
    // The same person's newer project and link in workspace B.
    const [{ id: pb }] = await sql`insert into project (workspace_id, name, created_by, created_at) values (${otherWs}, 'B newest', ${userId}, now() + interval '1 hour') returning id`;
    await sql`insert into event (workspace_id, user_id, name, properties) values (${otherWs}, ${userId}, 'invite_sent', ${JSON.stringify({ kind: "public", project: pb })}::jsonb)`;
    const a = await facts(wsId);
    expect(a.project?.name).toBe("Areas");
    const b = await facts(otherWs);
    expect(b).toMatchObject({ project: { id: pb }, published: true });
    // B's first link is B's: A's date is A's own event.
    const [{ at }] = await sql`select min(created_at) as at from event where workspace_id = ${wsId} and name = 'invite_sent'`;
    expect(a.firstPublishedAt?.getTime()).toBe(new Date(at).getTime());
  });
});
