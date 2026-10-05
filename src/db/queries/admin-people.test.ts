// The admin People pages (stories/E14-3, acceptances 1 to 5): the list with sign-in methods,
// workspaces, last sign-in and open sessions, searched by email or name; a person's sessions
// without token or address; the invitations waiting; and each action with its audit row: the
// product's sign-in link, sign out everywhere, the removal that keeps the last owner, and the
// deletion through better-auth that leaves the workspaces' rows without the person. The admin
// check and Next's request helpers are stubbed (vi.mock: vitest.dev/api/vi.html#vi-mock).
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "@/db/test-db";
import { adminPerson, invitesFor, peopleDirectory, personSessions } from "@/db/queries/admin";
import { internal } from "@/db/queries/internal";
import { workspaces } from "@/db/queries/workspaces";
import type { AdminProof } from "@/db/types";
import { userAgentFamily } from "@/lib/accounts";
import { PEOPLE_ADMIN_COPY as C } from "@/lib/admin-copy";
import { memoryOutbox } from "@/lib/mail";
import { MEMBERS_COPY } from "@/lib/members-copy";

const stamp = Date.now();
const adminId = `pp-admin-${stamp}`;
const ownerId = `pp-owner-${stamp}`;
const memberId = `pp-member-${stamp}`;
const proof = { checked: "admin", userId: adminId } as AdminProof;

// The admin check: passes, or (admin.signedIn false) refuses as notFound() does, by throwing.
const admin = vi.hoisted(() => ({ signedIn: true }));
vi.mock("@/lib/admin", () => ({
  requireAdmin: async () => {
    if (!admin.signedIn) throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
    return { session: { user: { id: adminId } }, proof };
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const actions = await import("@/app/admin/people/[id]/actions");

let sql: ReturnType<typeof postgres>;
const made: string[] = [];
let wsId: string;
const blank = { error: null, done: null };
const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const rowsFor = async (userId: string) => sql`select action, admin_user_id, target_workspace_id, changes, outcome from admin_audit where target_user_id = ${userId} order by created_at`;
const CHROME_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  for (const [id, email, name] of [[adminId, `${adminId}@example.com`, "Admin"], [ownerId, `owner-${stamp}@marlow.example`, "Odile Owner"], [memberId, `member-${stamp}@marlow.example`, "Mark Member"]]) {
    await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${id}, ${name}, ${email}, true, now(), now())`;
  }
  const w = await workspaces.create({ name: `Osprey ${stamp}`, slug: `osprey-${stamp}` }, ownerId);
  wsId = w.id;
  made.push(w.id);
  await sql`insert into workspace_member (workspace_id, user_id, role) values (${wsId}, ${memberId}, 'member')`;
  await sql`insert into account (id, account_id, provider_id, user_id, access_token, created_at, updated_at) values (${"acc-" + stamp}, 'g-1', 'google', ${memberId}, 'secret-access-token', now(), now())`;
  await sql`insert into session (id, token, user_id, user_agent, ip_address, expires_at, created_at, updated_at) values
    (${"s1-" + stamp}, ${"tok1-" + stamp}, ${memberId}, ${CHROME_WIN}, '203.0.113.9', now() + interval '1 day', now() - interval '1 hour', now()),
    (${"s2-" + stamp}, ${"tok2-" + stamp}, ${memberId}, null, null, now() - interval '1 day', now() - interval '3 days', now())`;
  await sql`insert into project (workspace_id, name, created_by) values (${wsId}, 'Made by the member', ${memberId})`;
  await sql`insert into event (workspace_id, user_id, name) values (${wsId}, ${memberId}, 'project_created')`;
}, 60_000);

afterAll(async () => {
  await sql`delete from admin_audit where admin_user_id = ${adminId} or target_user_id = ${adminId}`;
  for (const id of made) await internal.hardDeleteWorkspace(id);
  await sql`delete from "user" where id in (${adminId}, ${ownerId}, ${memberId})`;
  await sql.end();
});

describe("the reads", () => {
  it("list people with methods, workspaces, last sign-in and open sessions, searched by email or name", async () => {
    const member = (await peopleDirectory(proof)).find((p) => p.id === memberId)!;
    expect(member).toMatchObject({ name: "Mark Member", emailVerified: true, methods: ["link", "google"], workspaces: [{ id: wsId, name: `Osprey ${stamp}`, role: "member" }], openSessions: 1 });
    expect(member.lastSignIn).not.toBeNull();
    expect((await peopleDirectory(proof, { q: `MEMBER-${stamp}@` })).map((p) => p.id)).toEqual([memberId]);
    expect((await peopleDirectory(proof, { q: "odile owner" })).map((p) => p.id)).toEqual([ownerId]);
    expect(await peopleDirectory(proof, { q: "%" })).toEqual([]);
    expect(await adminPerson(proof, "no-such-person")).toBeNull();
  });

  it("show sessions without token or address, and the invitations waiting", async () => {
    const sessions = await personSessions(proof, memberId);
    expect(sessions.map((s) => s.open)).toEqual([true, false]);
    for (const s of sessions) expect(Object.keys(s).sort()).toEqual(["createdAt", "expiresAt", "id", "open", "userAgent"]);
    expect(userAgentFamily(sessions[0].userAgent)).toEqual({ browser: "Chrome", os: "Windows" });
    await sql`insert into workspace_invite (workspace_id, email, role, invited_by, invited_at) values (${wsId}, ${`new-${stamp}@marlow.example`}, 'member', ${ownerId}, now() - interval '1 hour')`;
    expect((await invitesFor(proof, `NEW-${stamp}@marlow.example`, 15)).map((i) => [i.workspaceName, i.open])).toEqual([[`Osprey ${stamp}`, false]]);
  });

  it("names browser and system families", () => {
    expect(userAgentFamily("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0")).toEqual({ browser: "Edge", os: "Windows" });
    expect(userAgentFamily("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toEqual({ browser: "Safari", os: "iOS" });
    expect(userAgentFamily("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0")).toEqual({ browser: "Firefox", os: "macOS" });
    expect(userAgentFamily("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36")).toEqual({ browser: "Chrome", os: "Android" });
    expect(userAgentFamily(null)).toEqual({ browser: "Other", os: "Other" });
  });
});

describe("the actions", () => {
  it("do nothing for anyone but an admin", async () => {
    admin.signedIn = false;
    try {
      const sent = memoryOutbox.length;
      await expect(actions.sendLinkAction(blank, form({ userId: memberId }))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
      await expect(actions.signOutAction(blank, form({ userId: memberId }))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
      await expect(actions.deleteAccountAction(blank, form({ userId: memberId }))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
      expect(memoryOutbox.length).toBe(sent);
      expect(await rowsFor(memberId)).toHaveLength(0);
      expect(await sql`select id from session where user_id = ${memberId}`).toHaveLength(2);
    } finally {
      admin.signedIn = true;
    }
  });

  it("send the product's sign-in link, with its row", async () => {
    const before = memoryOutbox.length;
    expect(await actions.sendLinkAction(blank, form({ userId: memberId }))).toEqual({ error: null, done: C.linkSent(`member-${stamp}@marlow.example`) });
    expect(memoryOutbox.length).toBe(before + 1);
    expect(memoryOutbox.at(-1)!.to).toBe(`member-${stamp}@marlow.example`);
    expect(memoryOutbox.at(-1)!.text).toContain("/api/auth/magic-link/verify");
    expect((await rowsFor(memberId)).at(-1)).toMatchObject({ action: "magic_link_sent", admin_user_id: adminId, outcome: "done" });
    expect(await actions.sendLinkAction(blank, form({ userId: "nobody" }))).toEqual({ error: C.missing, done: null });
  });

  it("sign the person out everywhere", async () => {
    expect(await actions.signOutAction(blank, form({ userId: memberId }))).toEqual({ error: null, done: "2 sessions ended." });
    expect(await sql`select id from session where user_id = ${memberId}`).toHaveLength(0);
    expect((await rowsFor(memberId)).at(-1)).toMatchObject({ action: "signed_out_everywhere", changes: { open: 1 }, outcome: "done" });
  });

  it("remove from a workspace, keeping the last owner", async () => {
    expect((await actions.removeAction(blank, form({ userId: ownerId, workspaceId: wsId }))).error).toBe(MEMBERS_COPY.lastOwner);
    expect((await rowsFor(ownerId)).at(-1)).toMatchObject({ action: "member_removed", target_workspace_id: wsId, outcome: "refused" });
    expect((await actions.removeAction(blank, form({ userId: memberId, workspaceId: "00000000-0000-4000-8000-000000000000" }))).error).toBe(C.notMember);
    // The admin's own account is a member nowhere: refused inside the action, as a row.
    expect((await actions.removeAction(blank, form({ userId: adminId, workspaceId: wsId }))).error).toBe(MEMBERS_COPY.gone);
    expect((await rowsFor(adminId)).at(-1)).toMatchObject({ action: "member_removed", outcome: "refused" });
    expect(await actions.removeAction(blank, form({ userId: memberId, workspaceId: wsId }))).toEqual({ error: null, done: C.removed(`Osprey ${stamp}`) });
    expect(await sql`select 1 from workspace_member where workspace_id = ${wsId} and user_id = ${memberId}`).toHaveLength(0);
  });

  it("delete an account through better-auth, refused for a sole owner and for oneself", async () => {
    expect((await actions.deleteAccountAction(blank, form({ userId: ownerId }))).error).toBe(C.soleOwner([`Osprey ${stamp}`]));
    expect((await rowsFor(ownerId)).at(-1)).toMatchObject({ action: "account_deleted", outcome: "refused" });
    expect((await actions.deleteAccountAction(blank, form({ userId: adminId }))).error).toBe(C.self);

    await sql`insert into workspace_member (workspace_id, user_id, role) values (${wsId}, ${memberId}, 'member')`;
    expect(await actions.deleteAccountAction(blank, form({ userId: memberId }))).toEqual({ error: null, done: C.deleted });
    expect(await sql`select 1 from "user" where id = ${memberId}`).toHaveLength(0);
    expect(await sql`select 1 from account where user_id = ${memberId}`).toHaveLength(0);
    expect(await sql`select 1 from workspace_member where user_id = ${memberId}`).toHaveLength(0);
    // What the person made stays, without them.
    expect((await sql`select created_by from project where workspace_id = ${wsId} and name = 'Made by the member'`)[0].created_by).toBeNull();
    expect(await sql`select user_id from event where workspace_id = ${wsId} and name = 'project_created'`).toEqual([{ user_id: null }]);
    expect((await rowsFor(memberId)).at(-1)).toMatchObject({ action: "account_deleted", outcome: "done", changes: { workspaces: 1 } });
  });
});
