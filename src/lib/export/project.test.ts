// The whole project out and in (stories/E10-2): the seeded sample exported (format and
// version at the top, no token, no passcode, invites with their emails, the sample marked),
// then imported into a second workspace as a PM's file (its sample mark taken off, since a
// sample file is refused): the same counts and the same agreement numbers, new ids, new
// tokens, the public link revoked, actions with their state, closing date and mapped citations,
// a field the instrument does not ask for dropped, workspace A unchanged. The refusals, none of
// which writes a row: a newer version named, not JSON, not a project file, over 5 MB, a damaged
// reference, a JSON column of the wrong shape, every rule the database would refuse, the
// sample's file, more responses this month than the plan takes; another workspace cannot export
// the project.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { instruments, invites, projects, responses as responsesQ, workspaces } from "@/db/queries";
import { insights } from "@/db/queries/insights";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { agreement, results } from "@/db/queries/results";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { memoryOutbox } from "@/lib/mail";
import type { ResultsFilter } from "@/lib/results-filter";
import { requireWorkspace } from "@/lib/workspace";
import { EXPORT_COPY } from "./copy";
import { roomInPlan } from "@/lib/plans";
import { exportProject, importProject, PROJECT_FILE_MAX, PROJECT_VERSION } from "./project";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let a: { ws: WorkspaceId; userId: string }; let b: { ws: WorkspaceId; userId: string };
let sampleId: string;
const NONE: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null, split: null, gaps: null };
const E = EXPORT_COPY.importErrors;
// The seed's counts (src/db/seed/sample.ts expected).
const expected = { items: 6, invites: 7, responses: 6, answers: 34, missing: 1, insights: 4 };

async function signIn(label: string) {
  const email = `${label}-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, headers };
}

beforeAll(async () => {
  await prepareTestDatabase();
  const ua = await signIn("transfer-a");
  a = { ws: await requireWorkspace(ua.headers, (await createWorkspaceWithSample({ name: "Transfer A", slug: `transfer-a-${randomUUID()}` }, ua.id)).id), userId: ua.id };
  const ub = await signIn("transfer-b");
  b = { ws: await requireWorkspace(ub.headers, (await createWorkspaceWithSample({ name: "Transfer B", slug: `transfer-b-${randomUUID()}` }, ub.id)).id), userId: ub.id };
  sampleId = (await projects.list(a.ws)).find((p) => p.isSample)!.id;
}, 60_000);

describe("exportProject", () => {
  it("writes the whole project with no token or passcode, the sample marked", async () => {
    const file = await exportProject(a, sampleId);
    expect([file.format, file.version, file.sample, file.note]).toEqual(["smesay.project", PROJECT_VERSION, true, EXPORT_COPY.watermark]);
    expect([file.itemSets.flatMap((s) => s.items).length, file.invites.length, file.responses.length, file.responses.flatMap((r) => r.answers).length, file.missingItems.length, file.insights.length])
      .toEqual([expected.items, expected.invites, expected.responses, expected.answers, expected.missing, expected.insights]);
    const text = JSON.stringify(file);
    for (const iv of await invites.list(a.ws)) expect(text).not.toContain(iv.token);
    expect(text).not.toMatch(/passcodeHash|deviceToken|"token"/);
    expect(file.invites.filter((v) => v.email).length).toBeGreaterThan(0);
  });
  it("is not another workspace's to export", async () => {
    await expect(exportProject(b, sampleId)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("importProject", () => {
  it("recreates the project in another workspace with the same numbers, new ids and tokens, links revoked", async () => {
    const file = await exportProject(a, sampleId);
    const countsA = { projects: (await projects.list(a.ws)).length, invites: (await invites.list(a.ws)).length };
    // One action closed, and one response carrying a field its instrument does not ask for.
    const closedAt = "2026-10-12T09:00:00.000Z";
    const sent = { ...file, sample: false, note: null, insights: file.insights.map((x, i) => (i === 0 ? { ...x, state: "done" as const, closedAt, closedBy: "dana@marlow.example" } : x)), responses: file.responses.map((r, i) => (i === 0 ? { ...r, fields: { ...r.fields, nationalId: "1234567890123" } } : r)) };
    const result = await importProject(b, JSON.stringify(sent));
    if (!("projectId" in result)) throw new Error(result.error);
    const made = await projects.get(b.ws, result.projectId);
    expect([made?.name, made?.isSample]).toEqual([file.project.name, false]);
    const fromA = (await instruments.latestForProject(a.ws, sampleId))!;
    const intoB = (await instruments.latestForProject(b.ws, result.projectId))!;
    expect(intoB.id).not.toBe(fromA.id);
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }]) {
      const before = (await results.numbers(a.ws, fromA.id, f))!;
      const after = (await results.numbers(b.ws, intoB.id, f))!;
      expect({ ...after, actions: 0 }).toEqual({ ...before, actions: 0 });
      const pct = (rows: Awaited<ReturnType<typeof agreement.byItem>>) => rows.map((r) => [r.agree, r.change, r.disagree, r.unclear, r.couldSee, r.percent]).sort();
      expect(pct(await agreement.byItem(b.ws, intoB.id, f))).toEqual(pct(await agreement.byItem(a.ws, fromA.id, f)));
    }
    const newInvites = (await invites.list(b.ws)).filter((v) => v.instrumentId === intoB.id);
    const oldTokens = new Set((await invites.list(a.ws)).map((v) => v.token));
    expect(newInvites.length).toBe(expected.invites);
    expect(newInvites.every((v) => !oldTokens.has(v.token) && /^[0-9a-f]{32}$/.test(v.token) && v.passcodeHash === null)).toBe(true);
    expect(newInvites.filter((v) => v.kind === "public").every((v) => v.revokedAt !== null)).toBe(true);
    const acts = await insights.listWithCitations(b.ws, result.projectId);
    expect(acts.length).toBe(expected.insights);
    expect(acts.every((s) => s.answers.length + s.missing.length > 0)).toBe(true);
    const done = acts.filter((x) => x.state === "done");
    expect(done.map((x) => [x.title, x.closedAt?.toISOString(), x.closedBy])).toEqual([[file.insights[0].title, closedAt, null]]);
    expect((await responsesQ.list(b.ws)).filter((r) => r.instrumentId === intoB.id).every((r) => !("nationalId" in (r.fields as Record<string, string>)))).toBe(true);
    expect({ projects: (await projects.list(a.ws)).length, invites: (await invites.list(a.ws)).length }).toEqual(countsA);
    // A file read back and imported twice makes two projects, never a clash.
    const again = await importProject(b, JSON.stringify({ ...file, sample: false, note: null }));
    expect("projectId" in again && again.projectId).not.toBe(result.projectId);
  });

  // E5-2, acceptance 6 (design note 98): the reason rule goes out and comes back; a file
  // written before the rule existed has none and reads the default; a value outside the
  // three is a damaged file.
  it("keeps the reason rule on a round trip, reads differs from an older file, refuses an unknown rule", async () => {
    const file = await exportProject(a, sampleId);
    expect(file.instruments.map((i) => i.reasonRule)).toEqual(file.instruments.map(() => "differs"));
    const asPm = { ...file, sample: false, note: null };
    const ruled = await importProject(b, JSON.stringify({ ...asPm, instruments: asPm.instruments.map((i) => ({ ...i, reasonRule: "always" })) }));
    if (!("projectId" in ruled)) throw new Error(ruled.error);
    expect((await instruments.latestForProject(b.ws, ruled.projectId))?.reasonRule).toBe("always");
    const back = await exportProject(b, ruled.projectId);
    expect(back.instruments.map((i) => i.reasonRule)).toEqual(back.instruments.map(() => "always"));
    const older = await importProject(b, JSON.stringify({ ...asPm, instruments: asPm.instruments.map(({ reasonRule: _dropped, ...i }) => (void _dropped, i)) }));
    if (!("projectId" in older)) throw new Error(older.error);
    expect((await instruments.latestForProject(b.ws, older.projectId))?.reasonRule).toBe("differs");
    expect(await importProject(b, JSON.stringify({ ...asPm, instruments: asPm.instruments.map((i) => ({ ...i, reasonRule: "sometimes" })) }))).toEqual({ error: E.damaged("instruments.0.reasonRule") });
  });

  // E5-7, acceptance 5: a validation set to Names hidden goes out with no invite id and no
  // fields on its responses, comes back with the level and its responses on the public
  // invite, and counts the same; a file written before the level existed reads Named; a
  // response with no invite on a Named validation, or a text field under Names hidden, is a
  // damaged file.
  it("keeps who sees whose answers on a round trip, and the file ties no response to a personal invite", async () => {
    const file = await exportProject(a, sampleId);
    expect(file.instruments.map((i) => i.anonymity)).toEqual(file.instruments.map(() => "named"));
    const asPm = { ...file, sample: false, note: null };
    const hiddenFile = { ...asPm, instruments: asPm.instruments.map((i) => ({ ...i, anonymity: "hidden" as const, respondentFields: i.respondentFields.filter((f) => f.type === "dropdown") })) };
    expect(await importProject(b, JSON.stringify({ ...asPm, instruments: asPm.instruments.map((i) => ({ ...i, anonymity: "hidden" })) }))).toEqual({ error: E.damaged("a validation's fields") });
    const hidden = await importProject(b, JSON.stringify(hiddenFile));
    if (!("projectId" in hidden)) throw new Error(hidden.error);
    const first = (await instruments.latestForProject(b.ws, hidden.projectId))!;
    expect(first.anonymity).toBe("hidden");
    const out = await exportProject(b, hidden.projectId);
    expect(out.instruments.map((i) => i.anonymity)).toEqual(["hidden"]);
    expect(out.responses.length).toBe(expected.responses);
    expect(out.responses.every((r) => r.inviteId === null && Object.keys(r.fields).length === 0)).toBe(true);
    const back = await importProject(b, JSON.stringify(out));
    if (!("projectId" in back)) throw new Error(back.error);
    const second = (await instruments.latestForProject(b.ws, back.projectId))!;
    expect(second.anonymity).toBe("hidden");
    const publicInvite = (await invites.list(b.ws)).find((v) => v.instrumentId === second.id && v.kind === "public")!;
    const responsesBack = (await responsesQ.list(b.ws)).filter((r) => r.instrumentId === second.id);
    expect(responsesBack.length).toBe(expected.responses);
    expect(responsesBack.every((r) => r.inviteId === publicInvite.id)).toBe(true);
    for (const f of [NONE, { ...NONE, includeUnsubmitted: true }]) {
      const before = (await results.numbers(b.ws, first.id, f))!;
      const after = (await results.numbers(b.ws, second.id, f))!;
      expect({ ...after, actions: 0 }).toEqual({ ...before, actions: 0 });
    }
    const older = await importProject(b, JSON.stringify({ ...asPm, instruments: asPm.instruments.map(({ anonymity: _dropped, ...i }) => (void _dropped, i)) }));
    if (!("projectId" in older)) throw new Error(older.error);
    expect((await instruments.latestForProject(b.ws, older.projectId))?.anonymity).toBe("named");
    expect(await importProject(b, JSON.stringify({ ...asPm, responses: asPm.responses.map((r, i) => (i === 0 ? { ...r, inviteId: null } : r)) }))).toEqual({ error: E.damaged("a response's validation, list or invite") });
    expect(await importProject(b, JSON.stringify({ ...asPm, instruments: asPm.instruments.map((i) => ({ ...i, anonymity: "secret" })) }))).toEqual({ error: E.damaged("instruments.0.anonymity") });
  });

  it("refuses what is not a project file of this version, a damaged file and the sample's, and writes nothing", async () => {
    const file = await exportProject(a, sampleId);
    const pm = { ...file, sample: false, note: null };
    const before = (await projects.list(b.ws)).length;
    const refused = async (f: unknown) => importProject(b, typeof f === "string" ? f : JSON.stringify(f));
    expect(await refused("{not json")).toEqual({ error: E.notJson });
    expect(await refused({ hello: 1 })).toEqual({ error: E.notProject });
    expect(await refused({ ...pm, version: PROJECT_VERSION + 1 })).toEqual({ error: E.newer(PROJECT_VERSION + 1, PROJECT_VERSION) });
    expect(await refused(file)).toEqual({ error: E.sample });
    expect(await refused(" ".repeat(PROJECT_FILE_MAX + 1))).toEqual({ error: E.tooLarge });
    expect(await refused({ ...pm, responses: pm.responses.map((r, i) => (i === 0 ? { ...r, inviteId: randomUUID() } : r)) })).toEqual({ error: E.damaged("a response's validation, list or invite") });
    expect("error" in (await refused({ ...pm, project: { ...pm.project, owner: "someone" } }))).toBe(true);
    // The JSON columns have the shapes the app reads.
    expect(await refused({ ...pm, instruments: pm.instruments.map((i) => ({ ...i, respondentFields: { evil: 1 } })) })).toEqual({ error: E.damaged("instruments.0.respondentFields") });
    expect(await refused({ ...pm, instruments: pm.instruments.map((i) => ({ ...i, closing: { confidence: false } })) })).toEqual({ error: E.damaged("instruments.0.closing.confidence") });
    expect(await refused({ ...pm, insights: pm.insights.map((x) => ({ ...x, tokensIn: 1e15 })) })).toEqual({ error: E.damaged("insights.0.tokensIn") });
    // The database's own rules, checked before anything is written.
    const set = pm.itemSets[0];
    expect(await refused({ ...pm, itemSets: [...pm.itemSets, { ...set, id: randomUUID(), items: [] }] })).toEqual({ error: E.damaged("a list's version") });
    expect(await refused({ ...pm, itemSets: pm.itemSets.map((s) => ({ ...s, items: s.items.map((it, i) => (i === 0 ? { ...it, originalText: "   " } : it)) })) })).toEqual({ error: E.damaged("an item's text") });
    const other = { ...set, id: randomUUID(), version: 99, items: set.items.map((it) => ({ ...it, id: randomUUID() })) };
    const crossed = pm.responses.map((r, i) => (i === 0 && r.answers.length > 0 ? { ...r, answers: r.answers.map((x, k) => (k === 0 ? { ...x, itemId: other.items[0].id } : x)) } : r));
    expect(await refused({ ...pm, itemSets: [...pm.itemSets, other], responses: crossed })).toEqual({ error: E.damaged("an answer's item") });
    const personal = pm.invites.filter((v) => v.kind === "personal");
    expect(await refused({ ...pm, invites: pm.invites.map((v) => (v.id === personal[1].id ? { ...v, email: personal[0].email } : v)) })).toEqual({ error: E.damaged("a personal invite's email") });
    expect(await refused({ ...pm, insights: pm.insights.map((x) => ({ ...x, state: "done", closedAt: null })) })).toEqual({ error: E.damaged("an action's state") });
    // What the app's own forms and Postgres refuse.
    expect(await refused({ ...pm, itemSets: pm.itemSets.map((st) => ({ ...st, items: st.items.map((it, i) => (i === 0 ? { ...it, originalText: "a\u0000b" } : it)) })) })).toEqual({ error: E.damaged("itemSets.0.items.0.originalText") });
    expect(await refused({ ...pm, project: { ...pm.project, createdAt: "1969-12-31T23:59:59Z" } })).toEqual({ error: E.damaged("project.createdAt") });
    expect(await refused({ ...pm, responses: pm.responses.map((r, i) => (i === 0 ? { ...r, submittedAt: r.submittedAt ?? r.createdAt, firstSubmittedAt: null } : r)) })).toEqual({ error: E.damaged("a response's dates") });
    expect(await refused({ ...pm, instruments: pm.instruments.map((i) => ({ ...i, title: "  " })) })).toEqual({ error: E.damaged("instruments.0.title") });
    expect(await refused({ ...pm, instruments: pm.instruments.map((i) => ({ ...i, respondentFields: [{ key: "team", label: "Team", type: "dropdown", mandatory: true, options: [] }] })) })).toEqual({ error: E.damaged("instruments.0.respondentFields") });
    expect(await refused({ ...pm, invites: pm.invites.map((v) => (v.id === personal[0].id ? { ...v, email: "not an email" } : v)) })).toEqual({ error: E.damaged("a personal invite's email") });
    expect(await refused({ ...pm, invites: pm.invites.map((v) => (v.id === personal[1].id ? { ...v, email: personal[0].email!.toUpperCase() } : v)) })).toEqual({ error: E.damaged("a personal invite's email") });
    expect((await projects.list(b.ws)).length).toBe(before);
  });

  it("refuses more responses submitted this month than the plan takes", async () => {
    const file = await exportProject(a, sampleId);
    const now = new Date();
    await workspaces.setPlan(b.ws, "pro");
    try {
      const room = (await roomInPlan(b.ws, "responses", now))!;
      const template = file.responses[0];
      const responses = Array.from({ length: room + 1 }, () => ({ ...template, id: randomUUID(), firstSubmittedAt: now.toISOString(), submittedAt: now.toISOString(), answers: [] }));
      const before = (await projects.list(b.ws)).length;
      expect(await importProject(b, JSON.stringify({ ...file, sample: false, note: null, responses, missingItems: [], insights: [] }), now)).toEqual({ error: E.responsesFull(room + 1, room) });
      expect((await projects.list(b.ws)).length).toBe(before);
    } finally {
      await workspaces.setPlan(b.ws, "free");
    }
  });
});
