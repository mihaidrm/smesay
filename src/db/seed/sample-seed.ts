// Inserts the Marlow Group sample (stories/E1-4) through the E1-3 helpers, so the seed is also
// the first caller of every insert. seedSampleInto(ws, projectName) puts one copy of the sample
// into any workspace: `npm run db:seed` calls it for the fixture workspace with the fixed id
// (seedSample, runs once; a second run finds the workspace and changes nothing), and every new
// workspace gets its own copy named "Sample project" at creation (stories/E2-3, acceptance 2;
// src/db/queries/onboarding.ts). A failure half way removes the fixture workspace again (the
// cascades take the rest), so the next run starts clean.
import { randomBytes } from "node:crypto";
import { aiRuns, answers, insights, instruments, invites, itemSets, items, missingItems, responses } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { createSampleProject } from "@/db/queries/projects";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import type { WorkspaceId } from "@/db/types";
import * as sample from "./sample";

// Every token is fresh per seed run (CLAUDE.md: crypto.randomBytes(16) or stronger), so two
// workspaces seeded with the sample never share one and nothing in the repository opens a link.
const token = () => randomBytes(16).toString("hex");

export type SeedResult = { status: "created" | "exists"; workspaceId: string };

const VALUE_FOR_DISAGREE = "W";
export const FIXTURE_PROJECT_NAME = sample.project.name;
export const SAMPLE_PROJECT_NAME = "Sample project";

export async function seedSample(): Promise<SeedResult> {
  const existing = await internal.getWorkspaceById(sample.SAMPLE_WORKSPACE_ID);
  if (existing) {
    // A seed killed half way (not a thrown error) leaves a partial workspace: finish by starting over.
    if ((await items.count(unsafeWorkspaceId(existing.id))) === sample.expected.items) return { status: "exists", workspaceId: existing.id };
    await internal.hardDeleteWorkspace(existing.id);
  }
  const created = await internal.createEmptyWorkspace(sample.workspace);
  const ws = unsafeWorkspaceId(created.id);
  try {
    await seedSampleInto(ws, FIXTURE_PROJECT_NAME);
    return { status: "created", workspaceId: ws };
  } catch (error) {
    await internal.hardDeleteWorkspace(ws);
    throw error;
  }
}

// One copy of the sample under the given workspace. Throws half way on a failure; the caller
// decides what to remove.
export async function seedSampleInto(ws: WorkspaceId, projectName: string): Promise<void> {
  const project = await createSampleProject(ws, { ...sample.project, name: projectName });
  const set = await itemSets.create(ws, { projectId: project.id, version: 1, source: "xlsx", sourceFilename: sample.sourceFilename, importReport: sample.importReport });
  const itemIds = new Map<number, string>();
  for (const it of sample.items) {
    const area = sample.areas.find((a) => a.name === it.area);
    const row = await items.create(ws, {
      itemSetId: set.id, position: it.n, sourceRef: it.ref, originalText: it.original, readerText: it.reader, readerStatus: "accepted",
      area: it.area, areaRationale: area?.rationale ?? null, proposedValue: it.proposed, custom: { Details: it.details },
    });
    itemIds.set(it.n, row.id);
  }
  const instrument = await instruments.create(ws, { projectId: project.id, itemSetId: set.id, ...sample.instrument });
  const publicInvite = await invites.create(ws, { instrumentId: instrument.id, kind: "public", token: token(), opensAt: sample.instrument.opensAt, closesAt: sample.instrument.closesAt });
  const responseIds = new Map<number, string>();
  for (const p of sample.people) {
    let inviteId = publicInvite.id;
    if (p.invite === "personal") {
      const email = p.name.toLowerCase().replace(/ /g, ".") + "@marlow.example";
      const personal = await invites.create(ws, {
        instrumentId: instrument.id, kind: "personal", token: token(), email, name: p.name, roleHint: p.role,
        opensAt: sample.instrument.opensAt, closesAt: sample.instrument.closesAt, remindersSent: p.reminders,
        lastReminderAt: p.reminders ? new Date("2026-10-10T08:00:00Z") : null, sentAt: sample.instrument.opensAt,
      });
      inviteId = personal.id;
    }
    if (p.status === "invited") continue;
    const response = await responses.create(ws, {
      instrumentId: instrument.id, itemSetId: set.id, inviteId, deviceToken: token(),
      fields: { name: p.name, role: p.role }, confidence: p.confidence, signedOff: p.status === "submitted",
      submittedAt: p.submittedAt ? new Date(p.submittedAt) : null,
      // E7-5: the sample was submitted once, so the first Submit is the latest.
      firstSubmittedAt: p.submittedAt ? new Date(p.submittedAt) : null,
    });
    responseIds.set(p.n, response.id);
  }
  const answerIds = new Map<string, string>();
  for (const it of sample.items) {
    for (const [personKey, a] of Object.entries(sample.answers[it.n] ?? {})) {
      const personN = Number(personKey);
      const responseId = responseIds.get(personN);
      if (!responseId) continue;
      const value = a.kind === "agree" ? it.proposed : a.kind === "change" ? a.value : a.kind === "disagree" ? VALUE_FOR_DISAGREE : null;
      const row = await answers.create(ws, { responseId, itemSetId: set.id, itemId: itemIds.get(it.n)!, kind: a.kind, value, reason: a.kind === "agree" ? null : a.reason });
      answerIds.set(`${it.n}:${personN}`, row.id);
    }
  }
  const missing = await missingItems.create(ws, { responseId: responseIds.get(sample.missingItem.person)!, text: sample.missingItem.text, suggestedArea: sample.missingItem.suggestedArea });
  for (const ins of sample.insights) {
    const cited = ins.cites.map(([i, p]) => answerIds.get(`${i}:${p}`)!);
    await insights.create(ws, { projectId: project.id, kind: ins.kind, title: ins.title, why: ins.why, citedAnswerIds: cited, citedMissingItemIds: ins.missing ? [missing.id] : [], state: "open", model: "sample", createdAt: new Date(Date.UTC(2026, 9, 9, 10, 0, ins.n)) });
  }
  for (const run of sample.aiRuns) await aiRuns.create(ws, { projectId: project.id, ...run });
}
