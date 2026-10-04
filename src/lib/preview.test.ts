// The builder's preview read path (stories/E5-6) on the test database: the session check
// (previewAccess: the claim's PM in the claim's workspace, else the expired page or the
// other-workspace page), the tenancy boundary (a project of workspace A read for workspace B
// is unknown, as is the sample project, decision 0021 item 1), the list each step shows
// (Import the latest list, Build the draft's), Share on the instrument holding the link in
// force while a newer draft exists, and Share's withdrawn page once the link is revoked.
// previewSrc stays the same while the view does and changes with a save.
import { beforeAll, describe, expect, it } from "vitest";
import { projects } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { commitUpload } from "@/lib/imports";
import { buildOnLatest, openDraft, saveIntro } from "@/lib/instruments";
import { memoryOutbox } from "@/lib/mail";
import { loadPreview, previewSrc } from "@/lib/preview";
import { previewAccess, type PreviewClaim } from "@/lib/preview-token";
import { publishLink, revokeLink } from "@/lib/sharing";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let a: WorkspaceId; let b: WorkspaceId; let userId: string;

async function signIn(email: string) {
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, headers };
}

beforeAll(async () => {
  await prepareTestDatabase();
  const stamp = Date.now();
  const signedIn = await signIn(`preview-${stamp}@example.com`);
  userId = signedIn.id;
  a = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Preview A", slug: `preview-a-${stamp}` }, userId)).id);
  b = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Preview B", slug: `preview-b-${stamp}` }, userId)).id);
}, 60_000);

async function paste(projectId: string, lines: string[]) {
  const pasted = await savePaste({ ws: a, userId }, projectId, lines.join("\n"));
  if (!("upload" in pasted)) throw new Error(pasted.error);
  await commitUpload(a, pasted.upload.id, userId);
}

describe("previewAccess", () => {
  const claim: PreviewClaim = { project: "p", ws: "ws-a", user: "u-1", exp: 0 };
  it("lets the claim's PM in the claim's workspace in, and tells the same PM elsewhere to switch", () => {
    expect(previewAccess(claim, { user: "u-1", ws: "ws-a" })).toBe("ok");
    expect(previewAccess(claim, { user: "u-1", ws: "ws-b" })).toBe("otherWorkspace");
    expect(previewAccess(claim, { user: "u-1", ws: null })).toBe("otherWorkspace");
  });
  it("shows the expired page to anyone else, to no session and to no claim", () => {
    expect(previewAccess(claim, { user: "u-2", ws: "ws-a" })).toBe("expired");
    expect(previewAccess(claim, null)).toBe("expired");
    expect(previewAccess(null, { user: "u-1", ws: "ws-a" })).toBe("expired");
  });
});

describe("loadPreview", () => {
  it("reads only the workspace's own projects and never the sample", async () => {
    const project = await projects.create(a, { name: "Expense tool", createdBy: userId });
    await paste(project.id, ["Receipts by phone | Submitting | Must", "Approval by email | Approving | Should"]);
    expect((await loadPreview(a, project.id, "import")).kind).toBe("ready");
    expect(await loadPreview(b, project.id, "import")).toEqual({ kind: "none" });
    expect(await loadPreview(b, project.id, "build")).toEqual({ kind: "none" });
    expect(await loadPreview(a, "not-a-uuid", "build")).toEqual({ kind: "none" });
    const sample = (await projects.list(a)).find((p) => p.isSample)!;
    expect(await loadPreview(a, sample.id, "build")).toEqual({ kind: "none" });
  });

  it("says when there is no list yet", async () => {
    const project = await projects.create(a, { name: "Empty", createdBy: userId });
    expect(await loadPreview(a, project.id, "import")).toEqual({ kind: "noList", projectName: "Empty" });
  });

  it("shows the latest list on Import, the draft's on Build, the live link's on Share, then the withdrawn page", async () => {
    const project = await projects.create(a, { name: "Travel tool", createdBy: userId });
    await paste(project.id, ["One | Booking | Must", "Two | Booking | Should"]);
    const v1 = (await openDraft(a, project))!.instrument;
    const published = await publishLink(a, project.id, v1.id, "", "2027-01-20T15:00:00Z", "", new Date("2026-10-03T12:00:00Z"));
    if (!("invite" in published)) throw new Error(published.error);
    await paste(project.id, ["One | Booking | Must", "Two | Booking | Should", "Three | Paying | Could"]);
    const count = async (step: "import" | "build" | "share") => { const v = await loadPreview(a, project.id, step); return v.kind === "ready" ? v.items.length : v.kind; };
    expect(await count("import")).toBe(3);
    expect(await count("build")).toBe(2);
    const v2 = await buildOnLatest(a, project.id, v1.id);
    if (!("instrument" in v2)) throw new Error(v2.error);
    expect(await count("build")).toBe(3);
    // Share keeps the instrument the link serves, with its closing date.
    const share = await loadPreview(a, project.id, "share");
    expect(share.kind === "ready" && [share.items.length, share.spec.itemSetId, share.closesAt?.toISOString()]).toEqual([2, v1.itemSetId, "2027-01-20T15:00:00.000Z"]);
    const revoked = await revokeLink(a, project.id, v1.id, published.invite.id, new Date());
    expect("invite" in revoked).toBe(true);
    expect(await loadPreview(a, project.id, "share")).toEqual({ kind: "revoked" });
  });

  it("keeps the source while the view stays, and changes it with a save", async () => {
    const project = await projects.create(a, { name: "Fleet tool", createdBy: userId });
    await paste(project.id, ["One | Driving | Must", "Two | Driving | Should"]);
    const { instrument } = (await openDraft(a, project))!;
    const claim = { project: project.id, ws: a, user: userId };
    const now = Date.parse("2026-10-04T10:05:00Z");
    const first = await previewSrc(claim, "build", now);
    expect(await previewSrc(claim, "build", now + 60_000)).toBe(first);
    expect(first).toMatch(/^\/r\/p\.[^?]+\?step=build&ring=rating,nav,fields,closing&v=[\w-]{12}$/);
    const saved = await saveIntro(a, project.id, instrument.id, "Fleet tool survey", "");
    expect("instrument" in saved).toBe(true);
    expect(await previewSrc(claim, "build", now)).not.toBe(first);
  });
});
