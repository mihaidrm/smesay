// Settings, Data (stories/E11-2, acceptances 1, 2 and 4): Export everything gives a zip with
// every project's file, the settings, the members and the logo; a member is refused (403) for
// both actions; Delete needs the typed name, takes the workspace out of every member's reads
// at once, keeps the deleted page's facts, and its respondent links read as revoked.
import { randomUUID } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { beforeAll, describe, expect, it } from "vitest";
import { members, projects, workspaces } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { links } from "@/db/queries/links";
import { invites } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";
import { memoryOutbox } from "@/lib/mail";
import { putObject } from "@/lib/storage";
import { requireWorkspace } from "@/lib/workspace";
import { deleteWorkspace, exportWorkspace } from "./workspace-data";
import { WORKSPACE_DATA_COPY } from "./workspace-data-copy";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
async function signIn(label: string) {
  const email = `${label}-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, email, headers };
}
// The entries of a zip, read from its central directory (as zip.test.ts).
function entries(file: Buffer): Map<string, Buffer> {
  const end = file.length - 22;
  let at = file.readUInt32LE(end + 16);
  const out = new Map<string, Buffer>();
  for (let i = 0; i < file.readUInt16LE(end + 10); i++) {
    const size = file.readUInt32LE(at + 20); const n = file.readUInt16LE(at + 28); const offset = file.readUInt32LE(at + 42);
    const start = offset + 30 + file.readUInt16LE(offset + 26) + file.readUInt16LE(offset + 28);
    out.set(file.subarray(at + 46, at + 46 + n).toString("utf8"), inflateRawSync(file.subarray(start, start + size)));
    at += 46 + n;
  }
  return out;
}

let owner: Awaited<ReturnType<typeof signIn>>;
let member: Awaited<ReturnType<typeof signIn>>;
let ws: WorkspaceId;

beforeAll(async () => {
  await prepareTestDatabase();
  owner = await signIn("data-owner");
  member = await signIn("data-member");
  const made = await createWorkspaceWithSample({ name: "Data Ltd", slug: `data-${randomUUID()}` }, owner.id);
  ws = await requireWorkspace(owner.headers, made.id);
  await members.add(ws, member.id, "member");
  await projects.create(ws, { name: "Expense tool", createdBy: owner.id });
  const logoKey = `logos/${ws}/0123456789abcdef.png`;
  await putObject(logoKey, new Uint8Array([137, 80, 78, 71]), "image/png");
  await workspaces.update(ws, { logoObjectKey: logoKey });
}, 60_000);

describe("exportWorkspace", () => {
  it("zips every project's file, the settings, the members and the logo", async () => {
    const out = await exportWorkspace({ ws, userId: owner.id }, new Date("2026-10-04T12:00:00Z"));
    const files = entries(out.zip);
    const projectFiles = [...files.keys()].filter((k) => k.startsWith("projects/"));
    expect(projectFiles).toHaveLength(2);
    expect(out.projects).toBe(2);
    for (const k of projectFiles) expect(JSON.parse(files.get(k)!.toString()).format).toBe("smesay.project");
    expect(JSON.parse(files.get("workspace.json")!.toString())).toMatchObject({ name: "Data Ltd", plan: "free", logo: "0123456789abcdef.png" });
    const csvText = files.get("members.csv")!.toString();
    expect(csvText).toContain(owner.email);
    expect(csvText).toContain(member.email);
    expect([...files.get("logo/0123456789abcdef.png")!]).toEqual([137, 80, 78, 71]);
    expect(out.name).toBe("Data-Ltd-everything-2026-10-04.zip");
  });
  it("is refused to a member", async () => {
    await expect(exportWorkspace({ ws, userId: member.id })).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("deleteWorkspace", () => {
  it("is refused to a member and needs the typed name", async () => {
    await expect(deleteWorkspace({ ws, userId: member.id }, "Data Ltd")).rejects.toBeInstanceOf(ForbiddenError);
    expect(await deleteWorkspace({ ws, userId: owner.id }, "Data")).toEqual({ error: WORKSPACE_DATA_COPY.wrongName });
    expect(await workspaces.getById(ws)).not.toBeNull();
  });
  it("takes the workspace out of every read at once and its links read as revoked", async () => {
    const token = (await invites.list(ws)).find((v) => v.kind === "public")!.token;
    const now = new Date("2026-10-04T13:00:00Z");
    expect(await deleteWorkspace({ ws, userId: owner.id }, " Data Ltd ", now)).toEqual({ deletedAt: now });
    expect(await workspaces.getForUser(member.id, ws)).toBeNull();
    expect(await workspaces.listForUser(owner.id)).toEqual([]);
    expect(await workspaces.deletedForUser(member.id, ws)).toMatchObject({ name: "Data Ltd", deletedAt: now, deletedByEmail: owner.email });
    expect(WORKSPACE_DATA_COPY.deleted(now, owner.email)).toBe(`This workspace was deleted on 4 Oct 2026, 13:00 UTC. Its data is removed within 24 hours. Contact ${owner.email} if you did not expect this.`);
    expect((await links.byToken(token))!.invite.revokedAt).toEqual(now);
    expect(await workspaces.deletedForUser(`someone-${randomUUID()}`, ws)).toBeNull();
  });
});
