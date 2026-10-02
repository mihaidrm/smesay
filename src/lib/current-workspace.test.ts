// Acceptance 4 of stories/E2-3 (the current workspace is on the session and a workspace the
// person is not a member of is 404), through better-auth's handler on the test database: the
// field is written only by setCurrentWorkspace(), read back by getSession, refused by the
// public update-session endpoint (input: false, node_modules/better-auth/dist/db/schema.mjs,
// parseInputData), and another workspace's id is refused by requireWorkspace() with the
// session's own cookie. The choice logic itself is src/lib/workspace-choice.test.ts.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { workspaces } from "@/db/queries";
import { prepareTestDatabase } from "@/db/test-db";
import { auth } from "@/lib/auth";
import { setCurrentWorkspace } from "@/lib/current-workspace";
import { NotFoundError } from "@/lib/errors";
import { memoryOutbox } from "@/lib/mail";
import { requireWorkspace } from "@/lib/workspace";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const stamp = Date.now();
let cookie: string;
let headers: Headers;
let mine: { id: string };
let theirs: { id: string };

async function signIn(email: string): Promise<string> {
  const before = memoryOutbox.length;
  const res = await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, {
    method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }),
  }));
  expect(res.status).toBe(200);
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  return verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0];
}

beforeAll(async () => {
  await prepareTestDatabase();
  cookie = await signIn(`current-a-${stamp}@example.com`);
  headers = new Headers({ cookie });
  const me = (await auth.api.getSession({ headers }))!;
  const other = (await auth.api.getSession({ headers: new Headers({ cookie: await signIn(`current-b-${stamp}@example.com`) }) }))!;
  mine = await workspaces.create({ name: "Mine", slug: `mine-${stamp}` }, me.user.id);
  theirs = await workspaces.create({ name: "Theirs", slug: `theirs-${stamp}` }, other.user.id);
}, 60_000);

afterAll(async () => {
  // Rows stay in the throwaway test database; schema.test.ts recreates it on the next run.
});

describe("the current workspace on the session", () => {
  it("starts empty, is set by setCurrentWorkspace() and read back by getSession", async () => {
    const before = (await auth.api.getSession({ headers }))!;
    expect(before.session.currentWorkspaceId ?? null).toBeNull();
    const ws = await requireWorkspace(headers, mine.id);
    await setCurrentWorkspace(before, ws);
    const after = (await auth.api.getSession({ headers }))!;
    expect(after.session.currentWorkspaceId).toBe(mine.id);
  });

  it("cannot be set through better-auth's public update-session endpoint", async () => {
    const res = await auth.handler(new Request(`${BASE}/api/auth/update-session`, {
      method: "POST", headers: { "content-type": "application/json", origin: BASE, cookie },
      body: JSON.stringify({ currentWorkspaceId: theirs.id }),
    }));
    expect(res.status).toBeGreaterThanOrEqual(400);
    const after = (await auth.api.getSession({ headers }))!;
    expect(after.session.currentWorkspaceId).toBe(mine.id);
  });

  it("refuses another workspace's id with 404, so a switch to it never happens", async () => {
    await expect(requireWorkspace(headers, theirs.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(requireWorkspace(headers, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
    const after = (await auth.api.getSession({ headers }))!;
    expect(after.session.currentWorkspaceId).toBe(mine.id);
  });
});
