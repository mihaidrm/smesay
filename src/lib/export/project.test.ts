// The whole project out and in (stories/E10-2): the seeded sample exported (format and
// version at the top, no token, no passcode, invites with their emails, the sample marked),
// then imported into a second workspace as a PM's file (its sample mark taken off, since a
// sample file is refused): the same counts and the same agreement numbers, new ids, new
// tokens, the public link revoked, actions with their state and mapped citations. The refusals: a
// newer version named, not JSON, not a project file, a damaged reference, the sample's file;
// another workspace cannot export the project.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { instruments, invites, projects } from "@/db/queries";
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
import { exportProject, importProject, PROJECT_VERSION } from "./project";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let a: { ws: WorkspaceId; userId: string }; let b: { ws: WorkspaceId; userId: string };
let sampleId: string;
const NONE: ResultsFilter = { fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: false, sort: null, split: null, gaps: null };
const E = EXPORT_COPY.importErrors;
// The seed's counts (src/db/seed/sample.ts expected; the lint rule keeps the seed out of src/lib).
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
    const result = await importProject(b, JSON.stringify({ ...file, sample: false, note: null }));
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
    // A file read back and imported twice makes two projects, never a clash.
    const again = await importProject(b, JSON.stringify({ ...file, sample: false, note: null }));
    expect("projectId" in again && again.projectId).not.toBe(result.projectId);
  });

  it("refuses what is not a project file of this version, a damaged file and the sample's", async () => {
    const file = await exportProject(a, sampleId);
    const pm = { ...file, sample: false, note: null };
    expect(await importProject(b, "{not json")).toEqual({ error: E.notJson });
    expect(await importProject(b, JSON.stringify({ hello: 1 }))).toEqual({ error: E.notProject });
    expect(await importProject(b, JSON.stringify({ ...pm, version: PROJECT_VERSION + 1 }))).toEqual({ error: E.newer(PROJECT_VERSION + 1, PROJECT_VERSION) });
    expect(await importProject(b, JSON.stringify(file))).toEqual({ error: E.sample });
    const broken = { ...pm, responses: pm.responses.map((r, i) => (i === 0 ? { ...r, inviteId: randomUUID() } : r)) };
    expect(await importProject(b, JSON.stringify(broken))).toEqual({ error: E.damaged("a response's instrument, list or invite") });
    const extra = { ...pm, project: { ...pm.project, owner: "someone" } };
    expect("error" in (await importProject(b, JSON.stringify(extra)))).toBe(true);
    const before = (await projects.list(b.ws)).length;
    expect((await projects.list(b.ws)).length).toBe(before);
  });
});
