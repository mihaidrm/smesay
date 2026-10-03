// The instrument draft (stories/E5-1, acceptance 1, 2 and 4, and the line owed from E3-6)
// on the test database: Build creates one draft per project on the latest set, titled after
// the project with Name and Role; the intro and the fields save with the rule; a newer set
// gets "Build on version 2", which copies the draft and locks the old one; two opens at once
// make one draft; the sample refuses edits; another workspace reads nothing and its ids are 404.
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { instruments, invites, items, projects, workspaces } from "@/db/queries";
import { createWorkspaceWithSample } from "@/db/queries/onboarding";
import { prepareTestDatabase } from "@/db/test-db";
import type { WorkspaceId } from "@/db/types";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { commitUpload } from "@/lib/imports";
import { BUILD_COPY, buildOnLatest, isPublished, openDraft, saveFields, saveIntro, savePerspectives, saveScoring, tagItem } from "@/lib/instruments";
import { PERSPECTIVES_COPY } from "@/lib/perspectives";
import { SCORING_ERRORS } from "@/lib/scoring";
import { memoryOutbox } from "@/lib/mail";
import { DEFAULT_FIELDS, FIELDS_COPY } from "@/lib/respondent-fields";
import { savePaste } from "@/lib/uploads";
import { requireWorkspace } from "@/lib/workspace";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
let a: { ws: WorkspaceId; userId: string }; let b: { ws: WorkspaceId; userId: string };

async function signIn(email: string) {
  const before = memoryOutbox.length;
  await auth.handler(new Request(`${BASE}/api/auth/sign-in/magic-link`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email, callbackURL: "/app" }) }));
  const link = memoryOutbox[before].text.split("\n").find((l) => l.startsWith(BASE + "/api/auth/magic-link/verify"))!;
  const verified = await auth.handler(new Request(link, { redirect: "manual" }));
  const headers = new Headers({ cookie: verified.headers.getSetCookie().find((c) => c.includes("session_token="))!.split(";")[0] });
  return { id: (await auth.api.getSession({ headers }))!.user.id, headers };
}

async function importList(ws: WorkspaceId, userId: string, projectId: string, lines: string[]) {
  const pasted = await savePaste({ ws, userId }, projectId, lines.join("\n"));
  if (!("upload" in pasted)) throw new Error(pasted.error);
  const committed = await commitUpload(ws, pasted.upload.id, userId);
  if (!("set" in committed)) throw new Error(committed.error);
  return committed.set;
}

beforeAll(async () => {
  await prepareTestDatabase();
  const stamp = Date.now();
  const signedIn = await signIn(`instruments-${stamp}@example.com`);
  const wsA = await requireWorkspace(signedIn.headers, (await createWorkspaceWithSample({ name: "Instruments A", slug: `instruments-a-${stamp}` }, signedIn.id)).id);
  const wsB = await requireWorkspace(signedIn.headers, (await workspaces.create({ name: "Instruments B", slug: `instruments-b-${stamp}` }, signedIn.id)).id);
  a = { ws: wsA, userId: signedIn.id }; b = { ws: wsB, userId: signedIn.id };
}, 60_000);

describe("openDraft", () => {
  it("is null without a set, then one draft per project on the latest set", async () => {
    const project = await projects.create(a.ws, { name: "Expense tool", createdBy: a.userId });
    expect(await openDraft(a.ws, project)).toBeNull();
    const set = await importList(a.ws, a.userId, project.id, ["Receipts by phone | Submitting | Must", "Approval by email | Approving | Should"]);
    const first = await openDraft(a.ws, project);
    expect(first?.instrument.itemSetId).toBe(set.id);
    expect(first?.instrument.title).toBe("Expense tool");
    expect(first?.instrument.respondentFields).toEqual(DEFAULT_FIELDS);
    expect(first?.newer).toBeNull();
    const again = await openDraft(a.ws, project);
    expect(again?.instrument.id).toBe(first?.instrument.id);
    expect((await instruments.list(a.ws)).filter((i) => i.projectId === project.id).length).toBe(1);
    // Two opens at once (two tabs) end with one draft: createOnSet works under the project lock.
    const fresh = await projects.create(a.ws, { name: "Raced", createdBy: a.userId });
    await importList(a.ws, a.userId, fresh.id, ["One", "Two"]);
    const drafts = await Promise.all([openDraft(a.ws, fresh), openDraft(a.ws, fresh), openDraft(a.ws, fresh)]);
    expect(new Set(drafts.map((d) => d?.instrument.id)).size).toBe(1);
    expect((await instruments.list(a.ws)).filter((i) => i.projectId === fresh.id).length).toBe(1);
  });
  it("reads nothing of another workspace", async () => {
    const project = await projects.create(a.ws, { name: "Mine", createdBy: a.userId });
    await importList(a.ws, a.userId, project.id, ["One", "Two"]);
    await openDraft(a.ws, project);
    expect(await instruments.latestForProject(a.ws, project.id)).not.toBeNull();
    expect(await instruments.latestForProject(b.ws, project.id)).toBeNull();
    expect(await instruments.latestForProject(a.ws, "not-a-uuid")).toBeNull();
    expect(await openDraft(b.ws, project)).toBeNull();
    expect(await instruments.createOnSet(b.ws, { projectId: project.id, itemSetId: (await openDraft(a.ws, project))!.builtOn.id, title: "B" })).toBeNull();
    expect((await instruments.list(b.ws)).length).toBe(0);
  });
});

describe("saveIntro and saveFields", () => {
  it("saves with the rule and refuses outside it", async () => {
    const project = await projects.create(a.ws, { name: "Intro", createdBy: a.userId });
    await importList(a.ws, a.userId, project.id, ["One", "Two"]);
    const { instrument } = (await openDraft(a.ws, project))!;
    expect(await saveIntro(a.ws, project.id, instrument.id, "", "x")).toEqual({ error: BUILD_COPY.badTitle });
    expect(await saveIntro(a.ws, project.id, instrument.id, "T", "x".repeat(1001))).toEqual({ error: BUILD_COPY.longIntro });
    const saved = await saveIntro(a.ws, project.id, instrument.id, " Rate the list ", " Six things. ");
    expect("instrument" in saved && saved.instrument.intro).toBe("Six things.");
    expect("instrument" in saved && saved.instrument.title).toBe("Rate the list");
    expect(await saveFields(a.ws, project.id, instrument.id, "[]")).toEqual({ error: FIELDS_COPY.lastField });
    expect(await saveFields(a.ws, project.id, instrument.id, "not json")).toEqual({ error: FIELDS_COPY.badShape });
    const fields = await saveFields(a.ws, project.id, instrument.id, JSON.stringify([{ label: "Name", type: "text", mandatory: true }, { label: "Role", type: "dropdown", mandatory: true, options: "Sales\nFinance" }, { label: "Email", type: "email", mandatory: false }]));
    expect("instrument" in fields && fields.instrument.respondentFields).toEqual([
      { key: "name", label: "Name", type: "text", mandatory: true },
      { key: "role", label: "Role", type: "dropdown", mandatory: true, options: ["Sales", "Finance"] },
      { key: "email", label: "Email", type: "email", mandatory: false },
    ]);
  });
  it("refuses the sample and another workspace", async () => {
    const sample = (await projects.list(a.ws)).find((p) => p.isSample)!;
    const draft = (await openDraft(a.ws, sample))!;
    expect(await saveIntro(a.ws, sample.id, draft.instrument.id, "T", "x")).toEqual({ error: BUILD_COPY.sample });
    expect(await saveFields(a.ws, sample.id, draft.instrument.id, JSON.stringify(DEFAULT_FIELDS))).toEqual({ error: BUILD_COPY.sample });
    await expect(saveIntro(b.ws, sample.id, draft.instrument.id, "T", "x")).rejects.toBeInstanceOf(NotFoundError);
    await expect(saveFields(b.ws, sample.id, draft.instrument.id, "[]")).rejects.toBeInstanceOf(NotFoundError);
    await expect(buildOnLatest(b.ws, sample.id, draft.instrument.id)).rejects.toBeInstanceOf(NotFoundError);
    // An instrument of one project named with another project of the same workspace: 404.
    const other = await projects.create(a.ws, { name: "Other", createdBy: a.userId });
    await expect(saveIntro(a.ws, other.id, draft.instrument.id, "T", "x")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("buildOnLatest", () => {
  it("offers version 2 after a new import and copies the draft onto it", async () => {
    const project = await projects.create(a.ws, { name: "Versions", createdBy: a.userId });
    await importList(a.ws, a.userId, project.id, ["One", "Two"]);
    const v1 = (await openDraft(a.ws, project))!;
    await saveIntro(a.ws, project.id, v1.instrument.id, "Versions", "Kept across versions.");
    await saveScoring(a.ws, project.id, v1.instrument.id, "moscow", "1", JSON.stringify({ M: "Essential" }), "chapters");
    await savePerspectives(a.ws, project.id, v1.instrument.id, "Finance\nSales");
    expect(await buildOnLatest(a.ws, project.id, v1.instrument.id)).toEqual({ error: BUILD_COPY.alreadyLatest });
    const set2 = await importList(a.ws, a.userId, project.id, ["One", "Two", "Three"]);
    const stillV1 = (await openDraft(a.ws, project))!;
    expect(stillV1.instrument.id).toBe(v1.instrument.id);
    expect(stillV1.builtOn.version).toBe(1);
    expect(stillV1.newer?.id).toBe(set2.id);
    const built = await buildOnLatest(a.ws, project.id, v1.instrument.id);
    if (!("instrument" in built)) throw new Error(built.error);
    expect(built.instrument.itemSetId).toBe(set2.id);
    expect(built.instrument.intro).toBe("Kept across versions.");
    expect(built.instrument.scaleLabels).toEqual({ M: "Essential" });
    expect(built.instrument.perspectives).toEqual(["Finance", "Sales"]);
    const v2 = (await openDraft(a.ws, project))!;
    expect(v2.instrument.id).toBe(built.instrument.id);
    expect(v2.newer).toBeNull();
    expect((await instruments.get(a.ws, v1.instrument.id))?.itemSetId).not.toBe(set2.id);
    // The replaced draft can no longer be edited or built on (a stale tab).
    expect(await saveIntro(a.ws, project.id, v1.instrument.id, "Stale", "x")).toEqual({ error: BUILD_COPY.replaced });
    expect(await saveFields(a.ws, project.id, v1.instrument.id, JSON.stringify(DEFAULT_FIELDS))).toEqual({ error: BUILD_COPY.replaced });
    expect(await buildOnLatest(a.ws, project.id, v1.instrument.id)).toEqual({ error: BUILD_COPY.replaced });
    expect((await instruments.get(a.ws, v1.instrument.id))?.title).toBe("Versions");
    expect((await instruments.list(a.ws)).filter((i) => i.projectId === project.id).length).toBe(2);
  });
});

describe("saveScoring (stories/E5-2)", () => {
  it("saves the method, the switch and the labels with the rule, and locks once published", async () => {
    const project = await projects.create(a.ws, { name: "Scoring", createdBy: a.userId });
    await importList(a.ws, a.userId, project.id, ["One", "Two"]);
    const { instrument } = (await openDraft(a.ws, project))!;
    expect(instrument.method).toBe("moscow");
    expect(instrument.showProposed).toBe(true);
    expect(instrument.scaleLabels).toBeNull();
    expect(await saveScoring(a.ws, project.id, instrument.id, "stars", "1", "{}", "chapters")).toEqual({ error: SCORING_ERRORS.badMethod });
    expect(await saveScoring(a.ws, project.id, instrument.id, "fit", "1", JSON.stringify({ "1": "x".repeat(21) }), "chapters")).toEqual({ error: SCORING_ERRORS.badLabel });
    const saved = await saveScoring(a.ws, project.id, instrument.id, "kcd", "0", JSON.stringify({ D: " Remove ", K: "Keep", M: "ignored" }), "item");
    if (!("instrument" in saved)) throw new Error(saved.error);
    expect(saved.instrument.method).toBe("kcd");
    expect(saved.instrument.showProposed).toBe(false);
    expect(saved.instrument.scaleLabels).toEqual({ D: "Remove" });
    expect(saved.instrument.layout).toBe("item");
    expect(await saveScoring(a.ws, project.id, instrument.id, "kcd", "0", "{}", "grid")).toEqual({ error: SCORING_ERRORS.badLayout });
    expect(await saveScoring(a.ws, project.id, instrument.id, "moscow", "on", "not json", "chapters")).toEqual({ error: SCORING_ERRORS.badShape });
    expect(await saveScoring(a.ws, project.id, instrument.id, "moscow", "on", JSON.stringify({ M: "Should" }), "chapters")).toEqual({ error: SCORING_ERRORS.sameLabel });
    const sample = (await projects.list(a.ws)).find((p) => p.isSample)!;
    const sampleDraft = (await openDraft(a.ws, sample))!;
    expect(await saveScoring(a.ws, sample.id, sampleDraft.instrument.id, "fit", "1", "{}", "chapters")).toEqual({ error: BUILD_COPY.sample });
    const defaults = await saveScoring(a.ws, project.id, instrument.id, "moscow", "on", "{}", "page");
    if (!("instrument" in defaults)) throw new Error(defaults.error);
    expect(defaults.instrument.scaleLabels).toBeNull();
    expect(defaults.instrument.showProposed).toBe(true);
    // Two labels stored (jsonb returns its keys in its own order), then a link makes it
    // published (E6-1 creates the row): the method, the switch and the labels are locked.
    expect("instrument" in (await saveScoring(a.ws, project.id, instrument.id, "moscow", "on", JSON.stringify({ M: "Essential", C: "Nice" }), "chapters"))).toBe(true);
    expect(await isPublished(a.ws, instrument.id)).toBe(false);
    await invites.create(a.ws, { instrumentId: instrument.id, kind: "public", token: randomUUID().replace(/-/g, "") });
    expect(await isPublished(a.ws, instrument.id)).toBe(true);
    // Published: the layout still changes (E5-3); the method, the switch and the labels
    // posted with it are ignored, including the null the locked form posts for the method.
    await saveScoring(a.ws, project.id, instrument.id, "moscow", "1", JSON.stringify({ M: "Essential", C: "Nice" }), "page").catch(() => undefined);
    expect(await saveScoring(a.ws, project.id, instrument.id, "fit", "1", "{}", "page")).toMatchObject({ instrument: { method: "moscow", layout: "page" } });
    const relaid = await saveScoring(a.ws, project.id, instrument.id, null, null, null, "item");
    expect("instrument" in relaid && relaid.instrument.layout).toBe("item");
    expect("instrument" in relaid && relaid.instrument.method).toBe("moscow");
    expect("instrument" in relaid && relaid.instrument.showProposed).toBe(true);
    expect("instrument" in relaid && relaid.instrument.scaleLabels).toEqual({ M: "Essential", C: "Nice" });
    expect(await saveScoring(a.ws, project.id, instrument.id, null, null, null, "grid")).toEqual({ error: SCORING_ERRORS.badLayout });
    // Another workspace reads no invite and cannot save.
    expect(await isPublished(b.ws, instrument.id)).toBe(false);
    await expect(saveScoring(b.ws, project.id, instrument.id, "fit", "1", "{}", "chapters")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("perspectives (stories/E5-4)", () => {
  it("saves the names, tags items with them, drops tags of removed names, and refuses the rest", async () => {
    const project = await projects.create(a.ws, { name: "Perspectives", createdBy: a.userId });
    const set = await importList(a.ws, a.userId, project.id, ["Cash advances", "Mileage"]);
    const { instrument } = (await openDraft(a.ws, project))!;
    const [first, second] = await items.forSet(a.ws, set.id);
    expect(instrument.perspectives).toEqual([]);
    expect(await tagItem(a.ws, project.id, first.id, JSON.stringify(["Finance"]))).toEqual({ error: PERSPECTIVES_COPY.noneDefined });
    expect(await savePerspectives(a.ws, project.id, instrument.id, "Finance\nfinance")).toEqual({ error: PERSPECTIVES_COPY.sameName });
    const saved = await savePerspectives(a.ws, project.id, instrument.id, "Finance\n\nSales\n");
    expect("instrument" in saved && saved.instrument.perspectives).toEqual(["Finance", "Sales"]);
    expect(await tagItem(a.ws, project.id, first.id, JSON.stringify(["Legal"]))).toEqual({ error: PERSPECTIVES_COPY.unknownTag });
    expect(await tagItem(a.ws, project.id, first.id, "nope")).toEqual({ error: PERSPECTIVES_COPY.badShape });
    const tagged = await tagItem(a.ws, project.id, first.id, JSON.stringify(["Finance", "Sales"]));
    expect("item" in tagged && tagged.item.perspectives).toEqual(["Finance", "Sales"]);
    await tagItem(a.ws, project.id, second.id, JSON.stringify(["Sales"]));
    // A case-only rename keeps the tags, spelt the new way; removing Sales drops it from
    // both items and Finance stays on the first.
    await savePerspectives(a.ws, project.id, instrument.id, "FINANCE\nSales");
    expect((await items.get(a.ws, first.id))?.perspectives).toEqual(["FINANCE", "Sales"]);
    await savePerspectives(a.ws, project.id, instrument.id, "Finance");
    expect((await items.get(a.ws, first.id))?.perspectives).toEqual(["Finance"]);
    expect((await items.get(a.ws, second.id))?.perspectives).toEqual([]);
    // An item of another project of the same workspace, through this project's id, is 404;
    // the sample's items through a plain project id too.
    const other = await projects.create(a.ws, { name: "Other", createdBy: a.userId });
    const otherSet = await importList(a.ws, a.userId, other.id, ["Elsewhere", "Elsewhere too"]);
    const [elsewhere] = await items.forSet(a.ws, otherSet.id);
    await expect(tagItem(a.ws, project.id, elsewhere.id, JSON.stringify(["Finance"]))).rejects.toBeInstanceOf(NotFoundError);
    const sample = (await projects.list(a.ws)).find((p) => p.isSample)!;
    const sampleDraft = (await openDraft(a.ws, sample))!;
    const [sampleItem] = await items.forSet(a.ws, sampleDraft.builtOn.id);
    await expect(tagItem(a.ws, project.id, sampleItem.id, JSON.stringify(["Finance"]))).rejects.toBeInstanceOf(NotFoundError);
    expect(await savePerspectives(a.ws, sample.id, sampleDraft.instrument.id, "Finance")).toEqual({ error: BUILD_COPY.sample });
    // The sample and another workspace.
    await expect(savePerspectives(b.ws, project.id, instrument.id, "Finance")).rejects.toBeInstanceOf(NotFoundError);
    await expect(tagItem(b.ws, project.id, first.id, JSON.stringify(["Finance"]))).rejects.toBeInstanceOf(NotFoundError);
    expect((await items.get(a.ws, first.id))?.perspectives).toEqual(["Finance"]);
    // An item of the latest set while the instrument is still on version 1: the message
    // naming both versions, not a 404; the old set's items still tag.
    const set2 = await importList(a.ws, a.userId, project.id, ["Cash advances", "Mileage", "Per diem"]);
    const [onV2] = await items.forSet(a.ws, set2.id);
    expect(await tagItem(a.ws, project.id, onV2.id, JSON.stringify(["Finance"]))).toEqual({ error: PERSPECTIVES_COPY.otherSet(1, 2) });
    expect("item" in (await tagItem(a.ws, project.id, second.id, JSON.stringify(["Finance"])))).toBe(true);
    // Published: the names and the tags lock.
    await invites.create(a.ws, { instrumentId: instrument.id, kind: "public", token: randomUUID().replace(/-/g, "") });
    expect(await savePerspectives(a.ws, project.id, instrument.id, "Finance\nLegal")).toEqual({ error: PERSPECTIVES_COPY.locked });
    expect(await tagItem(a.ws, project.id, second.id, JSON.stringify([]))).toEqual({ error: PERSPECTIVES_COPY.locked });
    expect((await items.get(a.ws, second.id))?.perspectives).toEqual(["Finance"]);
  });
});

