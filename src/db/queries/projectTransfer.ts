// A whole project out and in (stories/E10-2): read() gathers every row of one project in the
// workspace (its item sets and items, instruments, invites, responses with their answers,
// missing items and actions), each read by workspace id and by the project's chain of keys;
// write() recreates such rows under another workspace in one transaction (db.transaction:
// orm.drizzle.team/docs/transactions), with new ids made here (randomUUID) and every
// reference mapped to them, so a failure anywhere leaves nothing. Every token is new. The
// public link comes in revoked, so nothing is published until the PM publishes again
// (acceptance 2); a personal invite keeps its state with a new token nobody has, and the PM
// sends a new link (E6-2) to each person once the project is published again. Reminders need
// the public link live (src/lib/reminders.ts), so nothing goes out before that.
import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { answer, insight, instrument, invite, item, itemSet, missingItem, project, response, user } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { isUuid } from "./scoped";

export type TransferRows = {
  project: typeof project.$inferSelect;
  itemSets: (typeof itemSet.$inferSelect)[];
  items: (typeof item.$inferSelect)[];
  instruments: (typeof instrument.$inferSelect)[];
  invites: (typeof invite.$inferSelect)[];
  responses: (typeof response.$inferSelect)[];
  answers: (typeof answer.$inferSelect)[];
  missingItems: (typeof missingItem.$inferSelect)[];
  insights: (typeof insight.$inferSelect & { closedByEmail: string | null })[];
};

export async function readProject(ws: WorkspaceId, projectId: string): Promise<TransferRows | null> {
  if (!isUuid(projectId)) return null;
  const [p] = await db.select().from(project).where(and(eq(project.workspaceId, ws), eq(project.id, projectId)));
  if (!p) return null;
  const itemSets = await db.select().from(itemSet).where(and(eq(itemSet.workspaceId, ws), eq(itemSet.projectId, p.id))).orderBy(itemSet.version);
  const setIds = itemSets.map((s) => s.id);
  const items = setIds.length === 0 ? [] : await db.select().from(item).where(and(eq(item.workspaceId, ws), inArray(item.itemSetId, setIds))).orderBy(item.itemSetId, item.position);
  const instruments = await db.select().from(instrument).where(and(eq(instrument.workspaceId, ws), eq(instrument.projectId, p.id))).orderBy(instrument.createdAt);
  const instrumentIds = instruments.map((i) => i.id);
  const invites = instrumentIds.length === 0 ? [] : await db.select().from(invite).where(and(eq(invite.workspaceId, ws), inArray(invite.instrumentId, instrumentIds))).orderBy(invite.createdAt);
  const responses = instrumentIds.length === 0 ? [] : await db.select().from(response).where(and(eq(response.workspaceId, ws), inArray(response.instrumentId, instrumentIds))).orderBy(response.createdAt);
  const responseIds = responses.map((r) => r.id);
  const answers = responseIds.length === 0 ? [] : await db.select().from(answer).where(and(eq(answer.workspaceId, ws), inArray(answer.responseId, responseIds)));
  const missingItems = responseIds.length === 0 ? [] : await db.select().from(missingItem).where(and(eq(missingItem.workspaceId, ws), inArray(missingItem.responseId, responseIds))).orderBy(missingItem.createdAt);
  const insights = (await db.select({ row: insight, closedByEmail: user.email }).from(insight).leftJoin(user, eq(user.id, insight.closedBy))
    .where(and(eq(insight.workspaceId, ws), eq(insight.projectId, p.id))).orderBy(insight.createdAt)).map((r) => ({ ...r.row, closedByEmail: r.closedByEmail }));
  return { project: p, itemSets, items, instruments, invites, responses, answers, missingItems, insights };
}

// What write() takes: the rows as a file holds them (ids are the file's own keys).
export type TransferInput = {
  project: { name: string; contextGoal: string | null; contextTerms: string | null };
  itemSets: { id: string; version: number; source: "xlsx" | "csv" | "pasted"; sourceFilename: string | null; importReport: (typeof itemSet.$inferInsert)["importReport"]; importedAt: Date; areas: (typeof itemSet.$inferInsert)["areas"]; shapeRuns: number; shapedAt: Date | null; contextUsed: (typeof itemSet.$inferInsert)["contextUsed"] }[];
  items: { id: string; itemSetId: string; position: number; sourceRef: string | null; originalText: string; readerText: string | null; readerStatus: (typeof item.$inferInsert)["readerStatus"]; area: string | null; areaRationale: string | null; proposedValue: string | null; custom: unknown; flags: (typeof item.$inferInsert)["flags"]; perspectives: string[] }[];
  instruments: (Omit<typeof instrument.$inferInsert, "workspaceId" | "projectId"> & { id: string; itemSetId: string })[];
  invites: { id: string; instrumentId: string; kind: "public" | "personal"; email: string | null; name: string | null; roleHint: string | null; opensAt: Date | null; closesAt: Date | null; revokedAt: Date | null; remindersSent: number; lastReminderAt: Date | null; sentAt: Date | null; createdAt: Date }[];
  responses: { id: string; instrumentId: string; itemSetId: string; inviteId: string; fields: Record<string, string>; perspectives: string[]; confidence: number | null; signedOff: boolean; submittedAt: Date | null; firstSubmittedAt: Date | null; closingAnswer: string | null; signOffText: string | null; createdAt: Date; updatedAt: Date }[];
  answers: { id: string; responseId: string; itemId: string; kind: (typeof answer.$inferInsert)["kind"]; value: string | null; reason: string | null; comment: string | null; updatedAt: Date }[];
  missingItems: { id: string; responseId: string; text: string; suggestedArea: string | null; suggestedValue: string | null; createdAt: Date }[];
  insights: { kind: (typeof insight.$inferInsert)["kind"]; title: string; why: string | null; citedAnswerIds: string[]; citedMissingItemIds: string[]; state: "open" | "done" | "dismissed"; closedAt: Date | null; model: string | null; tokensIn: number | null; tokensOut: number | null; costEurCents: number | null; createdAt: Date }[];
};

const token = () => randomBytes(16).toString("hex");

export async function writeProject(ws: WorkspaceId, input: TransferInput, userId: string, now = new Date()): Promise<string> {
  return db.transaction(async (tx) => {
    const projectId = randomUUID();
    const newId = new Map<string, string>();
    const map = (old: string) => { const id = newId.get(old); if (!id) throw new Error(`The file refers to ${old}, which it does not hold.`); return id; };
    const fresh = (old: string) => { const id = randomUUID(); newId.set(old, id); return id; };
    await tx.insert(project).values({ id: projectId, workspaceId: ws, name: input.project.name, contextGoal: input.project.contextGoal, contextTerms: input.project.contextTerms, createdBy: userId });
    for (const s of input.itemSets) {
      await tx.insert(itemSet).values({ id: fresh(s.id), workspaceId: ws, projectId, version: s.version, source: s.source, sourceFilename: s.sourceFilename, importReport: s.importReport, importedBy: userId, importedAt: s.importedAt, areas: s.areas, shapeRuns: s.shapeRuns, shapedAt: s.shapedAt, contextUsed: s.contextUsed });
    }
    const itemRows = input.items.map((it) => ({ id: fresh(it.id), workspaceId: ws, itemSetId: map(it.itemSetId), position: it.position, sourceRef: it.sourceRef, originalText: it.originalText, readerText: it.readerText, readerStatus: it.readerStatus, area: it.area, areaRationale: it.areaRationale, proposedValue: it.proposedValue, custom: it.custom, flags: it.flags, perspectives: it.perspectives }));
    for (let i = 0; i < itemRows.length; i += 500) await tx.insert(item).values(itemRows.slice(i, i + 500));
    for (const ins of input.instruments) {
      const { id, itemSetId, ...rest } = ins;
      await tx.insert(instrument).values({ ...rest, id: fresh(id), workspaceId: ws, projectId, itemSetId: map(itemSetId) });
    }
    for (const iv of input.invites) {
      await tx.insert(invite).values({ id: fresh(iv.id), workspaceId: ws, instrumentId: map(iv.instrumentId), kind: iv.kind, token: token(), email: iv.email, name: iv.name, roleHint: iv.roleHint, opensAt: iv.opensAt, closesAt: iv.closesAt, revokedAt: iv.kind === "public" ? (iv.revokedAt ?? now) : iv.revokedAt, remindersSent: iv.remindersSent, lastReminderAt: iv.lastReminderAt, sentAt: iv.sentAt, createdAt: iv.createdAt });
    }
    for (const r of input.responses) {
      await tx.insert(response).values({ id: fresh(r.id), workspaceId: ws, instrumentId: map(r.instrumentId), itemSetId: map(r.itemSetId), inviteId: map(r.inviteId), deviceToken: token(), fields: r.fields, perspectives: r.perspectives, confidence: r.confidence, signedOff: r.signedOff, submittedAt: r.submittedAt, firstSubmittedAt: r.firstSubmittedAt, closingAnswer: r.closingAnswer, signOffText: r.signOffText, createdAt: r.createdAt, updatedAt: r.updatedAt });
    }
    const setOfItem = new Map(input.items.map((it) => [it.id, it.itemSetId]));
    const answerRows = input.answers.map((a) => ({ id: fresh(a.id), workspaceId: ws, responseId: map(a.responseId), itemSetId: map(setOfItem.get(a.itemId) ?? a.itemId), itemId: map(a.itemId), kind: a.kind, value: a.value, reason: a.reason, comment: a.comment, updatedAt: a.updatedAt }));
    for (let i = 0; i < answerRows.length; i += 500) await tx.insert(answer).values(answerRows.slice(i, i + 500));
    for (const m of input.missingItems) {
      await tx.insert(missingItem).values({ id: fresh(m.id), workspaceId: ws, responseId: map(m.responseId), text: m.text, suggestedArea: m.suggestedArea, suggestedValue: m.suggestedValue, createdAt: m.createdAt });
    }
    for (const s of input.insights) {
      await tx.insert(insight).values({ workspaceId: ws, projectId, kind: s.kind, title: s.title, why: s.why, citedAnswerIds: s.citedAnswerIds.map(map), citedMissingItemIds: s.citedMissingItemIds.map(map), state: s.state, closedAt: s.state === "open" ? null : (s.closedAt ?? now), closedBy: null, model: s.model, tokensIn: s.tokensIn, tokensOut: s.tokensOut, costEurCents: s.costEurCents, createdAt: s.createdAt });
    }
    return projectId;
  });
}
