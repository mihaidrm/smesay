// The plan table and withinPlan() (stories/E2-6, acceptance 1 and 4): the free entry has no
// limits, the paid entries carry the business plan's numbers, and a workspace switched to pro by
// a column change is refused past 500 responses in a month while still free for projects.
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { instruments, invites, itemSets, projects, responses, workspaces } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import { auth } from "@/lib/auth";
import { memoryOutbox } from "@/lib/mail";
import { entitlement, entitlementFor, isWithin, limitFor, PLANS, TRIAL, validatedFree, withinPlan } from "@/lib/plans";
import { internal } from "@/db/queries/internal";
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
    expect(validatedFree).toEqual({ projects: 1, responsesPerMonth: 25, aiRunsPerMonth: null, seats: 1 });
    expect(Object.values(PLANS).map((p) => [p.key, p.aiCreditsCents, p.model])).toEqual([["free", 0, "claude-sonnet-5-5"], ["pro", 980, "claude-sonnet-5-5"], ["team", 2980, "claude-sonnet-5-5"], ["enterprise", 10_000, "claude-sonnet-5-5"]]);
    expect(TRIAL).toMatchObject({ days: 7, aiCreditsCents: 33, limits: { projects: 1, responsesPerMonth: 20 } });
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
      await responses.create(ws, { instrumentId: instrument.id, itemSetId: set.id, inviteId: invite.id, deviceToken: randomUUID().replace(/-/g, ""), fields: {}, signedOff: true, submittedAt: new Date("2026-10-03T10:00:00Z"), firstSubmittedAt: new Date("2026-10-03T10:00:00Z") });
      if (i === 0) expect(await withinPlan(ws, "responses", now)).toBe(true);
    }
    expect(await withinPlan(ws, "responses", now)).toBe(false);
    expect(await withinPlan(ws, "responses", new Date("2026-11-03T00:00:00Z"))).toBe(true);
    expect(await withinPlan(ws, "projects", now)).toBe(true);
    expect(await withinPlan(ws, "aiRuns", now)).toBe(true);
    expect((await workspaces.setPlan(ws, "free"))?.plan).toBe("free");
    expect(await withinPlan(ws, "responses", now)).toBe(true);
    // 500 inserts, one round trip each: 5.7 s on the CI runner once (run 37006617543), over
    // vitest's 5 s default.
  }, 30_000);
});

// E2-7 (decision 0068): the entitlement before launch, in the trial, on free after it and on
// a paid plan, with the admin's override; then withinPlan with the launched state injected
// (the shared test database is never launched).
describe("entitlementFor", () => {
  const at = new Date("2026-10-15T12:00:00Z");
  const base = { plan: "free" as const, aiBudgetEur: 10, aiCreditsCents: null, trialEndsAt: null };
  it("keeps the free plan without limits and the hidden budget until launch", () => {
    expect(entitlementFor(base, false, at)).toMatchObject({ name: "Free", trial: false, limits: PLANS.free.limits, aiCreditsCents: 1000, model: "claude-sonnet-5-5" });
    expect(entitlementFor({ ...base, plan: "pro", aiBudgetEur: 3 }, false, at)).toMatchObject({ name: "Pro", limits: PLANS.pro.limits, aiCreditsCents: 300 });
  });
  it("after launch: the trial while it runs, then free with no AI, the paid plan's credits, the admin's override", () => {
    const trial = { ...base, trialEndsAt: new Date("2026-10-20T12:00:00Z") };
    expect(entitlementFor(trial, true, at)).toMatchObject({ name: "Trial", trial: true, limits: TRIAL.limits, aiCreditsCents: 33 });
    expect(entitlementFor(trial, true, new Date("2026-10-20T12:00:01Z"))).toMatchObject({ name: "Free", trial: false, limits: validatedFree, aiCreditsCents: 0 });
    expect(entitlementFor(base, true, at)).toMatchObject({ name: "Free", trial: false, limits: validatedFree, aiCreditsCents: 0 });
    expect(entitlementFor({ ...base, plan: "pro" }, true, at)).toMatchObject({ name: "Pro", limits: PLANS.pro.limits, aiCreditsCents: 980 });
    expect(entitlementFor({ ...base, plan: "pro", trialEndsAt: trial.trialEndsAt }, true, at)).toMatchObject({ name: "Pro", trial: false });
    expect(entitlementFor({ ...base, aiCreditsCents: 500 }, true, at)).toMatchObject({ name: "Free", aiCreditsCents: 500 });
    expect(entitlementFor({ ...trial, aiCreditsCents: 0 }, true, at)).toMatchObject({ name: "Trial", aiCreditsCents: 0 });
  });
  it("limits a launched free workspace to one project and 25 responses, and a trial to 20", async () => {
    expect((await workspaces.getById(ws))?.plan).toBe("free");
    expect(await withinPlan(ws, "projects", now, false)).toBe(true);
    expect(await withinPlan(ws, "projects", now, true)).toBe(false);
    expect(await withinPlan(ws, "responses", now, true)).toBe(false);
    expect(await withinPlan(ws, "responses", new Date("2026-11-03T00:00:00Z"), true)).toBe(true);
    expect(await internal.setTrialEndsAt(ws, new Date("2026-10-22T00:00:00Z"))).toBe(true);
    expect((await entitlement(ws, now, true)).limits.responsesPerMonth).toBe(20);
    expect(await withinPlan(ws, "responses", now, true)).toBe(false);
    expect(await internal.setTrialEndsAt(ws, null)).toBe(true);
  });
});
