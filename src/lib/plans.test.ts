// The plan table and withinPlan() (stories/E2-6, acceptance 1 and 4): the free entry has no
// limits, the paid entries carry the business plan's numbers, and a workspace switched to pro by
// a column change is refused past 500 responses in a month while still free for projects.
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { instruments, invites, itemSets, projects, responses, workspaces } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import { auth } from "@/lib/auth";
import { memoryOutbox } from "@/lib/mail";
import { isWithin, limitFor, PLANS, validatedFree, withinPlan } from "@/lib/plans";
import { requireWorkspace } from "@/lib/workspace";
import type { WorkspaceId } from "@/db/types";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let ws: WorkspaceId;
const now = new Date("2026-10-15T12:00:00Z");

beforeAll(async () => {
  await prepareTestDatabase();
  const email = `plans-${Date.now()}@example.com`;
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  const userId = (await auth.api.getSession({ headers }))!.user.id;
  ws = await requireWorkspace(headers, (await workspaces.create({ name: "Plans", slug: "plans-" + randomUUID() }, userId)).id);
}, 60_000);

describe("the plan table", () => {
  it("has the four plans with the business plan's prices and limits, and no limit on free", () => {
    expect(Object.keys(PLANS)).toEqual(["free", "pro", "team", "enterprise"]);
    expect(PLANS.free.limits).toEqual({ projects: null, responsesPerMonth: null, aiRunsPerMonth: null, seats: null });
    expect(PLANS.pro).toMatchObject({ priceEurPerMonth: 49, priceEurPerYear: 490, limits: { responsesPerMonth: 500 } });
    expect(PLANS.team).toMatchObject({ priceEurPerMonth: 149, priceEurPerYear: 1490, limits: { responsesPerMonth: 2500, seats: 5 } });
    expect(PLANS.enterprise).toMatchObject({ priceEurPerYear: 6000, limits: { responsesPerMonth: null } });
    expect(validatedFree).toEqual({ projects: 1, responsesPerMonth: 25, aiRunsPerMonth: 3, seats: 1 });
  });
  it("treats null as no limit and counts up to the limit", () => {
    expect(isWithin(null, 1_000_000)).toBe(true);
    expect(isWithin(500, 499)).toBe(true);
    expect(isWithin(500, 500)).toBe(false);
    expect(limitFor("free", "responses")).toBeNull();
    expect(limitFor("pro", "responses")).toBe(500);
    expect(limitFor("pro", "projects")).toBeNull();
  });
});

describe("withinPlan", () => {
  it("is always true on the free entry, whatever the usage", async () => {
    for (const kind of ["projects", "responses", "aiRuns"] as const) expect(await withinPlan(ws, kind, now)).toBe(true);
  });

  it("refuses past a paid plan's limit after a column change, and stays true where the plan has no limit", async () => {
    expect((await workspaces.setPlan(ws, "pro"))?.plan).toBe("pro");
    const p = await projects.create(ws, { name: "P" });
    const set = await itemSets.create(ws, { projectId: p.id, version: 1, source: "csv" });
    const instrument = await instruments.create(ws, { projectId: p.id, itemSetId: set.id, title: "I" });
    const invite = await invites.create(ws, { instrumentId: instrument.id, kind: "public", token: randomUUID().replace(/-/g, "") });
    for (let i = 0; i < PLANS.pro.limits.responsesPerMonth!; i++) {
      await responses.create(ws, { instrumentId: instrument.id, itemSetId: set.id, inviteId: invite.id, deviceToken: randomUUID().replace(/-/g, ""), fields: {}, signedOff: true, submittedAt: new Date("2026-10-03T10:00:00Z") });
      if (i === 0) expect(await withinPlan(ws, "responses", now)).toBe(true);
    }
    expect(await withinPlan(ws, "responses", now)).toBe(false);
    expect(await withinPlan(ws, "responses", new Date("2026-11-03T00:00:00Z"))).toBe(true);
    expect(await withinPlan(ws, "projects", now)).toBe(true);
    expect(await withinPlan(ws, "aiRuns", now)).toBe(true);
    expect((await workspaces.setPlan(ws, "free"))?.plan).toBe("free");
    expect(await withinPlan(ws, "responses", now)).toBe(true);
  });
});
