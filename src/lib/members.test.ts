// Members and roles (stories/E2-4, acceptance 2 to 4) on the test database: an owner's invite
// writes the row and sends E2-1's email; a member's invite, removal and role change are refused
// with 403 by the server; the last owner cannot be removed or demoted; the invitee's first
// signed-in request turns the invitation into a membership and an expired one is ignored; a
// removed person has no workspace on the next request.
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { members, workspaceInvites, workspaces } from "@/db/queries";
import { acceptPendingInvites } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import { auth } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";
import { memoryOutbox } from "@/lib/mail";
import { INVITE_LIMIT, INVITE_VALID_MINUTES } from "@/lib/invites";
import { inviteMember, isOpenInvite, listMembersAndInvites, removeMember, setMemberRole } from "@/lib/members";
import { MEMBERS_COPY } from "@/lib/members-copy";
import { requireWorkspace } from "@/lib/workspace";
import type { WorkspaceId } from "@/db/types";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const stamp = Date.now();
type Person = { id: string; email: string; headers: Headers };
let owner: Person, member: Person, invitee: Person;
let ws: WorkspaceId;

async function signIn(email: string): Promise<Person> {
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  const session = (await auth.api.getSession({ headers }))!;
  return { id: session.user.id, email, headers };
}

beforeAll(async () => {
  await prepareTestDatabase();
  owner = await signIn(`owner-${stamp}@example.com`);
  member = await signIn(`member-${stamp}@example.com`);
  invitee = await signIn(`invitee-${stamp}@example.com`);
  const created = await workspaces.create({ name: "Members", slug: `members-${stamp}` }, owner.id);
  ws = await requireWorkspace(owner.headers, created.id);
  await members.add(ws, member.id, "member");
}, 60_000);

describe("invite", () => {
  it("as an owner writes the row and sends the sign-in email", async () => {
    const before = memoryOutbox.length;
    const result = await inviteMember({ ws, userId: owner.id }, ` ${invitee.email.toUpperCase()} `);
    expect(result).toEqual({ sent: true, email: invitee.email });
    expect(memoryOutbox.length).toBe(before + 1);
    expect(memoryOutbox[before]).toMatchObject({ to: invitee.email, subject: "Your sign-in link for SMEsay" });
    const { invited } = await listMembersAndInvites(ws);
    expect(invited.map((i) => i.email)).toEqual([invitee.email]);
  });

  it("refuses an empty or bad address and an address already in the workspace, as a message", async () => {
    expect(await inviteMember({ ws, userId: owner.id }, "  ")).toEqual({ error: MEMBERS_COPY.emptyAddress });
    expect(await inviteMember({ ws, userId: owner.id }, "not an address")).toEqual({ error: MEMBERS_COPY.badAddress("not an address") });
    expect(await inviteMember({ ws, userId: owner.id }, member.email)).toEqual({ error: MEMBERS_COPY.alreadyMember(member.email) });
  });

  it("replaces an earlier invitation to the same address instead of adding a row", async () => {
    const again = `again-${stamp}@example.com`;
    await inviteMember({ ws, userId: owner.id }, again);
    await inviteMember({ ws, userId: owner.id }, again.toUpperCase());
    expect((await workspaceInvites.list(ws)).filter((i) => i.email === again)).toHaveLength(1);
  });

  it("stops after the workspace's limit within the window", async () => {
    const before = memoryOutbox.length;
    const sent = (await workspaceInvites.countSince(ws, 10));
    let refused: unknown = null;
    for (let i = sent; i <= INVITE_LIMIT; i++) refused = await inviteMember({ ws, userId: owner.id }, `many-${i}-${stamp}@example.com`);
    expect(refused).toEqual({ error: MEMBERS_COPY.tooMany });
    expect(memoryOutbox.length - before).toBe(INVITE_LIMIT - sent);
  });

  it("as a member is refused with 403, as are remove and role change", async () => {
    const before = memoryOutbox.length;
    for (const call of [
      () => inviteMember({ ws, userId: member.id }, `x-${stamp}@example.com`),
      () => removeMember({ ws, userId: member.id }, owner.id),
      () => setMemberRole({ ws, userId: member.id }, member.id, "owner"),
    ]) {
      const error = await call().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect((error as ForbiddenError).status).toBe(403);
    }
    expect(memoryOutbox.length).toBe(before);
    expect((await members.get(ws, member.id))?.role).toBe("member");
  });

  it("as someone outside the workspace is 404", async () => {
    await expect(inviteMember({ ws, userId: invitee.id }, "a@example.com")).rejects.toMatchObject({ status: 404 });
  });
});

describe("accepting", () => {
  it("turns the open invitation into a membership on the invitee's signed-in request, once", async () => {
    expect((await workspaces.listForUser(invitee.id)).map((w) => w.id)).toEqual([]);
    expect(await acceptPendingInvites(invitee.id, invitee.email.toUpperCase(), INVITE_VALID_MINUTES)).toBe(1);
    expect((await workspaces.listForUser(invitee.id)).map((w) => w.id)).toEqual([ws]);
    expect((await members.get(ws, invitee.id))?.role).toBe("member");
    expect(await acceptPendingInvites(invitee.id, invitee.email, INVITE_VALID_MINUTES)).toBe(0);
    expect((await listMembersAndInvites(ws)).invited.map((i) => i.email)).not.toContain(invitee.email);
  });

  it("ignores an expired invitation", async () => {
    const late = `late-${stamp}@example.com`;
    const row = await workspaceInvites.create(ws, { email: late, invitedBy: owner.id });
    await workspaceInvites.update(ws, row.id, { invitedAt: new Date(Date.now() - 16 * 60 * 1000) });
    const stale = (await workspaceInvites.get(ws, row.id))!;
    expect(isOpenInvite(stale)).toBe(false);
    expect(await acceptPendingInvites(`user-${randomUUID()}`, late, INVITE_VALID_MINUTES)).toBe(0);
    expect((await listMembersAndInvites(ws)).invited.map((i) => i.email)).not.toContain(late);
  });
});

describe("roles and removal", () => {
  it("keeps at least one owner", async () => {
    expect(await removeMember({ ws, userId: owner.id }, owner.id)).toEqual({ error: MEMBERS_COPY.lastOwner });
    expect(await setMemberRole({ ws, userId: owner.id }, owner.id, "member")).toEqual({ error: MEMBERS_COPY.lastOwner });
    expect(await setMemberRole({ ws, userId: owner.id }, member.id, "owner")).toEqual({ role: "owner" });
    expect(await setMemberRole({ ws, userId: owner.id }, owner.id, "member")).toEqual({ role: "member" });
    expect(await setMemberRole({ ws, userId: member.id }, owner.id, "owner")).toEqual({ role: "owner" });
  });

  it("removes a member, who then has no workspace on the next request", async () => {
    expect(await removeMember({ ws, userId: owner.id }, invitee.id)).toEqual({ removed: true });
    expect((await workspaces.listForUser(invitee.id)).map((w) => w.id)).toEqual([]);
    await expect(requireWorkspace(invitee.headers, ws)).rejects.toMatchObject({ status: 404 });
    expect(await removeMember({ ws, userId: owner.id }, invitee.id)).toEqual({ error: MEMBERS_COPY.gone });
    expect(await setMemberRole({ ws, userId: owner.id }, invitee.id, "owner")).toEqual({ error: MEMBERS_COPY.gone });
  });
});
