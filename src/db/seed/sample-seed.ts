// Inserts the Marlow Group sample (stories/E1-4) through the E1-3 helpers, so the seed is also
// the first caller of every insert. Runs once: a second run finds the workspace and changes
// nothing. A failure half way removes the workspace again (the cascades take the rest), so the
// next run starts clean.
import { randomBytes } from "node:crypto";
import { aiRuns, answers, insights, instruments, invites, itemSets, items, missingItems, projects, responses } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import * as sample from "./sample";

// Every token is fresh per seed run (CLAUDE.md: crypto.randomBytes(16) or stronger), so two
// workspaces seeded with the sample never share one and nothing in the repository opens a link.
const token = () => randomBytes(16).toString("hex");

export type SeedResult = { status: "created" | "exists"; workspaceId: string };

const VALUE_FOR_DISAGREE = "W";

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
    const project = await projects.create(ws, sample.project);
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
          lastReminderAt: p.reminders ? new Date("2026-10-10T08:00:00Z") : null,
        });
        inviteId = personal.id;
      }
      if (p.status === "invited") continue;
      const response = await responses.create(ws, {
        instrumentId: instrument.id, itemSetId: set.id, inviteId, deviceToken: token(),
        fields: { name: p.name, role: p.role }, confidence: p.confidence, signedOff: p.status === "submitted",
        submittedAt: p.submittedAt ? new Date(p.submittedAt) : null,
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
    await missingItems.create(ws, { responseId: responseIds.get(sample.missingItem.person)!, text: sample.missingItem.text, suggestedArea: sample.missingItem.suggestedArea });
    for (const ins of sample.insights) {
      const cited = ins.cites.map(([i, p]) => answerIds.get(`${i}:${p}`)!);
      await insights.create(ws, { projectId: project.id, title: ins.title, why: ins.why, citedAnswerIds: cited, state: "open", model: "sample" });
    }
    for (const run of sample.aiRuns) await aiRuns.create(ws, { projectId: project.id, ...run });
    return { status: "created", workspaceId: ws };
  } catch (error) {
    await internal.hardDeleteWorkspace(ws);
    throw error;
  }
}
