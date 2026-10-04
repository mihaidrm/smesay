// The stream route of live updates (stories/E8-7; src/app/api/projects/[projectId]/events/
// route.ts, tested here because database access lives under src/db): a project of another
// workspace is 404, HEAD opens no stream, a request that aborted while the route looked the
// project up leaves no listener, and a stream that ends removes its listener. The session is replaced by a stub
// (vi.mock: vitest.dev/api/vi.html#vi-mock) that returns the workspace the test chooses.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "@/db/test-db";
import { instruments, projects } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { subscriberCount } from "@/db/queries/results-events";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import type { WorkspaceId } from "@/db/types";

const session = vi.hoisted(() => ({ ws: null as string | null }));
vi.mock("@/lib/current-workspace", () => ({
  requireCurrentWorkspace: async () => ({ current: { ws: session.ws } }),
}));

const { GET, HEAD } = await import("@/app/api/projects/[projectId]/events/route");

let sql: ReturnType<typeof postgres>;
const userId = `events-route-${Date.now()}`;
const made: string[] = [];
let wsA: WorkspaceId;
let wsB: WorkspaceId;
let projectA: string;
let instrumentA: string;

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${userId}, 'Route', ${userId + "@example.com"}, true, now(), now())`;
  const a = await createWorkspaceWithSample({ name: "Route A", slug: `route-a-${Date.now()}` }, userId);
  const b = await createWorkspaceWithSample({ name: "Route B", slug: `route-b-${Date.now()}` }, userId);
  made.push(a.id, b.id);
  wsA = unsafeWorkspaceId(a.id);
  wsB = unsafeWorkspaceId(b.id);
  projectA = (await projects.list(wsA)).find((p) => p.isSample)!.id;
  instrumentA = (await instruments.latestForProject(wsA, projectA))!.id;
}, 60_000);

afterAll(async () => {
  for (const id of made) await internal.hardDeleteWorkspace(id);
  await sql`delete from "user" where id = ${userId}`;
  await sql.end();
});

const call = (signal?: AbortSignal) => GET(new Request(`http://localhost/api/projects/${projectA}/events`, { signal }), { params: Promise.resolve({ projectId: projectA }) });

describe("the events route", () => {
  it("answers 404 for a project of another workspace", async () => {
    session.ws = wsB;
    expect((await call()).status).toBe(404);
  });

  it("answers HEAD with 405 and opens no stream", () => {
    const res = HEAD();
    expect([res.status, res.headers.get("allow")]).toEqual([405, "GET"]);
    expect(subscriberCount(instrumentA)).toBe(0);
  });

  it("opens no stream for a request that aborted before it was set up", async () => {
    session.ws = wsA;
    const ac = new AbortController();
    ac.abort();
    expect((await call(ac.signal)).status).toBe(204);
    expect(subscriberCount(instrumentA)).toBe(0);
  });

  it("streams ready for the session's project, and removes its listener when it ends", async () => {
    session.ws = wsA;
    const ac = new AbortController();
    const res = await call(ac.signal);
    expect([res.status, res.headers.get("content-type")]).toEqual([200, "text/event-stream; charset=utf-8"]);
    expect(subscriberCount(instrumentA)).toBe(1);
    const reader = res.body!.getReader();
    const first = new TextDecoder().decode((await reader.read()).value);
    expect(first).toBe(`event: ready\ndata: {"instrument":"${instrumentA}","version":0}\n\n`);
    ac.abort();
    expect(subscriberCount(instrumentA)).toBe(0);
    expect((await reader.read()).done).toBe(true);
  });

  it("removes its listener when the reader cancels", async () => {
    session.ws = wsA;
    const res = await call();
    expect(subscriberCount(instrumentA)).toBe(1);
    await res.body!.cancel();
    expect(subscriberCount(instrumentA)).toBe(0);
  });
});
