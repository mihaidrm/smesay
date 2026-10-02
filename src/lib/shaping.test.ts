// stories/E4-2: checkShape (acceptance 1), the imported areas kept and the unplaced items
// marked (acceptance 2), the move (acceptance 3), the re-run that keeps the move (acceptance
// 4), through a fake model answer on E4-1's fake transport. The key is a made-up string.
import { beforeAll, describe, expect, it } from "vitest";
import { items, projects, workspaces } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { AI_COPY } from "@/lib/ai/copy";
import { ShapeOutput } from "@/lib/ai/shape-schema";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { commitUpload, latestSet } from "@/lib/imports";
import { memoryOutbox } from "@/lib/mail";
import { areaNames, checkShape, groupByArea, moveItemTo, SHAPE_COPY, shapeSet } from "@/lib/shaping";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let a: { ws: WorkspaceId; userId: string };
let b: { ws: WorkspaceId; userId: string };
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
  a = { ws: wsA, userId: signedIn.id }; b = { ws: wsB, userId: signedIn.id };
  withAreas = (await projects.create(wsA, { name: "With areas", createdBy: signedIn.id })).id;
  plain = (await projects.create(wsA, { name: "Plain", createdBy: signedIn.id })).id;
  await importList(a, withAreas, ["1. Receipts by phone | Submitting | Must", "2. Approval from the email | Approving | Must", "3. Reimbursement through payroll | Paying | Should", "- Travel advances before a trip", "- Per diem rates by country"]);
  await importList(a, plain, ["- Receipts by phone", "- Approval from the email", "- Reimbursement through payroll", "- Travel advances before a trip"]);
}, 60_000);

// A fake answer from the refs: areas as given, readers echoing the ref.
function answer(areas: { name: string; items: string[] }[], refs: string[]): ShapeOutput {
  return { areas: areas.map((ar, i) => ({ ...ar, rationale: `${i === 0 ? "First" : "Then"}, because ${ar.name.toLowerCase()}.` })), items: refs.map((r) => ({ ref: r, reader: `Reader ${r}`, flags: { ambiguity: r === "2" ? "Which email." : null, duplicateOf: null } })) };
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
    expect(checkShape({ ...ok, areas: [ok.areas[0], ok.areas[1]], items: ok.items.slice(0, 2) }, refs, ["A", "B"])).toBe("1 item(s) without a reader version");
    expect(checkShape({ ...ok, areas: [ok.areas[0], ok.areas[1]], items: [...ok.items, ok.items[0]] }, refs, ["A", "B"])).toBe("a ref appears twice in items");
    expect(checkShape({ ...ok, areas: [ok.areas[0], ok.areas[1]], items: ok.items.map((i) => ({ ...i, flags: { ...i.flags, duplicateOf: "7" } })) }, refs, ["A", "B"])).toBe("3 duplicateOf ref(s) unknown");
  });
  it("checks the golden set's own expectation as a partition", async () => {
    const expected = (await import("../../evals/expected/01.json")).default as { areas: { name: string; items: string[] }[]; items: { ref: string }[] };
    const refs = expected.items.map((i) => i.ref);
    expect(checkShape(answer(expected.areas, refs), refs, null)).toBeNull();
  });
});

describe("shapeSet", () => {
  it("keeps the imported areas, places the loose items and marks them, and logs one run", async () => {
    const { fetch, calls } = transport(answer([{ name: "Approving", items: ["2"] }, { name: "Submitting", items: ["1", "4", "5"] }, { name: "Paying", items: ["3"] }], ["1", "2", "3", "4", "5"]));
    const result = await shapeSet(a, withAreas, { fetch });
    if ("error" in result) throw new Error(result.error);
    expect(result).toMatchObject({ items: 5, areas: 3 });
    expect(result.set.areaOrder).toEqual(["Approving", "Submitting", "Paying"]);
    expect(result.set.shapeRuns).toBe(1);
    expect(result.set.shapedAt).not.toBeNull();
    expect(calls).toHaveLength(1);
    const body = calls[0] as { system: { text: string }[]; messages: { content: { text: string }[] }[] };
    expect(body.system[0].text).toContain('"Submitting", "Approving", "Paying"');
    expect(body.messages[0].content[0].text).toContain("[4] Travel advances before a trip");
    const rows = await items.forSet(a.ws, result.set.id);
    expect(rows.map((r) => [r.position, r.area, r.flags?.placedByAi ?? false, r.readerStatus])).toEqual([[1, "Submitting", false, "suggested"], [2, "Approving", false, "suggested"], [3, "Paying", false, "suggested"], [4, "Submitting", true, "suggested"], [5, "Submitting", true, "suggested"]]);
    expect(rows[0].areaRationale).toBe("Then, because submitting.");
    expect(rows[1].flags).toEqual({ ambiguity: "Which email." });
    expect(rows[3].readerText).toBe("Reader 4");
    const groups = groupByArea(result.set, rows);
    expect(groups.map((g) => [g.name, g.rationale, g.items.length])).toEqual([["Approving", "First, because approving.", 1], ["Submitting", "Then, because submitting.", 3], ["Paying", "Then, because paying.", 1]]);
  });

  it("refuses an answer that renames an imported area, and nothing changes", async () => {
    const before = await items.forSet(a.ws, (await latestSet(a.ws, withAreas))!.id);
    const { fetch } = transport(answer([{ name: "Approvals", items: ["2"] }, { name: "Submitting", items: ["1", "4", "5"] }, { name: "Paying", items: ["3"] }], ["1", "2", "3", "4", "5"]));
    expect(await shapeSet(a, withAreas, { fetch })).toEqual({ error: AI_COPY.invalid });
    expect(await items.forSet(a.ws, before[0].itemSetId)).toEqual(before);
  });

  it("moves an item on the PM's word, and a re-run leaves it there", async () => {
    const set = (await latestSet(a.ws, withAreas))!;
    const rows = await items.forSet(a.ws, set.id);
    const travel = rows.find((r) => r.position === 4)!;
    expect(await moveItemTo(a, withAreas, travel.id, "Nowhere")).toEqual({ error: SHAPE_COPY.unknownArea });
    const moved = await moveItemTo(a, withAreas, travel.id, "Paying");
    if ("error" in moved) throw new Error(moved.error);
    expect(moved.item).toMatchObject({ area: "Paying", areaRationale: "Then, because paying.", flags: { areaMoved: true } });
    await expect(moveItemTo(b, withAreas, travel.id, "Paying")).rejects.toBeInstanceOf(NotFoundError);
    const { fetch } = transport(answer([{ name: "Submitting", items: ["1", "4", "5"] }, { name: "Approving", items: ["2"] }, { name: "Paying", items: ["3"] }], ["1", "2", "3", "4", "5"]));
    const again = await shapeSet(a, withAreas, { fetch });
    if ("error" in again) throw new Error(again.error);
    expect(again.set.shapeRuns).toBe(2);
    expect(again.set.areaOrder).toEqual(["Submitting", "Approving", "Paying"]);
    const after = await items.forSet(a.ws, set.id);
    expect(after.find((r) => r.position === 4)).toMatchObject({ area: "Paying", flags: { areaMoved: true } });
    expect(after.find((r) => r.position === 5)).toMatchObject({ area: "Submitting", flags: { placedByAi: true } });
    expect(areaNames(again.set, after)).toEqual(["Submitting", "Approving", "Paying"]);
  });

  it("proposes areas for a list without them, and refuses fewer than three", async () => {
    const two = transport(answer([{ name: "Claiming", items: ["1", "2"] }, { name: "Paying", items: ["3", "4"] }], ["1", "2", "3", "4"]));
    expect(await shapeSet(a, plain, two)).toEqual({ error: AI_COPY.invalid });
    const three = transport(answer([{ name: "Claiming", items: ["1"] }, { name: "Approving", items: ["2"] }, { name: "Paying", items: ["3", "4"] }], ["1", "2", "3", "4"]));
    const result = await shapeSet(a, plain, three);
    if ("error" in result) throw new Error(result.error);
    expect(result.set.areaOrder).toEqual(["Claiming", "Approving", "Paying"]);
    const rows = await items.forSet(a.ws, result.set.id);
    expect(rows.every((r) => r.flags?.placedByAi === undefined)).toBe(true);
    const body = three.calls[0] as { system: { text: string }[] };
    expect(body.system[0].text).toContain("3 to 8 areas");
  });

  it("refuses the sample, a project without a list, and another workspace's project", async () => {
    const empty = (await projects.create(a.ws, { name: "Empty", createdBy: a.userId })).id;
    expect(await shapeSet(a, empty)).toEqual({ error: SHAPE_COPY.noSet });
    await expect(shapeSet(b, withAreas)).rejects.toBeInstanceOf(NotFoundError);
  });
});
