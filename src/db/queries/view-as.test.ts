// An admin's view of a workspace (stories/E14-4, acceptance 5): starting it sets the session's
// fields and writes view_started; the app context then serves the workspace read-only; a write
// through a server action is refused (sent to the view-only page) and changes nothing; the view
// expires after 60 minutes and the expiry is recorded; an email that is no longer an admin's
// loses the view. The session read is stubbed (vi.mock: vitest.dev/api/vi.html#vi-mock) with
// the real session row, which better-auth's adapter updates.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "@/db/test-db";
import { adminWorkspace } from "@/db/queries/admin";
import { internal } from "@/db/queries/internal";
import { workspaces } from "@/db/queries/workspaces";
import type { AdminProof } from "@/db/types";
import type { Session } from "@/lib/session";

const stamp = Date.now();
const adminId = `va-admin-${stamp}`;
const adminEmail = `va-admin-${stamp}@example.com`;
const ownerId = `va-owner-${stamp}`;
const token = `va-token-${stamp}`;
const proof = { checked: "admin", userId: adminId } as AdminProof;

const current = vi.hoisted(() => ({ session: null as unknown }));
vi.mock("@/lib/session", () => ({ requireSession: async () => current.session, signedIn: async () => true }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

const { startView, stopView, viewingOf, VIEW_MINUTES } = await import("@/lib/view-as");
const { getAppContext } = await import("@/lib/current-workspace");
const { createProjectAction } = await import("@/app/app/(shell)/projects/actions");
const { switchWorkspace } = await import("@/app/app/actions");

// Where a redirect thrown by a server action goes (Next's redirect error carries it in digest).
async function redirectedTo(run: () => Promise<unknown>): Promise<string> {
  try { await run(); } catch (error) { return String((error as { digest?: string }).digest ?? "").split(";")[2] ?? ""; }
  return "";
}

let sql: ReturnType<typeof postgres>;
let wsId: string;

// The session as better-auth reads it, from the row.
async function readSession(): Promise<Session> {
  const [s] = await sql`select id, token, user_id, expires_at, created_at, updated_at, current_workspace_id, view_as_workspace_id, view_as_until from session where token = ${token}`;
  return {
    user: { id: adminId, email: adminEmail, emailVerified: true, name: "Admin", createdAt: new Date(), updatedAt: new Date(), image: null },
    session: { id: s.id, token: s.token, userId: s.user_id, expiresAt: s.expires_at, createdAt: s.created_at, updatedAt: s.updated_at, currentWorkspaceId: s.current_workspace_id, viewAsWorkspaceId: s.view_as_workspace_id, viewAsUntil: s.view_as_until },
  } as unknown as Session;
}
const rows = async () => sql`select action, changes, outcome from admin_audit where target_workspace_id = ${wsId} order by created_at`;

beforeAll(async () => {
  process.env.ADMIN_EMAILS = adminEmail;
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${adminId}, 'Admin', ${adminEmail}, true, now(), now()), (${ownerId}, 'Owner', ${ownerId + "@example.com"}, true, now(), now())`;
  await sql`insert into session (id, token, user_id, expires_at, created_at, updated_at) values (${"va-" + stamp}, ${token}, ${adminId}, now() + interval '1 day', now(), now())`;
  wsId = (await workspaces.create({ name: `Lapwing ${stamp}`, slug: `lapwing-${stamp}` }, ownerId)).id;
}, 60_000);

afterAll(async () => {
  delete process.env.ADMIN_EMAILS;
  await sql`delete from admin_audit where admin_user_id = ${adminId}`;
  await internal.hardDeleteWorkspace(wsId);
  await sql`delete from "user" where id in (${adminId}, ${ownerId})`;
  await sql.end();
});

describe("view as", () => {
  it("starts a view, serves the workspace, refuses a write, and stops", async () => {
    const ws = (await adminWorkspace(proof, wsId))!.ws;
    const until = await startView(proof, await readSession(), ws);
    expect(Math.round((until.getTime() - Date.now()) / 60_000)).toBe(VIEW_MINUTES);
    expect((await rows()).at(-1)).toMatchObject({ action: "view_started", outcome: "done", changes: { minutes: 60 } });

    current.session = await readSession();
    const ctx = await getAppContext("/app");
    expect(ctx.viewing?.workspace.id).toBe(wsId);
    expect(ctx.current?.workspace.id).toBe(wsId);
    expect(ctx.memberships.map((w) => w.id)).toEqual([wsId]);

    // A write: refused by sending the request to the view-only page; no project is made.
    const form = new FormData();
    form.set("name", "Written during a view");
    expect(await redirectedTo(() => createProjectAction({ error: null, saved: false }, form))).toBe("/app/view-only");
    expect(await sql`select id from project where workspace_id = ${wsId} and name = 'Written during a view'`).toHaveLength(0);
    // The actions without a current workspace are refused the same way (refuseWhileViewing).
    const sw = new FormData();
    sw.set("workspaceId", wsId);
    expect(await redirectedTo(() => switchWorkspace(sw))).toBe("/app/view-only");
    expect((await sql`select current_workspace_id from session where token = ${token}`)[0].current_workspace_id).toBeNull();

    // A second start stops the first: every start has its stop.
    await startView(proof, await readSession(), ws);
    expect((await rows()).slice(-2).map((r) => r.action)).toEqual(["view_stopped", "view_started"]);

    await stopView(proof, await readSession());
    current.session = await readSession();
    expect((await getAppContext("/app")).viewing).toBeNull();
    expect((await rows()).at(-1)).toMatchObject({ action: "view_stopped", outcome: "done", changes: { reason: "stopped" } });
  });

  it("ends on its own after 60 minutes, and records the expiry", async () => {
    const ws = (await adminWorkspace(proof, wsId))!.ws;
    await startView(proof, await readSession(), ws, new Date(Date.now() - (VIEW_MINUTES + 1) * 60_000));
    expect(await viewingOf(await readSession())).toBeNull();
    const [s] = await sql`select view_as_workspace_id, view_as_until from session where token = ${token}`;
    expect(s).toEqual({ view_as_workspace_id: null, view_as_until: null });
    expect((await rows()).at(-1)).toMatchObject({ action: "view_stopped", changes: { reason: "expired" } });
  });

  it("holds only while the email is an admin's", async () => {
    const ws = (await adminWorkspace(proof, wsId))!.ws;
    await startView(proof, await readSession(), ws);
    process.env.ADMIN_EMAILS = "someone-else@example.com";
    try {
      expect(await viewingOf(await readSession())).toBeNull();
      expect((await sql`select view_as_workspace_id from session where token = ${token}`)[0].view_as_workspace_id).toBeNull();
      // No admin to record it under: the fields go, no row is written.
      expect((await rows()).at(-1)).toMatchObject({ action: "view_started" });
    } finally {
      process.env.ADMIN_EMAILS = adminEmail;
    }
  });
});
