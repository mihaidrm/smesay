// stories/E4-2: checkShape (acceptance 1), the imported areas kept and the unplaced items
// marked (acceptance 2), the move (acceptance 3), the re-run that keeps the move (acceptance
// 4), through a fake model answer on E4-1's fake transport. The key is a made-up string.
// The new query helpers are also called with another workspace's id (SECURITY.md).
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { items, projects, workspaces } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { applyShaping, moveItem } from "@/db/queries/shaping";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { AI_COPY } from "@/lib/ai/copy";
import { ShapeOutput } from "@/lib/ai/shape-schema";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { commitUpload, latestSet } from "@/lib/imports";
import { memoryOutbox } from "@/lib/mail";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { areaNames, checkShape, cleanDuplicateOf, groupByArea, hadImportedAreas, moveItemTo, SHAPE_COPY, shapeSet } from "@/lib/shaping";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let a: { ws: WorkspaceId; userId: string };
let b: { ws: WorkspaceId; userId: string };
let sampleWs: { ws: WorkspaceId; userId: string };
let sampleProject: string;
let withAreas: string;
let plain: string;

async function signIn(email: string) {
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, headers };
}

async function importList(actor: { ws: WorkspaceId; userId: string }, projectId: string, lines: string[]) {
  const saved = await savePaste(actor, projectId, lines.join("\n"));
  if (!("upload" in saved)) throw new Error(saved.error);
  const committed = await commitUpload(actor.ws, saved.upload.id, actor.userId);
  if (!("set" in committed)) throw new Error(committed.error);
  return committed.set;
}

beforeAll(async () => {
  await prepareTestDatabase();
  process.env.ANTHROPIC_API_KEY = "test-key-for-the-fake-transport";
  const stamp = Date.now();
  const signedIn = await signIn(`shaping-${stamp}@example.com`);
  const wsA = await requireWorkspace(signedIn.headers, (await workspaces.create({ name: "Shaping A", slug: `shaping-a-${stamp}` }, signedIn.id)).id);
  const wsB = await requireWorkspace(signedIn.headers, (await workspaces.create({ name: "Shaping B", slug: `shaping-b-${stamp}` }, signedIn.id)).id);
  const wsS = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Shaping S", slug: `shaping-s-${randomUUID()}` }, signedIn.id)).id);
  a = { ws: wsA, userId: signedIn.id }; b = { ws: wsB, userId: signedIn.id }; sampleWs = { ws: wsS, userId: signedIn.id };
  sampleProject = (await projects.list(wsS)).find((p) => p.isSample)!.id;
  withAreas = (await projects.create(wsA, { name: "With areas", createdBy: signedIn.id })).id;
  plain = (await projects.create(wsA, { name: "Plain", createdBy: signedIn.id })).id;
  await importList(a, withAreas, ["1. Receipts by phone | Submitting | Must", "2. Approval from the email | Approving | Must", "3. Reimbursement through payroll | Paying | Should", "- Travel advances before a trip", "- Per diem rates by country"]);
  await importList(a, plain, ["- Receipts by phone", "- Approval from the email", "- Reimbursement through payroll", "- Travel advances before a trip"]);
}, 60_000);

// A fake answer from the refs: areas as given, readers echoing the ref.
function answer(areas: { name: string; items: string[] }[], refs: string[], duplicateOf: Record<string, string> = {}): ShapeOutput {
  return { areas: areas.map((ar, i) => ({ ...ar, rationale: `${i === 0 ? "First" : "Then"}, because ${ar.name.toLowerCase()}.` })), items: refs.map((r) => ({ ref: r, reader: `Reader ${r}`, flags: { ambiguity: r === "2" ? "Which email." : null, duplicateOf: duplicateOf[r] ?? null } })) };
}
function transport(out: unknown) {
  const calls: unknown[] = [];
  const fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    calls.push(JSON.parse(String(init?.body)));
    const message = { id: "msg", type: "message", role: "assistant", model: "claude-sonnet-5-5", content: [{ type: "text", text: JSON.stringify(out) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 900, output_tokens: 400, cache_creation_input_tokens: null, cache_read_input_tokens: null } };
    return new Response(JSON.stringify(message), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof globalThis.fetch;
  return { fetch, calls };
}
const body = (call: unknown) => call as { system: { text: string }[]; messages: { content: { text: string }[] }[] };

describe("checkShape", () => {
  const refs = ["1", "2", "3"];
  const ok = answer([{ name: "A", items: ["1", "2"] }, { name: "B", items: ["3"] }, { name: "C", items: [] }], refs);
  it("accepts a partition and refuses every other shape, by count", () => {
    const three = { ...ok, areas: [{ ...ok.areas[0] }, { ...ok.areas[1] }, { ...ok.areas[2], items: ["3"] }] };
    expect(checkShape({ ...three, areas: [three.areas[0], { ...three.areas[1], items: ["3"] }, { ...three.areas[2], items: ["1"] }] }, refs, null)).toBe("1 ref(s) in more than one area");
    expect(checkShape({ ...ok, areas: [ok.areas[0], ok.areas[1]] }, refs, null)).toBe("2 areas, expected 3 to 8");
    expect(checkShape({ ...ok, areas: [ok.areas[0], ok.areas[1]] }, refs, ["A", "B"])).toBeNull();
    expect(checkShape({ ...ok, areas: [{ ...ok.areas[0], items: ["1", "9"] }, ok.areas[1]] }, refs, ["A", "B"])).toBe("1 unknown ref(s) in areas");
    expect(checkShape({ ...ok, areas: [{ ...ok.areas[0], items: ["1"] }, ok.areas[1]] }, refs, ["A", "B"])).toBe("1 item(s) in no area");
    expect(checkShape({ ...ok, areas: [{ ...ok.areas[0], name: "Alpha" }, ok.areas[1]] }, refs, ["A", "B"])).toBe("imported areas not kept: 1 renamed, 1 missing");
    expect(checkShape({ ...ok, areas: [{ ...ok.areas[0], name: " " }, ok.areas[1]] }, refs, ["A", "B"])).toBe("a blank area name");
    expect(checkShape({ ...ok, areas: [{ ...ok.areas[0], name: "b" }, ok.areas[1]] }, refs, ["A", "B"])).toBe("an area name appears twice");
    expect(checkShape({ ...ok, areas: [ok.areas[0], ok.areas[1]], items: ok.items.slice(0, 2) }, refs, ["A", "B"])).toBe("1 item(s) without a reader version");
    expect(checkShape({ ...ok, areas: [ok.areas[0], ok.areas[1]], items: [...ok.items, ok.items[0]] }, refs, ["A", "B"])).toBe("a ref appears twice in items");
    // An item that came with an area must still be in it; one that came without may go anywhere.
    expect(checkShape({ ...ok, areas: [ok.areas[0], ok.areas[1]] }, refs, ["A", "B"], new Map([["3", "A"]]))).toBe("1 item(s) moved out of the area they came with");
    expect(checkShape({ ...ok, areas: [ok.areas[0], ok.areas[1]] }, refs, ["A", "B"], new Map([["3", "B"], ["1", "A"]]))).toBeNull();
    // A trailing space on a name is folded before the comparison.
    expect(checkShape({ ...ok, areas: [{ ...ok.areas[0], name: "A " }, ok.areas[1]] }, refs, ["A", "B"])).toBeNull();
  });
  it("drops a duplicateOf that is unknown, the item itself or a later item", () => {
    expect(cleanDuplicateOf("3", "1", refs)).toBe("1");
    expect(cleanDuplicateOf("1", "3", refs)).toBeNull();
    expect(cleanDuplicateOf("2", "2", refs)).toBeNull();
    expect(cleanDuplicateOf("2", "9", refs)).toBeNull();
    expect(cleanDuplicateOf("2", null, refs)).toBeNull();
  });
  it("checks the golden set's own expectation as a partition", async () => {
    const expected = (await import("../../evals/expected/01.json")).default as { areas: { name: string; items: string[] }[]; items: { ref: string }[] };
    const refs = expected.items.map((i) => i.ref);
    expect(checkShape(answer(expected.areas, refs), refs, null)).toBeNull();
  });
});

describe("shapeSet", () => {
  it("keeps the imported areas, places the loose items and marks them, and logs one run", async () => {
    const { fetch, calls } = transport(answer([{ name: "Approving", items: ["2"] }, { name: "Submitting", items: ["1", "4", "5"] }, { name: "Paying", items: ["3"] }], ["1", "2", "3", "4", "5"], { "5": "4", "4": "9" }));
    const result = await shapeSet(a, withAreas, { fetch });
    if ("error" in result) throw new Error(result.error);
    expect(result).toMatchObject({ items: 5, areas: 3 });
    expect(result.set.areas).toEqual([{ name: "Approving", rationale: "First, because approving." }, { name: "Submitting", rationale: "Then, because submitting." }, { name: "Paying", rationale: "Then, because paying." }]);
    expect(result.set.shapeRuns).toBe(1);
    expect(result.set.shapedAt).not.toBeNull();
    expect(calls).toHaveLength(1);
    // The area names are data, not instructions (SECURITY.md).
    expect(body(calls[0]).system[0].text).not.toContain("Submitting");
    expect(body(calls[0]).messages[0].content[0].text).toContain('AREAS: "Submitting", "Approving", "Paying"');
    expect(body(calls[0]).messages[0].content[0].text).toContain("[4] Travel advances before a trip");
    const rows = await items.forSet(a.ws, result.set.id);
    expect(hadImportedAreas(rows)).toBe(true);
    expect(rows.map((r) => [r.position, r.area, r.flags?.areaBy ?? null, r.readerStatus])).toEqual([[1, "Submitting", null, "suggested"], [2, "Approving", null, "suggested"], [3, "Paying", null, "suggested"], [4, "Submitting", "ai", "suggested"], [5, "Submitting", "ai", "suggested"]]);
    expect(rows[0].areaRationale).toBe("Then, because submitting.");
    expect(rows[1].flags).toEqual({ ambiguity: "Which email." });
    // duplicateOf: "4" names an unknown ref and is dropped; "5" names the earlier 4 and stays.
    expect(rows[3].flags).toEqual({ areaBy: "ai" });
    expect(rows[4].flags).toEqual({ areaBy: "ai", duplicateOf: "4" });
    expect(rows[3].readerText).toBe("Reader 4");
    const groups = groupByArea(result.set, rows);
    expect(groups.map((g) => [g.name, g.rationale, g.items.length])).toEqual([["Approving", "First, because approving.", 1], ["Submitting", "Then, because submitting.", 3], ["Paying", "Then, because paying.", 1]]);
  });

  it("refuses an answer that renames an imported area or moves an imported item, and nothing changes", async () => {
    const before = await items.forSet(a.ws, (await latestSet(a.ws, withAreas))!.id);
    const renamed = transport(answer([{ name: "Approvals", items: ["2"] }, { name: "Submitting", items: ["1", "4", "5"] }, { name: "Paying", items: ["3"] }], ["1", "2", "3", "4", "5"]));
    expect(await shapeSet(a, withAreas, renamed)).toEqual({ error: AI_COPY.invalid, retry: true });
    const strayed = transport(answer([{ name: "Approving", items: ["2", "1"] }, { name: "Submitting", items: ["4", "5"] }, { name: "Paying", items: ["3"] }], ["1", "2", "3", "4", "5"]));
    expect(await shapeSet(a, withAreas, strayed)).toEqual({ error: AI_COPY.invalid, retry: true });
    expect(await items.forSet(a.ws, before[0].itemSetId)).toEqual(before);
  });

  it("moves an item on the PM's word, a move to its own area changes nothing, and a re-run leaves the moved item", async () => {
    const set = (await latestSet(a.ws, withAreas))!;
    const rows = await items.forSet(a.ws, set.id);
    const travel = rows.find((r) => r.position === 4)!;
    expect(await moveItemTo(a, withAreas, travel.id, "Nowhere")).toEqual({ error: SHAPE_COPY.unknownArea });
    const same = await moveItemTo(a, withAreas, travel.id, "Submitting");
    expect("item" in same && same.item.flags).toEqual({ areaBy: "ai" });
    const moved = await moveItemTo(a, withAreas, travel.id, " Paying ");
    if ("error" in moved) throw new Error(moved.error);
    expect(moved.item).toMatchObject({ area: "Paying", areaRationale: "Then, because paying.", flags: { areaBy: "pm" } });
    await expect(moveItemTo(b, withAreas, travel.id, "Paying")).rejects.toBeInstanceOf(NotFoundError);
    // The re-run sends the moved item with its area and the other placed item without one.
    const { fetch, calls } = transport(answer([{ name: "Submitting", items: ["1", "5"] }, { name: "Approving", items: ["2"] }, { name: "Paying", items: ["3", "4"] }], ["1", "2", "3", "4", "5"]));
    const again = await shapeSet(a, withAreas, { fetch });
    if ("error" in again) throw new Error(again.error);
    expect(body(calls[0]).messages[0].content[0].text).toContain("[4] (area: Paying) Travel advances");
    expect(body(calls[0]).messages[0].content[0].text).toContain("[5] Per diem");
    expect(again.set.shapeRuns).toBe(2);
    expect(again.set.areas?.map((x) => x.name)).toEqual(["Submitting", "Approving", "Paying"]);
    const after = await items.forSet(a.ws, set.id);
    expect(after.find((r) => r.position === 4)).toMatchObject({ area: "Paying", flags: { areaBy: "pm" } });
    expect(after.find((r) => r.position === 5)).toMatchObject({ area: "Submitting", flags: { areaBy: "ai" } });
    expect(areaNames(again.set, after)).toEqual(["Submitting", "Approving", "Paying"]);
    // An emptied area keeps its rationale on the set, so a later move back finds it.
    const perDiem = after.find((r) => r.position === 5)!;
    const back = await moveItemTo(a, withAreas, perDiem.id, "Approving");
    expect("item" in back && back.item.areaRationale).toBe("Then, because approving.");
  });

  it("proposes areas for a list without them, refuses fewer than three, and a re-run can change them", async () => {
    const two = transport(answer([{ name: "Claiming", items: ["1", "2"] }, { name: "Paying", items: ["3", "4"] }], ["1", "2", "3", "4"]));
    expect(await shapeSet(a, plain, two)).toEqual({ error: AI_COPY.invalid, retry: true });
    const three = transport(answer([{ name: "Claiming", items: ["1"] }, { name: "Approving", items: ["2"] }, { name: "Paying", items: ["3", "4"] }], ["1", "2", "3", "4"]));
    const result = await shapeSet(a, plain, three);
    if ("error" in result) throw new Error(result.error);
    expect(result.set.areas?.map((x) => x.name)).toEqual(["Claiming", "Approving", "Paying"]);
    const rows = await items.forSet(a.ws, result.set.id);
    expect(hadImportedAreas(rows)).toBe(false);
    expect(rows.every((r) => r.flags?.areaBy === "ai")).toBe(true);
    expect(body(three.calls[0]).system[0].text).toContain("3 to 8 areas");
    // The re-run sends no areas, so the model may group afresh.
    const fresh = transport(answer([{ name: "Before the trip", items: ["4"] }, { name: "During", items: ["1"] }, { name: "After", items: ["2", "3"] }], ["1", "2", "3", "4"]));
    const again = await shapeSet(a, plain, fresh);
    if ("error" in again) throw new Error(again.error);
    expect(body(fresh.calls[0]).messages[0].content[0].text).not.toContain("AREAS");
    expect(body(fresh.calls[0]).messages[0].content[0].text).not.toContain("(area:");
    expect(again.set.areas?.map((x) => x.name)).toEqual(["Before the trip", "During", "After"]);
  });

  it("refuses the sample, a project without a list, a move before shaping, and another workspace's project", async () => {
    expect(await shapeSet(sampleWs, sampleProject)).toEqual({ error: AI_COPY.sample, retry: false });
    const sampleItem = (await items.list(sampleWs.ws))[0];
    expect(await moveItemTo(sampleWs, sampleProject, sampleItem.id, sampleItem.area ?? "")).toEqual({ error: PROJECTS_COPY.sample });
    const empty = (await projects.create(a.ws, { name: "Empty", createdBy: a.userId })).id;
    expect(await shapeSet(a, empty)).toEqual({ error: SHAPE_COPY.noSet, retry: false });
    const fresh = (await projects.create(a.ws, { name: "Fresh", createdBy: a.userId })).id;
    const set = await importList(a, fresh, ["- One", "- Two"]);
    const [one] = await items.forSet(a.ws, set.id);
    expect(await moveItemTo(a, fresh, one.id, "Anything")).toEqual({ error: SHAPE_COPY.notShapedYet });
    await expect(shapeSet(b, withAreas)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses too many imported areas, a long area name and a long list before any call", async () => {
    const { fetch, calls } = transport({});
    const many = (await projects.create(a.ws, { name: "Many", createdBy: a.userId })).id;
    await importList(a, many, Array.from({ length: 13 }, (_, i) => `- Item ${i + 1} | Area ${i + 1} | Must`));
    expect(await shapeSet(a, many, { fetch })).toEqual({ error: SHAPE_COPY.tooManyAreas(13), retry: false });
    const long = (await projects.create(a.ws, { name: "Long", createdBy: a.userId })).id;
    await importList(a, long, [`- Item one | ${"x".repeat(61)} | Must`, "- Item two"]);
    expect(await shapeSet(a, long, { fetch })).toEqual({ error: SHAPE_COPY.longArea(61), retry: false });
    const big = (await projects.create(a.ws, { name: "Big", createdBy: a.userId })).id;
    await importList(a, big, Array.from({ length: 401 }, (_, i) => `- Item ${i + 1}`));
    expect(await shapeSet(a, big, { fetch })).toEqual({ error: SHAPE_COPY.tooManyItems(401), retry: false });
    expect(calls).toHaveLength(0);
  });

  it("keeps the new query helpers inside the workspace", async () => {
    const set = (await latestSet(a.ws, withAreas))!;
    const [first] = await items.forSet(a.ws, set.id);
    expect(await items.forSet(b.ws, set.id)).toEqual([]);
    expect(await applyShaping(b.ws, set.id, [{ name: "X", rationale: "Y" }], [{ itemId: first.id, area: "X", byAi: true, reader: "r", ambiguity: null, duplicateOf: null }])).toBeNull();
    expect(await moveItem(b.ws, first.id, "X", null)).toBeNull();
    expect((await items.forSet(a.ws, set.id))[0]).toEqual(first);
  });
});
