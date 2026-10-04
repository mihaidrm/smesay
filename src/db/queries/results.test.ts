// Results numbers against the sample (stories/E8-1, acceptance 2, 3, 6 and 7): the strip from
// one SQL query, with no filter and with a role filter, the include-unsubmitted switch off and
// on (the in-progress respondent has 4 answers), every number reconciling with the answer rows
// the same filter keeps (the rows E10-1's CSV writes); another workspace reads nothing; the
// PM's choices kept per instrument. The expected counts are worked out from the fixture
// (src/db/seed/sample.ts), so the test reads the same story the boards tell.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "../test-db";
import { instruments, projects } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { results, resultsPrefs, tracker, type ResultRow } from "@/db/queries/results";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import { answers as fixture, expected, people, missingItem } from "@/db/seed/sample";
import type { WorkspaceId } from "@/db/types";
import type { ResultsFilter } from "@/lib/results-filter";

let sql: ReturnType<typeof postgres>;
const userId = `results-${Date.now()}`;
const made: string[] = [];
let wsA: WorkspaceId;
let wsB: WorkspaceId;
let instrumentA: string;

const NONE: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null };

async function sampleInstrument(ws: WorkspaceId): Promise<string> {
  const [project] = (await projects.list(ws)).filter((p) => p.isSample);
  return (await instruments.latestForProject(ws, project.id))!.id;
}

// The fixture's answers of the people `who` keeps, as kinds.
function fixtureKinds(who: (n: number) => boolean): string[] {
  return Object.values(fixture).flatMap((byPerson) => Object.entries(byPerson).filter(([n]) => who(Number(n))).map(([, a]) => a.kind));
}
const count = (kinds: string[], k: string) => kinds.filter((x) => x === k).length;
const submittedPeople = new Set<number>(people.filter((p) => p.status === "submitted").map((p) => p.n));

// What the rows add up to, as the strip counts them.
function tally(rows: ResultRow[]) {
  const k = (kind: string) => rows.filter((r) => r.kind === kind).length;
  return { agree: k("agree"), change: k("change"), disagree: k("disagree"), unclear: k("unclear"), pick: k("pick"), answered: rows.filter((r) => r.kind !== "pick").length, withComment: rows.filter((r) => r.reason !== null || r.comment !== null).length };
}

// Every tile of the strip, worked out again from the rows the same filter keeps: the answers,
// the people, the missing items and the instrument's items (acceptance 6).
async function reconcileStrip(ws: WorkspaceId, instrumentId: string, f: ResultsFilter) {
  const n = (await results.numbers(ws, instrumentId, f))!;
  const rows = await results.rows(ws, instrumentId, f);
  const who = await results.people(ws, instrumentId, f);
  const missing = await results.missing(ws, instrumentId, f);
  const itemIds = (await sql`select it.id from item it join instrument ins on ins.item_set_id = it.item_set_id where ins.id = ${instrumentId} and it.workspace_id = ${ws}`).map((r) => r.id as string);
  expect(tally(rows)).toEqual({ agree: n.agree, change: n.change, disagree: n.disagree, unclear: n.unclear, pick: n.pick, answered: n.answered, withComment: n.withComment });
  expect([who.length, who.filter((p) => p.submitted).length, who.filter((p) => !p.invited && !p.submitted).length, who.filter((p) => p.counted).length, missing.length])
    .toEqual([n.invited, n.submitted, n.inProgress, n.shown, n.missing]);
  const minutes = who.flatMap((p) => (p.minutesToSubmit === null ? [] : [p.minutesToSubmit])).sort((a, b) => a - b);
  const mid = minutes.length === 0 ? null : minutes.length % 2 ? minutes[(minutes.length - 1) / 2] : (minutes[minutes.length / 2 - 1] + minutes[minutes.length / 2]) / 2;
  expect(n.medianMinutes).toBe(mid === null ? null : Math.round(mid));
  const of = (id: string) => rows.filter((r) => r.itemId === id);
  expect([n.unansweredItems, n.fullyAgreed, n.pushedBackItems]).toEqual([
    itemIds.filter((id) => of(id).length === 0).length,
    itemIds.filter((id) => of(id).length > 0 && of(id).every((r) => r.kind === "agree")).length,
    itemIds.filter((id) => of(id).some((r) => r.kind === "change" || r.kind === "disagree")).length,
  ]);
  expect(rows.every((r) => r.submitted || f.includeUnsubmitted)).toBe(true);
}

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${userId}, 'Results', ${userId + "@example.com"}, true, now(), now())`;
  const stamp = Date.now();
  const a = await createWorkspaceWithSample({ name: "Results A", slug: `results-a-${stamp}` }, userId);
  const b = await createWorkspaceWithSample({ name: "Results B", slug: `results-b-${stamp}` }, userId);
  made.push(a.id, b.id);
  wsA = unsafeWorkspaceId(a.id);
  wsB = unsafeWorkspaceId(b.id);
  instrumentA = await sampleInstrument(wsA);
}, 60_000);

afterAll(async () => {
  for (const id of made) await internal.hardDeleteWorkspace(id);
  await sql`delete from "user" where id = ${userId}`;
  await sql.end();
});

describe("Results numbers", () => {
  it("counts the sample's submitted answers with the switch off, and adds the 4 unsubmitted ones with it on", async () => {
    const off = (await results.numbers(wsA, instrumentA, NONE))!;
    const kinds = fixtureKinds((n) => submittedPeople.has(n));
    expect(off).toMatchObject({
      invited: 7, submitted: expected.submitted, inProgress: 1, shown: 5, total: 5,
      agree: expected.agree, change: expected.change, disagree: expected.disagree, unclear: expected.unclear, pick: 0, answered: expected.submittedAnswers,
      withComment: expected.change + expected.disagree + expected.unclear, missing: expected.missing, actions: expected.insights, anyAnswer: true,
    });
    expect([off.agree, off.answered, kinds.length]).toEqual([19, 30, 30]);
    const on = (await results.numbers(wsA, instrumentA, { ...NONE, includeUnsubmitted: true }))!;
    const all = fixtureKinds(() => true);
    expect(on).toMatchObject({ invited: 7, submitted: 5, inProgress: 1, shown: 6, total: 6, answered: expected.answers, agree: count(all, "agree"), change: count(all, "change") });
    expect(on.answered - off.answered).toBe(4);
    // Every item has an answer; items with a different priority or disagree, and items every
    // answer agrees with, from the fixture.
    const items = Object.entries(fixture);
    const pushed = items.filter(([, byPerson]) => Object.entries(byPerson).some(([n, a]) => submittedPeople.has(Number(n)) && (a.kind === "change" || a.kind === "disagree"))).length;
    const fully = items.filter(([, byPerson]) => Object.entries(byPerson).filter(([n]) => submittedPeople.has(Number(n))).every(([, a]) => a.kind === "agree")).length;
    expect([off.unansweredItems, off.pushedBackItems, off.fullyAgreed]).toEqual([0, pushed, fully]);
  });

  it("narrows to the people a filter keeps, and the rows add up to the strip", async () => {
    const sales: ResultsFilter = { ...NONE, fields: { role: ["Sales"] } };
    const n = (await results.numbers(wsA, instrumentA, sales))!;
    const salesPeople = people.filter((p) => p.role === "Sales");
    const kinds = fixtureKinds((x) => submittedPeople.has(x) && salesPeople.some((p) => p.n === x));
    // Ioana and Tom submitted; Elena was invited and has not opened the link.
    expect(n).toMatchObject({ invited: salesPeople.length, submitted: 2, inProgress: 0, shown: 2, total: 5, agree: count(kinds, "agree"), change: count(kinds, "change"), answered: kinds.length });
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }, sales, { ...sales, includeUnsubmitted: true }, { ...NONE, kinds: ["disagree" as const] }, { ...NONE, withComment: true }, { ...NONE, kinds: ["none" as const] }]) {
      await reconcileStrip(wsA, instrumentA, f);
    }
  });

  it("reconciles with a started response that has no answer, and an invite whose email never went out", async () => {
    const stamp = Date.now();
    const d = await createWorkspaceWithSample({ name: "Results D", slug: `results-d-${stamp}` }, userId);
    made.push(d.id);
    const wsD = unsafeWorkspaceId(d.id);
    const instrumentD = await sampleInstrument(wsD);
    const [{ public_invite, item_set_id }] = await sql`select i.id as public_invite, ins.item_set_id from invite i join instrument ins on ins.id = i.instrument_id where ins.id = ${instrumentD} and i.kind = 'public'`;
    await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, fields) values (${wsD}, ${instrumentD}, ${item_set_id}, ${public_invite}, ${"e".repeat(40)}, '{"name": "Empty Start"}'::jsonb)`;
    await sql`insert into invite (workspace_id, instrument_id, kind, token, email, name, send_error) values (${wsD}, ${instrumentD}, 'personal', ${"f".repeat(40)}, 'bounced@marlow.example', 'Bo Unced', 'Mailbox does not exist')`;
    const on = (await results.numbers(wsD, instrumentD, { ...NONE, includeUnsubmitted: true }))!;
    // The empty start is in progress and shown; the bounced invite reached nobody.
    expect([on.invited, on.inProgress, on.shown]).toEqual([8, 2, 7]);
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }, { ...NONE, kinds: ["none" as const], includeUnsubmitted: true }, { ...NONE, fields: { name: "empty" }, includeUnsubmitted: true }]) {
      await reconcileStrip(wsD, instrumentD, f);
    }
  });

  it("keeps people by answer kind, comment, text field and status", async () => {
    const disagreed = people.filter((p) => submittedPeople.has(p.n) && Object.values(fixture).some((byPerson) => byPerson[p.n]?.kind === "disagree"));
    expect((await results.numbers(wsA, instrumentA, { ...NONE, kinds: ["disagree"] }))!.shown).toBe(disagreed.length);
    // Not answered: Sam (4 of 6) and Elena (not opened); with the switch off, Sam's answers do
    // not count, but both are among the invited.
    const notAnswered = (await results.numbers(wsA, instrumentA, { ...NONE, kinds: ["none"] }))!;
    expect([notAnswered.invited, notAnswered.submitted, notAnswered.inProgress, notAnswered.answered]).toEqual([2, 0, 1, 0]);
    // Text fields match the words they contain, in any case.
    expect((await results.numbers(wsA, instrumentA, { ...NONE, fields: { name: "okafor" } }))!).toMatchObject({ invited: 1, submitted: 1, missing: missingItem.person === 3 ? 1 : 0 });
    expect((await results.numbers(wsA, instrumentA, { ...NONE, status: ["inProgress"], includeUnsubmitted: true }))!).toMatchObject({ invited: 1, shown: 1, answered: 4 });
    expect((await results.numbers(wsA, instrumentA, { ...NONE, fields: { role: ["HR"] }, kinds: ["unclear"] }))!.invited).toBe(0);
  });

  it("reads nothing of another workspace's instrument", async () => {
    expect(await results.numbers(wsB, instrumentA, NONE)).toBeNull();
    expect(await results.rows(wsB, instrumentA, { ...NONE, includeUnsubmitted: true })).toEqual([]);
    expect(await results.people(wsB, instrumentA, { ...NONE, includeUnsubmitted: true })).toEqual([]);
    expect(await results.missing(wsB, instrumentA, { ...NONE, includeUnsubmitted: true })).toEqual([]);
    expect(await results.numbers(wsA, "not-a-uuid", NONE)).toBeNull();
  });

  it("keeps the PM's tiles and switch per instrument", async () => {
    expect(await resultsPrefs.get(userId, instrumentA)).toEqual({});
    await resultsPrefs.set(userId, instrumentA, { tiles: ["agreement", "missing"] });
    await resultsPrefs.set(userId, instrumentA, { includeUnsubmitted: false });
    expect(await resultsPrefs.get(userId, instrumentA)).toEqual({ tiles: ["agreement", "missing"], includeUnsubmitted: false });
    expect(await resultsPrefs.get(userId, await sampleInstrument(wsB))).toEqual({});
  });
});

describe("the Responses tab", () => {
  const keys = ["name", "role"];
  it("lists everyone the filter keeps, with status, progress, source and reminders", async () => {
    const all = await tracker.people(wsA, instrumentA, NONE, keys);
    expect(all.map((p) => p.fields.name)).toEqual(["Dana Okafor", "Elena Costa", "Ioana Marin", "Lukas Berg", "Priya Nair", "Sam Hill", "Tom Reyes"]);
    const by = (name: string) => all.find((p) => p.fields.name === name)!;
    expect(by("Sam Hill")).toMatchObject({ status: "inProgress", answered: 4, visible: 6, source: "personal", reminders: 1, submittedAt: null });
    expect(by("Elena Costa")).toMatchObject({ status: "invited", answered: 0, visible: 6, reminders: 1, fields: { name: "Elena Costa", role: "Sales" } });
    expect(by("Dana Okafor")).toMatchObject({ status: "submitted", source: "public", reminders: null, changedSince: false, submittedAgain: false, anon: null });
    // The fixture's reasons: Lukas gave a reason on every answer that is not agree.
    const lukas = Object.values(fixture).map((byPerson) => byPerson[4]).filter((a) => a && a.kind !== "agree").length;
    expect(by("Lukas Berg").withComment).toBe(lukas);
    // The role filter Sales: Ioana and Tom submitted, Elena invited (E8-2, acceptance 6).
    expect((await tracker.people(wsA, instrumentA, { ...NONE, fields: { role: ["Sales"] } }, keys)).map((p) => p.fields.name)).toEqual(["Elena Costa", "Ioana Marin", "Tom Reyes"]);
  });

  it("sorts by any column, both ways, from its own list only", async () => {
    const order = async (key: string, dir: "asc" | "desc") => (await tracker.people(wsA, instrumentA, { ...NONE, sort: { key, dir } }, keys)).map((p) => p.fields.name);
    const submitted = people.filter((p) => p.submittedAt).sort((a, b) => a.submittedAt!.localeCompare(b.submittedAt!)).map((p) => p.name);
    expect((await order("submitted", "asc")).slice(0, 5)).toEqual(submitted);
    expect((await order("submitted", "desc")).slice(0, 5)).toEqual([...submitted].reverse());
    expect((await order("field.role", "asc"))[0]).toBe("Lukas Berg");
    expect((await order("status", "asc"))[0]).toBe("Elena Costa");
    expect((await order("progress", "desc")).at(-1)).toBe("Elena Costa");
    // An unknown column, or a field the instrument does not have, sorts by name.
    expect(await order("drop table", "asc")).toEqual(await order("name", "asc"));
    expect(await order("field.secret", "asc")).toEqual(await order("name", "asc"));
  });

  it("numbers nameless responses and answers 500 people from SQL under 500 ms", async () => {
    const instrumentB = await sampleInstrument(wsB);
    const [{ public_invite, item_set_id }] = await sql`select i.id as public_invite, ins.item_set_id from invite i join instrument ins on ins.id = i.instrument_id where ins.id = ${instrumentB} and i.kind = 'public'`;
    // 500 nameless public responses, each with an answer to every item.
    await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, fields, created_at)
      select ${wsB}, ${instrumentB}, ${item_set_id}, ${public_invite}, md5(random()::text) || md5(g::text), '{}'::jsonb, now() + make_interval(secs => g)
      from generate_series(1, 500) g`;
    await sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind, value, reason)
      select ${wsB}, r.id, r.item_set_id, it.id, 'change', 'S', 'A reason.'
      from response r join item it on it.item_set_id = r.item_set_id
      where r.workspace_id = ${wsB} and r.instrument_id = ${instrumentB} and r.fields = '{}'::jsonb`;
    const started = performance.now();
    const rows = await tracker.people(wsB, instrumentB, { ...NONE, sort: { key: "progress", dir: "desc" } }, keys);
    const took = performance.now() - started;
    expect(rows.length).toBe(507);
    expect(took).toBeLessThan(500);
    const anon = (await tracker.people(wsB, instrumentB, { ...NONE, sort: { key: "name", dir: "asc" } }, keys)).filter((p) => p.anon !== null).map((p) => p.anon);
    expect([anon[0], anon.at(-1), anon.length]).toEqual([1, 500, 500]);
  }, 60_000);
});
