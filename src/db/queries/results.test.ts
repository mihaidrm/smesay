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
import { proposedCode } from "@/lib/scoring";
import { figureOf, percentOf } from "@/lib/results-agreement";
import { isComplete } from "@/lib/respondent-rules";
import { instruments, projects } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { agreement, detail, gaps, registers, results, resultsPrefs, tracker, type ItemCounts, type ResultRow } from "@/db/queries/results";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import { answers as fixture, expected, people, missingItem } from "@/db/seed/sample";
import type { WorkspaceId } from "@/db/types";
import type { ResultsFilter } from "@/lib/results-filter";
import { exportTable } from "@/lib/export/files";
import { perItem } from "@/lib/export/per-item";
import { insights } from "@/db/queries/insights";
import { resultsContext } from "@/lib/results-context";
import { RESULTS_COPY } from "@/lib/results-copy";
import { EXPORT_COPY } from "@/lib/export/copy";

let sql: ReturnType<typeof postgres>;
const userId = `results-${Date.now()}`;
const made: string[] = [];
let wsA: WorkspaceId;
let wsB: WorkspaceId;
let instrumentA: string;

const NONE: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null, split: null, gaps: null };

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
  // An item fewer than 3 counted people could see under Names hidden and Anonymous is none of
  // the strip's items (E5-7, D).
  const few = new Set((await agreement.byItem(ws, instrumentId, f)).filter((c) => c.few).map((c) => c.itemId));
  const itemIds = (await sql`select it.id from item it join instrument ins on ins.item_set_id = it.item_set_id where ins.id = ${instrumentId} and it.workspace_id = ${ws}`).map((r) => r.id as string).filter((id) => !few.has(id));
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
    // The sample's Dana (public link, named, started first) holds number 1 unseen.
    const anon = (await tracker.people(wsB, instrumentB, { ...NONE, sort: { key: "name", dir: "asc" } }, keys)).filter((p) => p.anon !== null).map((p) => p.anon);
    expect([anon[0], anon.at(-1), anon.length]).toEqual([2, 501, 500]);
  }, 60_000);

  it("lists the people the strip counts, and the comment column adds up to its tile", async () => {
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }, { ...NONE, fields: { role: ["Sales"] } }, { ...NONE, kinds: ["change" as const] }, { ...NONE, withComment: true, includeUnsubmitted: true }]) {
      const n = (await results.numbers(wsA, instrumentA, f))!;
      const rows = await tracker.people(wsA, instrumentA, f, keys);
      expect(rows.map((p) => p.id).sort()).toEqual((await results.people(wsA, instrumentA, f)).map((p) => p.id).sort());
      expect(rows.reduce((a, p) => a + p.withComment, 0)).toBe(n.withComment);
    }
  });

  it("marks changes after Submit, counts complete answers to the items seen, and names every row", async () => {
    const e = await createWorkspaceWithSample({ name: "Results E", slug: `results-e-${Date.now()}` }, userId);
    made.push(e.id);
    const wsE = unsafeWorkspaceId(e.id);
    const instrumentE = await sampleInstrument(wsE);
    const [{ public_invite, item_set_id }] = await sql`select i.id as public_invite, ins.item_set_id from invite i join instrument ins on ins.id = i.instrument_id where ins.id = ${instrumentE} and i.kind = 'public'`;
    const responseOf = async (name: string) => (await sql`select id from response where workspace_id = ${wsE} and fields ->> 'name' = ${name}`)[0].id as string;
    const itemOf = async (ref: string) => (await sql`select id from item where workspace_id = ${wsE} and item_set_id = ${item_set_id} and source_ref = ${ref}`)[0].id as string;
    // Ioana changed an answer after Submit and has not submitted again; Tom submitted again.
    await sql`update response set signed_off = false where id = ${await responseOf("Ioana Marin")}`;
    await sql`update response set signed_off = true, updated_at = first_submitted_at + interval '1 hour' where id = ${await responseOf("Tom Reyes")}`;
    // CL-01 is for Finance only: Lukas no longer sees it, so his answer to it is not progress.
    await sql`update item set perspectives = array['Finance'] where id = ${await itemOf("CL-01")}`;
    await sql`update response set perspectives = array['Finance'] where id = ${await responseOf("Dana Okafor")}`;
    // Sam (who no longer sees CL-01 either): a Disagree with no reason and an Unclear with a
    // blank question are not complete.
    const sam = await responseOf("Sam Hill");
    await sql`update answer set kind = 'disagree', value = null, reason = null where response_id = ${sam} and item_id = ${await itemOf("CL-04")}`;
    await sql`update answer set kind = 'unclear', value = null, reason = '   ' where response_id = ${sam} and item_id = ${await itemOf("CL-02")}`;
    await sql`update answer set kind = 'change', value = 'M', reason = 'Payroll first.' where response_id = ${sam} and item_id = ${await itemOf("CL-03")}`;
    // Personal invites with no name: one not started, one started without a name field.
    const [{ id: cy }] = await sql`insert into invite (workspace_id, instrument_id, kind, token, email, sent_at) values (${wsE}, ${instrumentE}, 'personal', md5(random()::text) || 'cy', 'cy@x.example', now()) returning id`;
    await sql`insert into invite (workspace_id, instrument_id, kind, token, email, sent_at) values (${wsE}, ${instrumentE}, 'personal', md5(random()::text) || 'bo', 'bo@x.example', now())`;
    await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, fields) values (${wsE}, ${instrumentE}, ${item_set_id}, ${cy}, md5(random()::text) || md5('cy'), '{}'::jsonb)`;
    // Three public-link responses with no name, in the HR role.
    await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, fields, created_at)
      select ${wsE}, ${instrumentE}, ${item_set_id}, ${public_invite}, md5(random()::text) || md5(g::text), '{"role": "HR"}'::jsonb, timestamptz '2030-01-01' + make_interval(secs => g)
      from generate_series(1, 3) g`;

    const all = await tracker.people(wsE, instrumentE, { ...NONE, includeUnsubmitted: true }, keys);
    const by = (who: string) => all.find((p) => p.who === who)!;
    expect(by("Ioana Marin")).toMatchObject({ changedSince: true, submittedAgain: false });
    expect(by("Tom Reyes")).toMatchObject({ changedSince: false, submittedAgain: true });
    expect(by("Lukas Berg")).toMatchObject({ answered: 5, visible: 5 });
    expect(by("Dana Okafor")).toMatchObject({ answered: 6, visible: 6 });
    expect(by("Sam Hill")).toMatchObject({ answered: 1, visible: 5, withComment: 2 });
    expect((await tracker.people(wsE, instrumentE, NONE, keys)).find((p) => p.who === "Sam Hill")!.withComment).toBe(0);
    // E5-2, acceptance 6 (design note 98): Progress follows the instrument's reason rule, as
    // the respondent's own count does (isComplete on the same answers to the items Sam sees).
    const samRows = await sql`select a.kind, a.value, a.reason, a.comment from answer a join item it on it.id = a.item_id where a.response_id = ${sam} and cardinality(it.perspectives) = 0`;
    const samAnswered = async () => (await tracker.people(wsE, instrumentE, { ...NONE, includeUnsubmitted: true }, keys)).find((p) => p.who === "Sam Hill")!.answered;
    for (const rule of ["never", "always", "differs"] as const) {
      await sql`update instrument set reason_rule = ${rule} where id = ${instrumentE}`;
      expect(await samAnswered(), rule).toBe(samRows.filter((r) => isComplete({ kind: r.kind, value: r.value, reason: r.reason, comment: r.comment }, rule)).length);
    }
    await sql`update instrument set reason_rule = 'never' where id = ${instrumentE}`;
    expect(await samAnswered()).toBe(samRows.length);
    await sql`update instrument set reason_rule = 'differs' where id = ${instrumentE}`;
    expect(by("cy@x.example")).toMatchObject({ status: "inProgress", anon: null, source: "personal" });
    expect(by("bo@x.example")).toMatchObject({ status: "invited", anon: null });
    // The Name filter finds what the tab shows.
    expect((await tracker.people(wsE, instrumentE, { ...NONE, fields: { name: "x.example" } }, keys)).map((p) => p.who).sort()).toEqual(["bo@x.example", "cy@x.example"]);
    const nameless = () => tracker.people(wsE, instrumentE, { ...NONE, sort: { key: "name", dir: "asc" } }, keys).then((rows) => rows.filter((p) => p.who === null).map((p) => p.anon));
    const [a, b, c] = await nameless();
    expect(b! - a!).toBe(1);
    expect(c! - b!).toBe(1);
    // A filter, or a name added by the first, moves no number.
    expect((await tracker.people(wsE, instrumentE, { ...NONE, fields: { role: ["HR"] } }, keys)).filter((p) => p.who === null).map((p) => p.anon)).toEqual([a, b, c]);
    await sql`update response set fields = '{"name": "Ana Pop", "role": "HR"}'::jsonb where workspace_id = ${wsE} and instrument_id = ${instrumentE} and created_at = timestamptz '2030-01-01' + interval '1 second'`;
    expect(await nameless()).toEqual([b, c]);
  });

  it("reads nothing of another workspace's instrument", async () => {
    expect(await tracker.people(wsB, instrumentA, { ...NONE, includeUnsubmitted: true }, keys)).toEqual([]);
  });

  it("sorts on its own columns only, never on a member every object has", async () => {
    const order = async (key: string) => (await tracker.people(wsA, instrumentA, { ...NONE, sort: { key, dir: "asc" } }, keys)).map((p) => p.id);
    expect(await order("constructor")).toEqual(await order("name"));
  });
});

describe("the Agreement tab's numbers", () => {
  // Every count per item (and group) equals the answer rows the same filter keeps, filtered to
  // that item (E8-3, acceptance 7): the CSV cells reconcile with the screen.
  async function reconcile(ws: WorkspaceId, instrumentId: string, f: ResultsFilter, split: string | null) {
    const byItem = await agreement.byItem(ws, instrumentId, f, split);
    const rows = await results.rows(ws, instrumentId, f);
    const responses = new Map((await sql`select id, fields, perspectives from response where workspace_id = ${ws} and instrument_id = ${instrumentId}`).map((r) => [r.id as string, { fields: r.fields as Record<string, string>, perspectives: r.perspectives as string[] }]));
    const itemPerspectives = new Map((await sql`select it.id, it.perspectives from item it join instrument ins on ins.item_set_id = it.item_set_id where ins.id = ${instrumentId} and it.workspace_id = ${ws}`).map((r) => [r.id as string, r.perspectives as string[]]));
    const counted = (await results.people(ws, instrumentId, f)).filter((p) => p.counted).map((p) => p.id);
    const groupOf = (responseId: string) => (split === null ? null : (responses.get(responseId)?.fields[split] || null));
    const sees = (responseId: string, itemId: string) => { const its = itemPerspectives.get(itemId) ?? []; return its.length === 0 || its.some((x) => responses.get(responseId)!.perspectives.includes(x)); };
    for (const c of byItem) {
      const mine = rows.filter((r) => r.itemId === c.itemId && groupOf(r.responseId) === c.group);
      const k = (kind: string) => mine.filter((r) => r.kind === kind).length;
      expect([c.agree, c.change, c.disagree, c.unclear, c.pick]).toEqual([k("agree"), k("change"), k("disagree"), k("unclear"), k("pick")]);
      const answered = c.agree + c.change + c.disagree + c.unclear;
      expect(c.percent).toBe(answered === 0 ? null : Math.round((100 * c.agree) / answered));
      // The screen's rule (src/lib/results-agreement.ts percentOf) gives the SQL's number.
      expect(percentOf(c)).toBe(c.percent);
      // The values per code, and the people of the cell who could see the item (Not answered
      // is those people less the answers).
      const codes: Record<string, number> = {};
      for (const r of mine) if (r.value !== null) codes[r.value] = (codes[r.value] ?? 0) + 1;
      expect(c.values).toEqual(codes);
      expect(c.couldSee).toBe(counted.filter((id) => groupOf(id) === c.group && sees(id, c.itemId)).length);
    }
    // Every answer row lands in one cell.
    expect(byItem.reduce((a, c) => a + c.agree + c.change + c.disagree + c.unclear + c.pick, 0)).toBe(rows.length);
    return byItem;
  }
  const sum = (cs: ItemCounts[], k: "agree" | "change" | "disagree" | "unclear") => cs.reduce((a, c) => a + c[k], 0);

  it("counts the sample per item, and the list adds up to the strip", async () => {
    const cs = await reconcile(wsA, instrumentA, NONE, null);
    expect(cs).toHaveLength(6);
    expect([sum(cs, "agree"), sum(cs, "change"), sum(cs, "disagree"), sum(cs, "unclear")]).toEqual([expected.agree, expected.change, expected.disagree, expected.unclear]);
    // Every one of the five submitted people could see every item (no perspectives).
    expect(cs.every((c) => c.couldSee === 5)).toBe(true);
    for (const f of [{ ...NONE, includeUnsubmitted: true }, { ...NONE, fields: { role: ["Sales"] } }, { ...NONE, fields: { role: ["Sales"] }, includeUnsubmitted: true }]) {
      const n = (await results.numbers(wsA, instrumentA, f))!;
      const per = await reconcile(wsA, instrumentA, f, null);
      expect([sum(per, "agree"), sum(per, "change")]).toEqual([n.agree, n.change]);
      await reconcile(wsA, instrumentA, f, "role");
    }
    // Split by role: one row per item and role among the people counted.
    const split = await reconcile(wsA, instrumentA, NONE, "role");
    expect(new Set(split.map((c) => c.group))).toEqual(new Set(["Sales", "Finance", "Engineering manager", "HR"]));
  });

  it("reconciles 600 generated responses in every view's query under 500 ms", async () => {
    const stamp = Date.now();
    const c = await createWorkspaceWithSample({ name: "Results C", slug: `results-c-${stamp}` }, userId);
    made.push(c.id);
    const wsC = unsafeWorkspaceId(c.id);
    const instrumentC = await sampleInstrument(wsC);
    const [{ public_invite, item_set_id }] = await sql`select i.id as public_invite, ins.item_set_id from invite i join instrument ins on ins.id = i.instrument_id where ins.id = ${instrumentC} and i.kind = 'public'`;
    await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, fields, submitted_at, first_submitted_at, signed_off)
      select ${wsC}, ${instrumentC}, ${item_set_id}, ${public_invite}, md5(random()::text) || md5(g::text),
          jsonb_build_object('name', 'Person ' || g, 'role', (array['Sales', 'Finance', 'HR', 'Engineering manager', 'Office manager'])[1 + g % 5]),
          case when g % 4 = 0 then null else now() end, case when g % 4 = 0 then null else now() end, g % 4 <> 0
      from generate_series(1, 600) g`;
    await sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind, value, reason)
      select ${wsC}, r.id, r.item_set_id, it.id, k.kind, case k.kind when 'agree' then 'S' when 'change' then 'M' when 'disagree' then 'W' end, case when k.kind = 'agree' then null else 'Because.' end
      from response r join item it on it.item_set_id = r.item_set_id
        cross join lateral (select (array['agree', 'agree', 'change', 'disagree', 'unclear'])[1 + abs(hashtext(r.id::text || it.id::text)) % 5] as kind) k
      where r.workspace_id = ${wsC} and r.instrument_id = ${instrumentC} and r.fields ? 'role' and r.fields ->> 'name' like 'Person %' and abs(hashtext(r.id::text || it.id::text)) % 7 <> 0`;
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }, { ...NONE, fields: { role: ["Sales"] } }, { ...NONE, fields: { role: ["Sales"] }, includeUnsubmitted: true }]) {
      for (const split of [null, "role"]) {
        const started = performance.now();
        await agreement.byItem(wsC, instrumentC, f, split);
        expect(performance.now() - started).toBeLessThan(500);
        await reconcile(wsC, instrumentC, f, split);
      }
      // E10-1: the Answers file added up per item equals the Items with totals file, cell by cell.
      const inst = (await instruments.get(wsC, instrumentC))!;
      const ctxC = { fields: inst.respondentFields, perspectives: inst.perspectives, anonymity: inst.anonymity };
      const files = await Promise.all([exportTable(wsC, inst, "answers", f, ctxC, false), exportTable(wsC, inst, "items", f, ctxC, false)]);
      for (const [k, [fromAnswers, fromItems]] of perItem(files[0], files[1])) expect(fromAnswers, k).toEqual(fromItems);
      // The item detail (E8-5) on the same rows.
      const cl04 = (await sql`select it.id from item it where it.workspace_id = ${wsC} and it.item_set_id = ${item_set_id} and it.source_ref = 'CL-04'`)[0].id as string;
      const started = performance.now();
      const one = await detail.item(wsC, instrumentC, cl04, f);
      expect(performance.now() - started).toBeLessThan(500);
      const c = (await agreement.byItem(wsC, instrumentC, f, null)).find((x) => x.itemId === cl04)!;
      expect([one!.counts.agree, one!.counts.change, one!.counts.disagree, one!.counts.unclear]).toEqual([c.agree, c.change, c.disagree, c.unclear]);
      // Where groups disagree (E8-6) runs on every render of the Agreement tab.
      const startedGaps = performance.now();
      const byRole = await gaps.byField(wsC, instrumentC, f, "role");
      expect(performance.now() - startedGaps).toBeLessThan(500);
      expect(byRole).toHaveLength(6);
    }
  }, 120_000);

  it("counts a rate-blind list as values rated, the perspectives' coverage, and an empty split field", async () => {
    const g = await createWorkspaceWithSample({ name: "Results G", slug: `results-g-${Date.now()}` }, userId);
    made.push(g.id);
    const wsG = unsafeWorkspaceId(g.id);
    const instrumentG = await sampleInstrument(wsG);
    // Rate-blind (E5-2): every answer but a question becomes the value rated with no proposal
    // (the proposal for an agree, the value picked for a different priority, Not needed for a
    // disagree).
    await sql`update instrument set show_proposed = false, perspectives = '["Finance", "Sales"]'::jsonb where id = ${instrumentG}`;
    await sql`update answer set kind = 'pick', value = case answer.kind when 'agree' then it.proposed_value when 'disagree' then 'W' else answer.value end
      from item it where it.id = answer.item_id and answer.workspace_id = ${wsG} and answer.kind <> 'unclear'`;
    // CL-05 is for Finance only; Dana is Finance; Tom left his role empty.
    await sql`update item set perspectives = array['Finance'] where workspace_id = ${wsG} and source_ref = 'CL-05'`;
    await sql`update response set perspectives = array['Finance'] where workspace_id = ${wsG} and fields ->> 'name' = 'Dana Okafor'`;
    await sql`update response set fields = fields - 'role' where workspace_id = ${wsG} and fields ->> 'name' = 'Tom Reyes'`;
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }]) for (const split of [null, "role"]) await reconcile(wsG, instrumentG, f, split);
    const ref = new Map((await sql`select id, source_ref from item where workspace_id = ${wsG}`).map((r) => [r.id as string, r.source_ref as string]));
    const cs = await agreement.byItem(wsG, instrumentG, NONE, null);
    const cl05 = cs.find((c) => ref.get(c.itemId) === "CL-05")!;
    // Only Dana sees CL-05 among the five who submitted.
    expect(cl05.couldSee).toBe(1);
    const cl01 = cs.find((c) => ref.get(c.itemId) === "CL-01")!;
    expect([cl01.agree, cl01.change, cl01.pick > 0, figureOf({ ...cl01 })]).toEqual([0, 0, true, { rated: cl01.pick }]);
    // Tom is in the empty group of the split, and the groups add up to the item.
    const split = (await agreement.byItem(wsG, instrumentG, NONE, "role")).filter((c) => c.itemId === cl01.itemId);
    expect(split.some((c) => c.group === null)).toBe(true);
    expect(split.reduce((a, c) => a + c.pick + c.agree + c.change + c.disagree + c.unclear, 0)).toBe(cl01.pick + cl01.change + cl01.disagree + cl01.unclear);
  });

  it("reads nothing of another workspace's instrument", async () => {
    expect(await agreement.byItem(wsB, instrumentA, { ...NONE, includeUnsubmitted: true })).toEqual([]);
    expect(await agreement.byItem(wsB, instrumentA, { ...NONE, includeUnsubmitted: true }, "role")).toEqual([]);
  });
});

describe("the registers", () => {
  const keys = ["name", "role"];
  it("count what the strip counts, under any filter", async () => {
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }, { ...NONE, fields: { role: ["Sales"] } }, { ...NONE, withComment: true }, { ...NONE, kinds: ["unclear" as const] }]) {
      const n = (await results.numbers(wsA, instrumentA, f))!;
      const pushed = await registers.answers(wsA, instrumentA, f, ["change", "disagree"], keys, "moscow");
      const unclear = await registers.answers(wsA, instrumentA, f, ["unclear"], keys, "moscow");
      const missing = await registers.missing(wsA, instrumentA, f, keys, "moscow");
      expect([pushed.filter((r) => r.kind === "change").length, pushed.filter((r) => r.kind === "disagree").length, unclear.length, missing.length]).toEqual([n.change, n.disagree, n.unclear, n.missing]);
    }
    // The fixture's missing item, with Dana's role.
    const [m] = await registers.missing(wsA, instrumentA, NONE, keys, "moscow");
    expect([m.text, m.area, m.fields.name, m.fields.role, m.submitted]).toEqual([missingItem.text, missingItem.suggestedArea, "Dana Okafor", "Finance", true]);
  });

  it("sort by any column, both ways, ties in the list's order", async () => {
    const names = async (key: string, dir: "asc" | "desc") => (await registers.answers(wsA, instrumentA, { ...NONE, sort: { key, dir } }, ["change"], keys, "moscow")).map((r) => r.fields.name);
    const asc = await names("respondent", "asc");
    expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b)));
    // Descending is the exact reverse: the ties (one person's answers) fall back to the list's
    // order in the same direction.
    expect(await names("respondent", "desc")).toEqual([...asc].reverse());
    const byItem = (await registers.answers(wsA, instrumentA, NONE, ["change"], keys, "moscow")).map((r) => r.reference);
    expect(byItem).toEqual([...byItem].sort());
    expect(await names("drop table", "asc")).toEqual((await registers.answers(wsA, instrumentA, NONE, ["change"], keys, "moscow")).map((r) => r.fields.name));
    expect(await names("constructor", "asc")).toEqual(await names("item", "asc"));
    // The name shown is the tracker's.
    expect((await registers.answers(wsA, instrumentA, NONE, ["change"], keys, "moscow")).every((r) => r.who === r.fields.name)).toBe(true);
  });

  it("sort the value columns in the scale's order, every other column both ways", async () => {
    const rows = async (key: string, dir: "asc" | "desc", kinds: ("change" | "disagree" | "unclear")[] = ["change"]) => registers.answers(wsA, instrumentA, { ...NONE, sort: { key, dir } }, kinds, keys, "moscow");
    // The scale's place; an empty value last, as the registers put it.
    const place = (code: string | null) => { const i = ["M", "S", "C", "W"].indexOf(code ?? ""); return i < 0 ? 99 : i; };
    // Their value: Must before Should before Could, not by the stored letter.
    const byValue = (await rows("value", "asc")).map((r) => place(r.value));
    expect(byValue).toEqual([...byValue].sort((a, b) => a - b));
    expect((await rows("value", "desc")).map((r) => place(r.value))).toEqual([...byValue].sort((a, b) => b - a));
    // Proposed: the item's proposal read through the scale.
    const byProposed = (await rows("proposed", "asc")).map((r) => place(proposedCode("moscow", r.proposedValue)));
    expect(byProposed).toEqual([...byProposed].sort((a, b) => a - b));
    for (const key of ["reason", "field.role", "item"]) {
      const asc = (await rows(key, "asc", ["change", "disagree", "unclear"])).map((r) => r.id);
      const desc = (await rows(key, "desc", ["change", "disagree", "unclear"])).map((r) => r.id);
      expect(desc).toEqual([...asc].reverse());
    }
    expect((await rows("reason", "asc")).map((r) => r.reason!.toLowerCase())).toEqual((await rows("reason", "asc")).map((r) => r.reason!.toLowerCase()).sort());
  });

  it("mark answers not submitted and answers changed after Submit, and sort the missing items", async () => {
    const h = await createWorkspaceWithSample({ name: "Results H", slug: `results-h-${Date.now()}` }, userId);
    made.push(h.id);
    const wsH = unsafeWorkspaceId(h.id);
    const instrumentH = await sampleInstrument(wsH);
    const responseOf = async (name: string) => (await sql`select id from response where workspace_id = ${wsH} and fields ->> 'name' = ${name}`)[0].id as string;
    // Sam (in progress) disagrees on CL-02; Tom changed an answer after Submit (E7-6).
    const sam = await responseOf("Sam Hill");
    await sql`update answer set kind = 'disagree', value = null, reason = 'Not for us.' where response_id = ${sam} and item_id = (select id from item where workspace_id = ${wsH} and source_ref = 'CL-02')`;
    await sql`update response set signed_off = false where id = ${await responseOf("Tom Reyes")}`;
    const on = { ...NONE, includeUnsubmitted: true };
    const rows = await registers.answers(wsH, instrumentH, on, ["change", "disagree"], keys, "moscow");
    expect(rows.filter((r) => r.who === "Sam Hill").map((r) => [r.kind, r.submitted, r.changedSince])).toEqual([["disagree", false, false]]);
    expect(rows.filter((r) => r.who === "Tom Reyes").every((r) => r.submitted && r.changedSince)).toBe(true);
    expect(rows.filter((r) => r.who === "Ioana Marin").every((r) => r.submitted && !r.changedSince)).toBe(true);
    // Could after Should after Must, where the stored letters would read C, M, S: Tom's
    // different priority on CL-03 becomes Could, CL-06 (proposed Could) has Dana's.
    await sql`update answer set value = 'C' where response_id = ${await responseOf("Tom Reyes")} and kind = 'change' and item_id = (select id from item where workspace_id = ${wsH} and source_ref = 'CL-03')`;
    const values = async (dir: "asc" | "desc") => (await registers.answers(wsH, instrumentH, { ...on, sort: { key: "value", dir } }, ["change"], keys, "moscow")).map((r) => r.value);
    const asc = await values("asc");
    expect(asc.indexOf("C")).toBeGreaterThan(asc.lastIndexOf("S"));
    expect(asc.lastIndexOf("M")).toBeLessThan(asc.indexOf("S"));
    expect((await values("desc"))[0]).toBe("C");
    const proposed = async (dir: "asc" | "desc") => (await registers.answers(wsH, instrumentH, { ...on, sort: { key: "proposed", dir } }, ["change"], keys, "moscow")).map((r) => proposedCode("moscow", r.proposedValue));
    expect((await proposed("asc")).at(-1)).toBe("C");
    expect((await proposed("desc"))[0]).toBe("C");
    // Status: the not submitted first ascending (false before true), last descending.
    const status = async (dir: "asc" | "desc") => (await registers.answers(wsH, instrumentH, { ...on, sort: { key: "status", dir } }, ["change", "disagree"], keys, "moscow")).map((r) => r.submitted);
    expect((await status("asc"))[0]).toBe(false);
    expect((await status("desc")).at(-1)).toBe(false);
    // Two more missing items, from Sam and Priya, one with no value, then every missing column
    // both ways.
    await sql`insert into missing_item (workspace_id, response_id, text, suggested_area, suggested_value) values (${wsH}, ${sam}, 'Approve from a phone.', 'Approving', 'C'), (${wsH}, ${await responseOf("Priya Nair")}, 'Card statements imported.', 'Submitting', 'M'), (${wsH}, ${await responseOf("Lukas Berg")}, 'Mileage claims.', null, null)`;
    const missing = async (key: string, dir: "asc" | "desc") => (await registers.missing(wsH, instrumentH, { ...on, sort: { key, dir } }, keys, "moscow")).map((m) => m.text);
    expect(await missing("text", "asc")).toEqual([...(await missing("text", "asc"))].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
    for (const key of ["text", "respondent"]) expect(await missing(key, "desc")).toEqual([...(await missing(key, "asc"))].reverse());
    // By area, the suggestion with no area last both ways, the rest reversed.
    const areaAsc = await missing("area", "asc");
    const areaDesc = await missing("area", "desc");
    expect([areaAsc.at(-1), areaDesc.at(-1)]).toEqual(["Mileage claims.", "Mileage claims."]);
    expect(areaDesc.slice(0, -1)).toEqual(areaAsc.slice(0, -1).reverse());
    const place = (code: string | null) => ["M", "S", "C", "W"].indexOf(code ?? "");
    const byValue = async (dir: "asc" | "desc") => (await registers.missing(wsH, instrumentH, { ...on, sort: { key: "value", dir } }, keys, "moscow")).map((m) => m.value);
    // The scale's order both ways, the empty value last both ways.
    expect((await byValue("asc")).filter((v) => v !== null).map(place)).toEqual([...(await byValue("asc")).filter((v) => v !== null).map(place)].sort((a, b) => a - b));
    expect((await byValue("desc"))[0]).toBe("C");
    expect((await byValue("asc")).at(-1)).toBeNull();
    expect((await byValue("desc")).at(-1)).toBeNull();
    expect((await registers.missing(wsH, instrumentH, on, keys, "moscow")).find((m) => m.who === "Sam Hill")?.submitted).toBe(false);
  });

  it("answer 600 generated responses from SQL under 500 ms", async () => {
    const g = await createWorkspaceWithSample({ name: "Results I", slug: `results-i-${Date.now()}` }, userId);
    made.push(g.id);
    const wsI = unsafeWorkspaceId(g.id);
    const instrumentI = await sampleInstrument(wsI);
    const [{ public_invite, item_set_id }] = await sql`select i.id as public_invite, ins.item_set_id from invite i join instrument ins on ins.id = i.instrument_id where ins.id = ${instrumentI} and i.kind = 'public'`;
    await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, fields, submitted_at, first_submitted_at, signed_off)
      select ${wsI}, ${instrumentI}, ${item_set_id}, ${public_invite}, md5(random()::text) || md5(g::text), jsonb_build_object('name', 'Person ' || g, 'role', 'Sales'), now(), now(), true
      from generate_series(1, 600) g`;
    await sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind, value, reason)
      select ${wsI}, r.id, r.item_set_id, it.id, (array['change', 'disagree', 'unclear', 'agree', 'agree'])[1 + abs(hashtext(r.id::text || it.id::text)) % 5],
          case when abs(hashtext(r.id::text || it.id::text)) % 5 = 0 then 'M' end, 'Because.'
      from response r join item it on it.item_set_id = r.item_set_id where r.workspace_id = ${wsI} and r.fields ->> 'name' like 'Person %'`;
    for (const sort of [null, { key: "respondent", dir: "desc" as const }, { key: "value", dir: "asc" as const }]) {
      const started = performance.now();
      const rows = await registers.answers(wsI, instrumentI, { ...NONE, sort }, ["change", "disagree"], keys, "moscow");
      expect(performance.now() - started).toBeLessThan(500);
      expect(rows.length).toBeGreaterThan(1000);
    }
  }, 60_000);

  it("read nothing of another workspace's instrument", async () => {
    expect(await registers.answers(wsB, instrumentA, { ...NONE, includeUnsubmitted: true }, ["change", "disagree", "unclear"], keys, "moscow")).toEqual([]);
    expect(await registers.missing(wsB, instrumentA, { ...NONE, includeUnsubmitted: true }, keys, "moscow")).toEqual([]);
  });
});

describe("the item detail", () => {
  const itemId = async (ws: WorkspaceId, instrumentId: string, ref: string) =>
    (await sql`select it.id from item it join instrument ins on ins.item_set_id = it.item_set_id where ins.id = ${instrumentId} and it.workspace_id = ${ws} and it.source_ref = ${ref}`)[0].id as string;

  it("shows CL-04 with a row per person kept, and the counts of the Agreement tab", async () => {
    const cl04 = await itemId(wsA, instrumentA, "CL-04");
    const d = (await detail.item(wsA, instrumentA, cl04, NONE))!;
    expect([d.item.reference, d.item.area, d.item.proposedValue]).toEqual(["CL-04", "Approving", "S"]);
    // Every one of the seven people sees the item (no perspectives); answers first.
    expect(d.rows.map((r) => [r.fields.name, r.kind])).toEqual([
      ["Dana Okafor", "agree"], ["Ioana Marin", "change"], ["Lukas Berg", "agree"], ["Priya Nair", "disagree"], ["Tom Reyes", "change"],
      ["Elena Costa", null], ["Sam Hill", null],
    ]);
    const ioana = d.rows.find((r) => r.fields.name === "Ioana Marin")!;
    expect([ioana.value, ioana.reason, ioana.submitted]).toEqual(["M", "I find out I was over the limit three weeks later, after I have paid.", true]);
    // Sam started (his answer does not count while the switch is off); Elena has not opened the link.
    expect(d.rows.filter((r) => r.kind === null).map((r) => [r.fields.name, r.invited, r.submitted])).toEqual([["Elena Costa", true, false], ["Sam Hill", false, false]]);
    // With the switch on, Sam's answer counts and is marked as not submitted.
    const on = (await detail.item(wsA, instrumentA, cl04, { ...NONE, includeUnsubmitted: true }))!;
    expect(on.rows.find((r) => r.fields.name === "Sam Hill")).toMatchObject({ kind: "agree", submitted: false });
    // The role filter keeps Sales: Ioana and Tom, and Elena invited.
    const sales = (await detail.item(wsA, instrumentA, cl04, { ...NONE, fields: { role: ["Sales"] } }))!;
    expect(sales.rows.map((r) => r.fields.name)).toEqual(["Ioana Marin", "Tom Reyes", "Elena Costa"]);
    expect(d.counts).toEqual({ agree: 2, change: 2, disagree: 1, unclear: 0, pick: 0, notYet: 2 });
    // The counts (in SQL) are the Agreement tab's for the item, and the rows', under each filter.
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }, { ...NONE, fields: { role: ["Sales"] } }, { ...NONE, kinds: ["change" as const] }]) {
      const one = (await detail.item(wsA, instrumentA, cl04, f))!;
      const c = (await agreement.byItem(wsA, instrumentA, f, null)).find((x) => x.itemId === cl04)!;
      const k = (kind: string | null) => one.rows.filter((r) => r.kind === kind).length;
      expect([one.counts.agree, one.counts.change, one.counts.disagree, one.counts.unclear, one.counts.pick]).toEqual([c.agree, c.change, c.disagree, c.unclear, c.pick]);
      expect([k("agree"), k("change"), k("disagree"), k("unclear"), k("pick"), k(null)]).toEqual([one.counts.agree, one.counts.change, one.counts.disagree, one.counts.unclear, one.counts.pick, one.counts.notYet]);
    }
  });

  it("counts rated answers on an item with no proposal, and keeps answers after a change of perspective", async () => {
    const stamp = Date.now();
    const e = await createWorkspaceWithSample({ name: "Results E", slug: `results-e-${stamp}` }, userId);
    made.push(e.id);
    const wsE = unsafeWorkspaceId(e.id);
    const instrumentE = await sampleInstrument(wsE);
    const cl04 = await itemId(wsE, instrumentE, "CL-04");
    // An item with no proposed value is rated (kind pick) while the instrument shows proposals.
    await sql`update item set proposed_value = null where id = ${cl04}`;
    await sql`update answer set kind = 'pick' where item_id = ${cl04} and kind <> 'unclear'`;
    const rated = (await detail.item(wsE, instrumentE, cl04, NONE))!;
    const c = (await agreement.byItem(wsE, instrumentE, NONE, null)).find((x) => x.itemId === cl04)!;
    expect([rated.counts.pick, rated.counts.agree]).toEqual([c.pick, 0]);
    expect(rated.counts.pick).toBe(5);
    // Only Finance sees the item now; the five who answered it keep their row (a Start again
    // keeps the answers), as the Agreement tab counts them; Elena and Sam do not see it.
    await sql`update item set perspectives = '{Finance}' where id = ${cl04}`;
    await sql`update response set perspectives = '{Sales}' where workspace_id = ${wsE}`;
    const moved = (await detail.item(wsE, instrumentE, cl04, NONE))!;
    expect(moved.rows.map((r) => r.fields.name)).toEqual(["Dana Okafor", "Ioana Marin", "Lukas Berg", "Priya Nair", "Tom Reyes"]);
    const c2 = (await agreement.byItem(wsE, instrumentE, NONE, null)).find((x) => x.itemId === cl04)!;
    expect([moved.counts.pick, moved.counts.notYet]).toEqual([c2.pick, 0]);
  }, 60_000);

  it("loads under 500 ms with 100 generated responses", async () => {
    const stamp = Date.now();
    const d = await createWorkspaceWithSample({ name: "Results D", slug: `results-d-${stamp}` }, userId);
    made.push(d.id);
    const wsD = unsafeWorkspaceId(d.id);
    const instrumentD = await sampleInstrument(wsD);
    const [{ public_invite, item_set_id }] = await sql`select i.id as public_invite, ins.item_set_id from invite i join instrument ins on ins.id = i.instrument_id where ins.id = ${instrumentD} and i.kind = 'public'`;
    await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, fields, submitted_at, first_submitted_at, signed_off)
      select ${wsD}, ${instrumentD}, ${item_set_id}, ${public_invite}, md5(random()::text) || md5(g::text),
          jsonb_build_object('name', 'Person ' || g, 'role', (array['Sales', 'Finance', 'HR'])[1 + g % 3]), now(), now(), true
      from generate_series(1, 100) g`;
    await sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind, value, reason)
      select ${wsD}, r.id, r.item_set_id, it.id, 'change', 'M', 'Because.'
      from response r join item it on it.item_set_id = r.item_set_id
      where r.workspace_id = ${wsD} and r.instrument_id = ${instrumentD} and r.fields ->> 'name' like 'Person %'`;
    const cl04 = await itemId(wsD, instrumentD, "CL-04");
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }, { ...NONE, fields: { role: ["Sales"] } }]) {
      const started = performance.now();
      const one = await detail.item(wsD, instrumentD, cl04, f);
      expect(performance.now() - started).toBeLessThan(500);
      // The sample's 7 people and the 100 (Sales: Ioana, Tom, Elena and every third person).
      expect(one!.rows.length).toBe(f.fields.role ? 36 : 107);
    }
  }, 60_000);

  it("reads nothing of another workspace's item", async () => {
    const cl04 = await itemId(wsA, instrumentA, "CL-04");
    expect(await detail.item(wsB, instrumentA, cl04, { ...NONE, includeUnsubmitted: true })).toBeNull();
    expect(await detail.item(wsB, await sampleInstrument(wsB), cl04, { ...NONE, includeUnsubmitted: true })).toBeNull();
    expect(await detail.item(wsA, instrumentA, "not-a-uuid", NONE)).toBeNull();
  });
});

describe("where groups disagree", () => {
  it("orders the items by the gap between groups of 3 answers or more, on fixed rows", async () => {
    const w = await createWorkspaceWithSample({ name: "Results F", slug: `results-f-${Date.now()}` }, userId);
    made.push(w.id);
    const wsF = unsafeWorkspaceId(w.id);
    const instrumentF = await sampleInstrument(wsF);
    const [{ public_invite, item_set_id }] = await sql`select i.id as public_invite, ins.item_set_id from invite i join instrument ins on ins.id = i.instrument_id where ins.id = ${instrumentF} and i.kind = 'public'`;
    // Teams A and B of three, team C of two (never compared), and three people with no team
    // (the group Not given, ''). The sample's people are removed first.
    await sql`delete from response where workspace_id = ${wsF}`;
    const team: Record<string, string> = { A1: "A", A2: "A", A3: "A", B1: "B", B2: "B", B3: "B", C1: "C", C2: "C", N1: "", N2: "", N3: "" };
    const ids: Record<string, string> = {};
    for (const [name, t] of Object.entries(team)) {
      const [{ id }] = await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, fields, submitted_at, first_submitted_at, signed_off)
        values (${wsF}, ${instrumentF}, ${item_set_id}, ${public_invite}, md5(random()::text) || md5(${name}), ${JSON.stringify(t ? { name, team: t } : { name })}::jsonb, now(), now(), true) returning id`;
      ids[name] = id as string;
    }
    const answer = async (name: string, ref: string, kind: string) => {
      await sql`insert into answer (workspace_id, response_id, item_set_id, item_id, kind, value, reason)
        select ${wsF}, ${ids[name]}, ${item_set_id}, it.id, ${kind}, case when ${kind} = 'change' then 'M' end, case when ${kind} = 'agree' then null else 'Because.' end
        from item it where it.workspace_id = ${wsF} and it.item_set_id = ${item_set_id} and it.source_ref = ${ref}`;
    };
    const set = async (ref: string, kinds: Record<string, string>) => { for (const [name, kind] of Object.entries(kinds)) await answer(name, ref, kind); };
    // CL-02: A 0 of 3, B 3 of 3 (gap 100). CL-05: A 1 of 3, B 2 of 3, Not given 3 of 3 (gap
    // 67). CL-01: A and B 3 of 3, C 0 of 2 (gap 0: C is not compared). CL-03: A 3 of 3, B only
    // 2 answers (no gap).
    await set("CL-02", { A1: "change", A2: "disagree", A3: "unclear", B1: "agree", B2: "agree", B3: "agree" });
    await set("CL-05", { A1: "agree", A2: "change", A3: "change", B1: "agree", B2: "agree", B3: "disagree", N1: "agree", N2: "agree", N3: "agree" });
    await set("CL-01", { A1: "agree", A2: "agree", A3: "agree", B1: "agree", B2: "agree", B3: "agree", C1: "disagree", C2: "disagree" });
    await set("CL-03", { A1: "agree", A2: "agree", A3: "agree", B1: "change", B2: "change" });
    const refs = new Map((await sql`select id, source_ref from item where workspace_id = ${wsF} and item_set_id = ${item_set_id}`).map((r) => [r.id as string, r.source_ref as string]));
    const out = await gaps.byField(wsF, instrumentF, NONE, "team");
    expect(out.map((g) => [refs.get(g.itemId), g.gap])).toEqual([["CL-02", 100], ["CL-05", 67], ["CL-01", 0], ["CL-03", null], ["CL-04", null], ["CL-06", null]]);
    expect(out.find((g) => refs.get(g.itemId) === "CL-05")!.groups).toEqual([
      { group: "", folded: false, agree: 3, answered: 3, compared: true },
      { group: "A", folded: false, agree: 1, answered: 3, compared: true },
      { group: "B", folded: false, agree: 2, answered: 3, compared: true },
    ]);
    const cl01 = out.find((g) => refs.get(g.itemId) === "CL-01")!;
    expect(cl01.groups).toEqual([
      { group: "A", folded: false, agree: 3, answered: 3, compared: true },
      { group: "B", folded: false, agree: 3, answered: 3, compared: true },
      { group: "C", folded: false, agree: 0, answered: 2, compared: false },
    ]);
    // The filter narrows the people first: team A alone leaves nothing to compare.
    expect((await gaps.byField(wsF, instrumentF, { ...NONE, fields: { team: "A" } }, "team")).every((g) => g.gap === null)).toBe(true);
  });

  it("compares no role on the sample, whose groups are all under 3", async () => {
    const out = await gaps.byField(wsA, instrumentA, NONE, "role");
    expect(out).toHaveLength(6);
    expect(out.every((g) => g.gap === null && g.groups.every((x) => !x.compared))).toBe(true);
    // The groups add up to the Agreement tab's split.
    const split = await agreement.byItem(wsA, instrumentA, NONE, "role");
    for (const g of out) for (const x of g.groups) {
      const c = split.find((s) => s.itemId === g.itemId && s.group === (x.group === "" ? null : x.group))!;
      expect([x.agree, x.answered]).toEqual([c.agree, c.agree + c.change + c.disagree + c.unclear]);
    }
  });

  it("reads nothing of another workspace's instrument", async () => {
    expect(await gaps.byField(wsB, instrumentA, { ...NONE, includeUnsubmitted: true }, "role")).toEqual([]);
  });
});

// Who sees whose answers (stories/E5-7, acceptance 4, 5 and 6): the sample's instrument set
// to Names hidden after the fact (its Name field and personal invites still in the rows) shows
// no name, no field, no submitted time and no reminders in any query, numbers every response
// by its start across its links, lists no invitee who has not started, and still splits and
// filters by the stored dropdown values. The counts behind the offered values read nothing of
// another workspace.
describe("Names hidden and Anonymous on Results", () => {
  let wsH: WorkspaceId;
  let instrumentH: string;
  beforeAll(async () => {
    const h = await createWorkspaceWithSample({ name: "Results H", slug: `results-h-${Date.now()}` }, userId);
    made.push(h.id);
    wsH = unsafeWorkspaceId(h.id);
    instrumentH = await sampleInstrument(wsH);
    await sql`update instrument set anonymity = 'hidden' where id = ${instrumentH}`;
  }, 60_000);

  it("names nobody, numbers every response by its start, and keeps no invitee who has not started", async () => {
    const on = { ...NONE, includeUnsubmitted: true };
    const order = (await sql`select id from response where workspace_id = ${wsH} and instrument_id = ${instrumentH} order by created_at, id`).map((r) => r.id as string);
    const people = await tracker.people(wsH, instrumentH, on, ["name", "role"]);
    expect(people).toHaveLength(order.length);
    expect(people.every((p) => p.who === null && p.status !== "invited" && Object.keys(p.fields).length === 0 && p.submittedAt === null && p.reminders === null)).toBe(true);
    expect(new Map(people.map((p) => [p.id, p.anon]))).toEqual(new Map(order.map((id, i) => [id, i + 1])));
    expect(people.filter((p) => p.status === "submitted")).toHaveLength(5);
    // A sort by a field, by the submitted time, by the source or by the reminders falls to the
    // respondent column, by number, in the direction asked.
    const byNumberDesc = (await tracker.people(wsH, instrumentH, { ...on, sort: { key: "name", dir: "desc" } }, [])).map((p) => p.anon);
    expect(byNumberDesc).toEqual(people.map((p) => p.anon).reverse());
    // E5-7, amended 2026-10-06: by the status or the progress too, under Names hidden.
    for (const key of ["field.role", "submitted", "source", "reminders", "status", "progress"]) expect((await tracker.people(wsH, instrumentH, { ...on, sort: { key, dir: "desc" } }, ["role"])).map((p) => p.anon)).toEqual(byNumberDesc);
    const n = (await results.numbers(wsH, instrumentH, on))!;
    expect([n.invited, n.submitted, n.inProgress]).toEqual([6, 5, 1]);
    const rows = await results.rows(wsH, instrumentH, on);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.who === null && r.anon !== null && Object.keys(r.fields).length === 0 && r.submittedAt === null)).toBe(true);
    const signOffs = await results.signOffs(wsH, instrumentH, on);
    expect(signOffs.map((s) => s.submittedAt)).toEqual([null, null, null, null, null]);
    expect(signOffs.map((s) => s.anon)).toEqual([...signOffs.map((s) => s.anon)].sort((x, y) => x! - y!));
    const pushed = await registers.answers(wsH, instrumentH, on, ["change", "disagree", "unclear"], ["role"], "moscow");
    const missing = await registers.missing(wsH, instrumentH, on, ["role"], "moscow");
    expect([...pushed, ...missing].every((r) => r.who === null && r.anon !== null && Object.keys(r.fields).length === 0)).toBe(true);
    const item = (await sql`select it.id from item it join instrument ins on ins.item_set_id = it.item_set_id where ins.id = ${instrumentH} and it.source_ref = 'CL-04'`)[0].id as string;
    const one = (await detail.item(wsH, instrumentH, item, on))!;
    expect(one.rows.every((r) => !r.invited && r.who === null && r.anon !== null && Object.keys(r.fields).length === 0)).toBe(true);
    // A list of people follows no field filter (amended 2026-10-06), so a name filter neither
    // finds a name nor narrows the list; the strip's numbers keep nobody for it (B).
    expect((await tracker.people(wsH, instrumentH, { ...on, fields: { name: "Ioana" } }, [])).map((p) => p.id)).toEqual(people.map((p) => p.id));
    expect((await results.numbers(wsH, instrumentH, { ...on, fields: { name: "Ioana" } }))!.tooFew).toBe(true);
    // The split still reads the stored values, aggregated: every value has fewer than 3 people
    // here, so all of them are one folded group (C, amended 2026-10-06).
    const split = await agreement.byItem(wsH, instrumentH, on, "role");
    expect(split.length > 0 && split.every((c) => c.folded && c.group === null)).toBe(true);
    // The Actions tab's citations (E9-1) name nobody either.
    const cited = await insights.listWithCitations(wsH, (await instruments.get(wsH, instrumentH))!.projectId);
    expect(cited.length).toBeGreaterThan(0);
    expect(cited.flatMap((a) => [...a.answers, ...a.missing]).every((c) => c.who === null && c.anon !== null)).toBe(true);
  });

  // E5-7, amended 2026-10-06 (E): under Names hidden no file says who has submitted; under
  // Anonymous the status columns stay.
  it("writes the CSVs without names, fields, times, sources, reminders, perspectives or, under Names hidden, statuses", async () => {
    const inst = (await instruments.get(wsH, instrumentH))!;
    const f = { ...NONE, includeUnsubmitted: true };
    const ctxH = { fields: inst.respondentFields.filter((s) => s.type === "dropdown"), perspectives: inst.perspectives, anonymity: inst.anonymity };
    const answers = await exportTable(wsH, inst, "answers", f, ctxH, false);
    expect(answers.header).toEqual(["Respondent", "Reference", "Area", "Item", "Proposed value", "Proposed label", "Answer", "Their value", "Their label", "Reason or question", "Comment"]);
    expect(answers.rows.every((r) => /^Anonymous \d+$/.test(String(r[0])))).toBe(true);
    const people = await exportTable(wsH, inst, "people", f, ctxH, false);
    expect(people.header).toEqual(["Respondent", "Answers with a reason or comment"]);
    expect(people.rows.map((r) => r[0])).toEqual(["Anonymous 1", "Anonymous 2", "Anonymous 3", "Anonymous 4", "Anonymous 5", "Anonymous 6"]);
    const missing = await exportTable(wsH, inst, "missing", f, ctxH, false);
    expect(missing.header).toEqual(["Suggested item", "Suggested area", "Suggested value", "Suggested label", "Respondent"]);
    const anonymous = { ...inst, anonymity: "anonymous" as const };
    expect((await exportTable(wsH, anonymous, "people", f, { ...ctxH, anonymity: "anonymous" }, false)).header).toEqual(["Respondent", "Status", "Since submitting", "Minutes to submit", "Answers with a reason or comment"]);
    expect((await exportTable(wsH, anonymous, "missing", f, { ...ctxH, anonymity: "anonymous" }, false)).header).toEqual(["Suggested item", "Suggested area", "Suggested value", "Suggested label", "Respondent", "Status", "Since submitting"]);
    // The strip still adds up from the rows.
    await reconcileStrip(wsH, instrumentH, f);
    await reconcileStrip(wsH, instrumentH, NONE);
  });

  // A (person-level views) and B (MIN_GROUP on aggregates), amended 2026-10-06 after the
  // audit: Sales has 2 people. Every list of people (the Responses tab, the registers, the
  // detail's rows, the answer rows, the sign-offs, the people and missing files) ignores the
  // field and perspective filters, and the status filter under Names hidden; the strip, the
  // Agreement counts, the gaps, the detail's counts and the items file keep nobody.
  it("keeps every list of people whole under a field or perspective filter, and draws nothing for fewer than 3 people", async () => {
    const on = { ...NONE, includeUnsubmitted: true };
    const inst = (await instruments.get(wsH, instrumentH))!;
    const ctxH = { fields: inst.respondentFields.filter((s) => s.type === "dropdown"), perspectives: inst.perspectives, anonymity: inst.anonymity };
    const item = (await sql`select it.id from item it join instrument ins on ins.item_set_id = it.item_set_id where ins.id = ${instrumentH} and it.source_ref = 'CL-04'`)[0].id as string;
    const lists = async (f: ResultsFilter) => ({
      people: (await tracker.people(wsH, instrumentH, f, [])).map((p) => p.id),
      registers: (await registers.answers(wsH, instrumentH, f, ["change", "disagree", "unclear"], [], "moscow")).map((r) => r.id),
      missing: (await registers.missing(wsH, instrumentH, f, [], "moscow")).map((r) => r.id),
      rows: (await results.rows(wsH, instrumentH, f)).map((r) => r.id),
      who: (await results.people(wsH, instrumentH, f)).map((r) => r.id),
      signOffs: (await results.signOffs(wsH, instrumentH, f)).map((r) => r.id),
      detail: (await detail.item(wsH, instrumentH, item, f))!.rows.map((r) => r.personId),
      counts: (await results.numbers(wsH, instrumentH, f, "person"))!,
    });
    const whole = await lists(on);
    for (const f of [{ ...on, fields: { role: ["Sales"] } }, { ...on, perspective: "Approver" }, { ...on, status: ["submitted" as const] }]) {
      expect(await lists(f)).toEqual(whole);
      const n = (await results.numbers(wsH, instrumentH, f))!;
      expect([n.tooFew, n.shown, n.invited, n.agree, n.answered, n.missing]).toEqual([f.status.length > 0 ? false : true, f.status.length > 0 ? 5 : 0, f.status.length > 0 ? 5 : 0, ...(f.status.length > 0 ? [n.agree, n.answered, n.missing] : [0, 0, 0])]);
    }
    const sales = { ...on, fields: { role: ["Sales"] } };
    expect((await agreement.byItem(wsH, instrumentH, sales)).every((c) => c.few && c.agree + c.change + c.disagree + c.unclear + c.pick === 0 && c.couldSee === 0)).toBe(true);
    expect((await gaps.byField(wsH, instrumentH, sales, "role")).every((g) => g.groups.length === 0)).toBe(true);
    const one = (await detail.item(wsH, instrumentH, item, sales))!;
    expect([one.countsFew, one.few, one.counts.agree, one.rows.length]).toEqual([true, false, 0, whole.detail.length]);
    // The files: the items file has no row and says why; the answers file is whole and says so.
    const items = await exportTable(wsH, inst, "items", sales, ctxH, false);
    expect([items.preamble, items.rows]).toEqual([[["Filtered: Role: Sales"], [EXPORT_COPY.withUnsubmitted], [RESULTS_COPY.tooFew]], []]);
    const answers = await exportTable(wsH, inst, "answers", sales, ctxH, false);
    expect(answers.preamble).toEqual([[RESULTS_COPY.personLevel], [EXPORT_COPY.withUnsubmitted]]);
    expect(answers.rows).toEqual((await exportTable(wsH, inst, "answers", on, ctxH, false)).rows);
    // Under Anonymous the status filter still narrows a list (Share names nobody there).
    await sql`update instrument set anonymity = 'anonymous' where id = ${instrumentH}`;
    expect(await tracker.people(wsH, instrumentH, { ...on, status: ["submitted"] }, [])).toHaveLength(5);
    expect((await tracker.people(wsH, instrumentH, { ...on, fields: { role: ["Sales"] } }, [])).map((p) => p.id)).toEqual(whole.people);
    await sql`update instrument set anonymity = 'hidden' where id = ${instrumentH}`;
    // Another workspace reads nothing in either mode.
    expect(await results.numbers(wsA, instrumentH, sales, "person")).toBeNull();
    expect(await results.numbers(wsA, instrumentH, sales)).toBeNull();
    expect(await results.signOffs(wsA, instrumentH, sales, "aggregate")).toEqual([]);
    expect(await detail.item(wsA, instrumentH, item, sales)).toBeNull();
    expect(await agreement.byItem(wsA, instrumentH, sales, "role")).toEqual([]);
    // Named is unchanged: the filter narrows the lists, with no floor.
    const named = (await tracker.people(wsA, instrumentA, { ...on, fields: { role: ["Sales"] } }, [])).filter((p) => p.status !== "invited");
    expect(named).toHaveLength(2);
    expect((await results.numbers(wsA, instrumentA, { ...on, fields: { role: ["Sales"] } }))!.tooFew).toBe(false);
  });

  it("offers a dropdown value as a filter only with 3 counted respondents, and reads nothing of another workspace", async () => {
    const counts = await results.fieldValueCounts(wsH, instrumentH, true);
    expect(counts.filter((c) => c.key === "role")).toEqual([
      { key: "role", value: "Engineering manager", n: 1 }, { key: "role", value: "Finance", n: 1 }, { key: "role", value: "HR", n: 1 },
      { key: "role", value: "Office manager", n: 1 }, { key: "role", value: "Sales", n: 2 },
    ]);
    expect((await results.fieldValueCounts(wsH, instrumentH, false)).find((c) => c.key === "role" && c.value === "Office manager")).toBeUndefined();
    expect(await results.fieldValueCounts(wsA, instrumentH, true)).toEqual([]);
    expect(await results.fieldValueCounts(wsH, "not-a-uuid", true)).toEqual([]);
    // Perspectives follow the same rule: one picked by fewer than 3 is not offered.
    const picked = await results.perspectiveCounts(wsH, instrumentH, true);
    expect(await results.perspectiveCounts(wsA, instrumentH, true)).toEqual([]);
    expect(await results.perspectiveCounts(wsH, "not-a-uuid", true)).toEqual([]);
    const inst = (await instruments.get(wsH, instrumentH))!;
    const { ctx, filter } = await resultsContext(wsH, inst, { "f.role": "Sales", "f.name": "Ioana", unsubmitted: "1" }, null);
    expect(ctx.fields.map((s) => s.key)).toEqual(["role"]);
    expect(ctx.offered).toEqual({ role: [] });
    expect(ctx.perspectives.every((p) => (picked.find((c) => c.value === p)?.n ?? 0) >= 3)).toBe(true);
    expect(filter.fields).toEqual({});
    // A third Sales respondent makes Sales a value the filter offers.
    const [{ public_invite, item_set_id }] = await sql`select i.id as public_invite, ins.item_set_id from invite i join instrument ins on ins.id = i.instrument_id where ins.id = ${instrumentH} and i.kind = 'public'`;
    await sql`insert into response (workspace_id, instrument_id, item_set_id, invite_id, device_token, fields) values (${wsH}, ${instrumentH}, ${item_set_id}, ${public_invite}, ${"d".repeat(32)}, '{"role": "Sales"}'::jsonb)`;
    const again = await resultsContext(wsH, inst, { "f.role": "Sales", unsubmitted: "1" }, null);
    expect(again.ctx.offered).toEqual({ role: ["Sales"] });
    expect(again.filter.fields).toEqual({ role: ["Sales"] });
    // Under Named the context is the instrument's, every option offered.
    const named = await resultsContext(wsA, (await instruments.get(wsA, instrumentA))!, { "f.role": "HR", unsubmitted: "1" }, null);
    expect([named.ctx.offered, named.filter.fields]).toEqual([undefined, { role: ["HR"] }]);
    // No status filter under Names hidden (E).
    expect((await resultsContext(wsH, inst, { status: "submitted", unsubmitted: "1" }, null)).filter.status).toEqual([]);
  });

  // C, amended 2026-10-06 after the audit: with the switch on, Sales has 3 people (the response
  // added above) and Finance, Engineering manager, HR and Office manager one each. The four
  // are one group, folded, keyed apart from any value; once two of them become Sales, the two
  // left (2 people) are no group at all, in the split and in the gaps, and the items' totals
  // still count them.
  it("draws no split group under 3 people: folds them when they reach 3 together, else leaves them out", async () => {
    const on = { ...NONE, includeUnsubmitted: true };
    const groups = async () => new Set((await agreement.byItem(wsH, instrumentH, on, "role")).map((c) => `${c.folded ? "folded" : c.group}`));
    expect(await groups()).toEqual(new Set(["Sales", "folded"]));
    expect((await agreement.byItem(wsH, instrumentH, on, "role")).filter((c) => c.folded).every((c) => c.group === null)).toBe(true);
    const gapNames = async () => new Set((await gaps.byField(wsH, instrumentH, on, "role")).flatMap((g) => g.groups.map((x) => (x.folded ? "folded" : x.group))));
    expect(await gapNames()).toEqual(new Set(["Sales", "folded"]));
    await sql`update response set fields = jsonb_set(fields, '{role}', '"Sales"') where workspace_id = ${wsH} and instrument_id = ${instrumentH} and fields ->> 'role' in ('Finance', 'Engineering manager')`;
    expect(await groups()).toEqual(new Set(["Sales"]));
    expect(await gapNames()).toEqual(new Set(["Sales"]));
    const split = await agreement.byItem(wsH, instrumentH, on, "role");
    const totals = await agreement.byItem(wsH, instrumentH, on);
    const sum = (c: ItemCounts) => c.agree + c.change + c.disagree + c.unclear + c.pick;
    expect(totals.reduce((n, c) => n + sum(c), 0)).toBeGreaterThan(split.reduce((n, c) => n + sum(c), 0));
    // Under Named every value is its own group, whatever its size.
    const namedSplit = new Set((await agreement.byItem(wsA, instrumentA, on, "role")).map((c) => c.group));
    expect(namedSplit).toEqual(new Set(["Sales", "Finance", "Engineering manager", "HR", "Office manager"]));
  });

  // D, amended 2026-10-06 after the audit: an item 2 counted people could see (a perspective)
  // has no count in the Agreement table, no row in the item detail, the registers or the
  // answers file, and counts in no tile; the strip still adds up from the rows.
  it("counts nothing on an item fewer than 3 counted people could see", async () => {
    const on = { ...NONE, includeUnsubmitted: true };
    const [cl02] = await sql`select it.id from item it join instrument ins on ins.item_set_id = it.item_set_id where ins.id = ${instrumentH} and it.source_ref = 'CL-02'`;
    const item = cl02.id as string;
    const before = (await results.numbers(wsH, instrumentH, on))!;
    const onItem = (await results.rows(wsH, instrumentH, on)).filter((r) => r.itemId === item);
    expect(onItem.length).toBeGreaterThan(0);
    const viewers = (await sql`select id from response where workspace_id = ${wsH} and instrument_id = ${instrumentH} order by created_at, id limit 2`).map((r) => r.id as string);
    await sql`update item set perspectives = '{Approver}' where id = ${item}`;
    await sql`update response set perspectives = '{Approver}' where id in ${sql(viewers)}`;
    const row = (await agreement.byItem(wsH, instrumentH, on)).find((c) => c.itemId === item)!;
    expect([row.few, row.agree, row.change, row.disagree, row.unclear, row.couldSee, row.percent]).toEqual([true, 0, 0, 0, 0, 0, null]);
    const one = (await detail.item(wsH, instrumentH, item, on))!;
    expect([one.few, one.countsFew, one.rows]).toEqual([true, true, []]);
    expect((await registers.answers(wsH, instrumentH, on, ["change", "disagree", "unclear"], [], "moscow")).some((r) => r.itemId === item)).toBe(false);
    expect((await results.rows(wsH, instrumentH, on)).some((r) => r.itemId === item)).toBe(false);
    const after = (await results.numbers(wsH, instrumentH, on))!;
    // Every answer on the item leaves the strip: the two viewers' and any given before.
    expect(after.agree + after.change + after.disagree + after.unclear + after.pick).toBe(before.agree + before.change + before.disagree + before.unclear + before.pick - onItem.length);
    await reconcileStrip(wsH, instrumentH, on);
    await reconcileStrip(wsH, instrumentH, NONE);
    await sql`update item set perspectives = '{}' where id = ${item}`;
    await sql`update response set perspectives = '{}' where id in ${sql(viewers)}`;
  });
});
