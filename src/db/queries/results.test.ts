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
import { results, resultsPrefs, type ResultRow } from "@/db/queries/results";
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

const NONE: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false };

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
  return { agree: k("agree"), change: k("change"), disagree: k("disagree"), unclear: k("unclear"), pick: k("pick"), answered: rows.filter((r) => r.kind !== "pick").length, withComment: rows.filter((r) => r.reason !== null || r.comment !== null).length, shown: new Set(rows.map((r) => r.responseId)).size };
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
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }, sales, { ...sales, includeUnsubmitted: true }, { ...NONE, kinds: ["disagree" as const] }, { ...NONE, withComment: true }]) {
      const numbers = (await results.numbers(wsA, instrumentA, f))!;
      const rows = await results.rows(wsA, instrumentA, f);
      expect(tally(rows)).toEqual({ agree: numbers.agree, change: numbers.change, disagree: numbers.disagree, unclear: numbers.unclear, pick: numbers.pick, answered: numbers.answered, withComment: numbers.withComment, shown: numbers.shown });
      expect(rows.every((r) => r.submitted || f.includeUnsubmitted)).toBe(true);
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
