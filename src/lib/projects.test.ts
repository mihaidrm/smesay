// Project actions and the list summaries (stories/E3-1, acceptance 1, 3 and 4; stories/E8-8,
// acceptance 3) on the test database: a workspace with its sample copy shows "6 items, 5 of 7,
// Sample"; a new project is Draft with 0 items; the context is saved and refused above 2,000;
// archiving hides and "Show archived" lists; deleting the sample removes its rows and nothing
// else; a project of another workspace is 404.
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { instruments, invites, itemSets, items, projects, responses, workspaces } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import { auth } from "@/lib/auth";
import { memoryOutbox } from "@/lib/mail";
import { contextError } from "@/lib/project-context";
import { projectStatus } from "@/lib/project-status";
import { createProject, deleteSample, PROJECTS_COPY, saveContext, setArchived } from "@/lib/projects";
import { requireWorkspace } from "@/lib/workspace";
import type { WorkspaceId } from "@/db/types";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let ws: WorkspaceId, other: WorkspaceId, userId: string;

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
  const me = await signIn(`projects-${stamp}@example.com`);
  userId = me.id;
  ws = await requireWorkspace(me.headers, (await createWorkspaceWithSample({ name: "Projects", slug: `projects-${stamp}` }, me.id)).id);
  other = await requireWorkspace(me.headers, (await workspaces.create({ name: "Other", slug: `other-${stamp}` }, me.id)).id);
}, 60_000);

describe("the project list", () => {
  it("summarises the sample copy and a new draft", async () => {
    const created = await createProject({ ws, userId }, "New expense tool");
    expect("project" in created).toBe(true);
    const rows = await projects.summaries(ws);
    const sample = rows.find((r) => r.isSample)!;
    expect({ items: sample.items, submitted: sample.submitted, invites: sample.invites, status: projectStatus(sample, sample.links) }).toEqual({ items: 6, submitted: 5, invites: 7, status: "Sample" });
    const draft = rows.find((r) => !r.isSample)!;
    expect({ items: draft.items, submitted: draft.submitted, invites: draft.invites, status: projectStatus(draft, draft.links), createdBy: draft.createdBy }).toEqual({ items: 0, submitted: 0, invites: 0, status: "Draft", createdBy: userId });
    expect(rows[0].isSample).toBe(true);
  });

  it("counts the latest set's items and reads Open from an open link", async () => {
    const { project } = (await createProject({ ws, userId }, "Versions")) as { project: { id: string } };
    const v1 = await itemSets.create(ws, { projectId: project.id, version: 1, source: "csv" });
    const v2 = await itemSets.create(ws, { projectId: project.id, version: 2, source: "csv" });
    for (let i = 1; i <= 3; i++) await items.create(ws, { itemSetId: v1.id, position: i, originalText: `old ${i}` });
    await items.create(ws, { itemSetId: v2.id, position: 1, originalText: "new 1" });
    const instrument = await instruments.create(ws, { projectId: project.id, itemSetId: v2.id, title: "I" });
    const link = await invites.create(ws, { instrumentId: instrument.id, kind: "public", token: randomUUID().replace(/-/g, "") });
    await responses.create(ws, { instrumentId: instrument.id, itemSetId: v2.id, inviteId: link.id, deviceToken: randomUUID().replace(/-/g, ""), fields: {}, signedOff: true, submittedAt: new Date() });
    const row = (await projects.summaries(ws)).find((r) => r.id === project.id)!;
    expect({ items: row.items, submitted: row.submitted, invites: row.invites, status: projectStatus(row, row.links) }).toEqual({ items: 1, submitted: 1, invites: 1, status: "Open" });
    expect((await projects.summaries(other)).map((r) => r.id)).not.toContain(project.id);
  });

  it("refuses an empty name", async () => {
    expect(await createProject({ ws, userId }, "  ")).toEqual({ error: PROJECTS_COPY.badName });
  });
});

describe("the context", () => {
  it("saves both parts, trimmed, and refuses above 2,000 characters together", async () => {
    const { project } = (await createProject({ ws, userId }, "Context")) as { project: { id: string } };
    const saved = await saveContext(ws, project.id, " We replace the expense tool. ", "cost centre, policy limit");
    expect("project" in saved && saved.project.contextGoal).toBe("We replace the expense tool.");
    expect("project" in saved && saved.project.contextTerms).toBe("cost centre, policy limit");
    const long = await saveContext(ws, project.id, "a".repeat(1990), "b".repeat(11));
    expect(long).toEqual({ error: contextError("a".repeat(1990), "b".repeat(11)) });
    expect((await projects.get(ws, project.id))?.contextGoal).toBe("We replace the expense tool.");
    await expect(saveContext(other, project.id, "x", "")).rejects.toMatchObject({ status: 404 });
  });
});

describe("archive and the sample", () => {
  it("hides an archived project until Show archived, and brings it back", async () => {
    const { project } = (await createProject({ ws, userId }, "Old")) as { project: { id: string } };
    await setArchived(ws, project.id, true);
    expect((await projects.summaries(ws)).map((r) => r.id)).not.toContain(project.id);
    expect((await projects.summaries(ws, { archived: true })).map((r) => r.id)).toEqual([project.id]);
    await setArchived(ws, project.id, false);
    expect((await projects.summaries(ws)).map((r) => r.id)).toContain(project.id);
    await expect(setArchived(other, project.id, true)).rejects.toMatchObject({ status: 404 });
  });

  it("deletes the sample with its responses and nothing else; a normal project is refused", async () => {
    const sample = (await projects.summaries(ws)).find((r) => r.isSample)!;
    const draft = (await projects.summaries(ws)).find((r) => !r.isSample)!;
    const before = await responses.count(ws);
    expect(await deleteSample(ws, draft.id)).toBe(false);
    expect(await deleteSample(other, sample.id)).toBe(false);
    expect(await deleteSample(ws, sample.id)).toBe(true);
    expect((await projects.summaries(ws)).some((r) => r.isSample)).toBe(false);
    expect(await responses.count(ws)).toBe(before - 6);
    expect(await projects.get(ws, draft.id)).not.toBeNull();
  });
});
