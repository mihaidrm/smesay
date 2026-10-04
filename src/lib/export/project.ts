// The whole project as one JSON file and back (stories/E10-2; ProjectExport in INTERFACES.md).
// exportProject reads every row of a project (src/db/queries/projectTransfer.ts readProject)
// and writes the file: a format name and version at the top, the project and its context,
// every version of the list with its items and its import report (the import log), the
// instruments, the invites without their tokens or passcodes, the responses with their
// answers and sign-offs, the missing items and the actions with their state. importProject
// checks a file (its format, its version, then every field with zod: zod.dev/api) and
// recreates it under the current workspace with new ids and tokens and the public link revoked
// (writeProject). A newer version is refused with its number; version 1 is the only one so
// far, so there is nothing older to migrate. The sample's file is refused: its invented data
// would show without the watermark (CLAUDE.md, dashboard).
import { z } from "zod";
import { projectTransfer } from "@/db/queries";
import type { TransferInput, TransferRows } from "@/db/queries/projectTransfer";
import { NotFoundError } from "@/lib/errors";
import { requireRole, type Actor } from "@/lib/members";
import { withinPlan } from "@/lib/plans";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { workspaceNameSchema } from "@/lib/workspace-name";
import { EXPORT_COPY } from "./copy";

export const PROJECT_FORMAT = "smesay.project";
export const PROJECT_VERSION = 1;
// The largest file the import reads: the server action's body limit (next.config.ts, 6 MB).
export const PROJECT_FILE_MAX = 6 * 1024 * 1024;

// The enums as the schema has them (src/db/schema.ts); projectTransfer.test.ts checks they agree.
export const FILE_ENUMS = {
  source: ["xlsx", "csv", "pasted"],
  readerStatus: ["suggested", "accepted", "rejected"],
  method: ["moscow", "fit", "kcd"],
  layout: ["chapters", "item", "page"],
  inviteKind: ["public", "personal"],
  answerKind: ["agree", "change", "disagree", "unclear", "pick"],
  insightKind: ["rewrite", "conflict", "followUp", "coverage"],
  insightState: ["open", "done", "dismissed"],
} as const;

const date = z.iso.datetime({ offset: true });
const text = (max: number) => z.string().max(max);
const id = z.string().min(1).max(64);
const json = z.unknown();

const ProjectFile = z.strictObject({
  format: z.literal(PROJECT_FORMAT),
  version: z.literal(PROJECT_VERSION),
  exportedAt: date,
  sample: z.boolean(),
  note: text(200).nullable(),
  project: z.strictObject({ name: text(80), contextGoal: text(2000).nullable(), contextTerms: text(2000).nullable(), createdAt: date }),
  itemSets: z.array(z.strictObject({
    id, version: z.number().int().min(1), source: z.enum(FILE_ENUMS.source), sourceFilename: text(300).nullable(), importReport: json, importedAt: date,
    areas: json, shapeRuns: z.number().int().min(0), shapedAt: date.nullable(), contextUsed: json,
    items: z.array(z.strictObject({
      id, position: z.number().int().min(1), sourceRef: text(200).nullable(), originalText: text(5000), readerText: text(5000).nullable(), readerStatus: z.enum(FILE_ENUMS.readerStatus).nullable(),
      area: text(200).nullable(), areaRationale: text(1000).nullable(), proposedValue: text(200).nullable(), custom: json, flags: json, perspectives: z.array(text(100)),
    })).max(2000),
  })).max(100),
  instruments: z.array(z.strictObject({
    id, itemSetId: id, title: text(200), intro: text(5000).nullable(), method: z.enum(FILE_ENUMS.method), showProposed: z.boolean(), layout: z.enum(FILE_ENUMS.layout),
    respondentFields: json, scaleLabels: json, perspectives: z.array(text(100)), closing: json, publishedAt: date.nullable(), createdAt: date,
  })).max(100),
  invites: z.array(z.strictObject({
    id, instrumentId: id, kind: z.enum(FILE_ENUMS.inviteKind), email: text(320).nullable(), name: text(200).nullable(), roleHint: text(200).nullable(),
    opensAt: date.nullable(), closesAt: date.nullable(), hadPasscode: z.boolean(), revokedAt: date.nullable(), remindersSent: z.number().int().min(0), lastReminderAt: date.nullable(), sentAt: date.nullable(), createdAt: date,
  })),
  responses: z.array(z.strictObject({
    id, instrumentId: id, itemSetId: id, inviteId: id, fields: z.record(z.string(), text(500)), perspectives: z.array(text(100)), confidence: z.number().int().min(1).max(5).nullable(),
    signedOff: z.boolean(), submittedAt: date.nullable(), firstSubmittedAt: date.nullable(), closingAnswer: text(5000).nullable(), signOffText: text(1000).nullable(), createdAt: date, updatedAt: date,
    answers: z.array(z.strictObject({ id, itemId: id, kind: z.enum(FILE_ENUMS.answerKind), value: text(50).nullable(), reason: text(5000).nullable(), comment: text(5000).nullable(), updatedAt: date })),
  })),
  missingItems: z.array(z.strictObject({ id, responseId: id, text: text(5000), suggestedArea: text(200).nullable(), suggestedValue: text(50).nullable(), createdAt: date })),
  insights: z.array(z.strictObject({
    kind: z.enum(FILE_ENUMS.insightKind).nullable(), title: text(500), why: text(2000).nullable(), citedAnswerIds: z.array(id), citedMissingItemIds: z.array(id),
    state: z.enum(FILE_ENUMS.insightState), closedAt: date.nullable(), closedBy: text(320).nullable(), model: text(100).nullable(), tokensIn: z.number().int().nullable(), tokensOut: z.number().int().nullable(), costEurCents: z.number().int().nullable(), createdAt: date,
  })),
});
export type ProjectExport = z.infer<typeof ProjectFile>;

const iso = (d: Date | null) => (d === null ? null : d.toISOString());

export function toFile(rows: TransferRows, now = new Date()): ProjectExport {
  const answersOf = new Map<string, TransferRows["answers"]>();
  for (const a of rows.answers) answersOf.set(a.responseId, [...(answersOf.get(a.responseId) ?? []), a]);
  return {
    format: PROJECT_FORMAT, version: PROJECT_VERSION, exportedAt: now.toISOString(), sample: rows.project.isSample,
    note: rows.project.isSample ? EXPORT_COPY.watermark : null,
    project: { name: rows.project.name, contextGoal: rows.project.contextGoal, contextTerms: rows.project.contextTerms, createdAt: rows.project.createdAt.toISOString() },
    itemSets: rows.itemSets.map((s) => ({
      id: s.id, version: s.version, source: s.source, sourceFilename: s.sourceFilename, importReport: s.importReport, importedAt: s.importedAt.toISOString(),
      areas: s.areas, shapeRuns: s.shapeRuns, shapedAt: iso(s.shapedAt), contextUsed: s.contextUsed,
      items: rows.items.filter((it) => it.itemSetId === s.id).map((it) => ({ id: it.id, position: it.position, sourceRef: it.sourceRef, originalText: it.originalText, readerText: it.readerText, readerStatus: it.readerStatus, area: it.area, areaRationale: it.areaRationale, proposedValue: it.proposedValue, custom: it.custom, flags: it.flags, perspectives: it.perspectives })),
    })),
    instruments: rows.instruments.map((i) => ({ id: i.id, itemSetId: i.itemSetId, title: i.title, intro: i.intro, method: i.method, showProposed: i.showProposed, layout: i.layout, respondentFields: i.respondentFields, scaleLabels: i.scaleLabels, perspectives: i.perspectives, closing: i.closing, publishedAt: iso(i.publishedAt), createdAt: i.createdAt.toISOString() })),
    invites: rows.invites.map((v) => ({ id: v.id, instrumentId: v.instrumentId, kind: v.kind, email: v.email, name: v.name, roleHint: v.roleHint, opensAt: iso(v.opensAt), closesAt: iso(v.closesAt), hadPasscode: v.passcodeHash !== null, revokedAt: iso(v.revokedAt), remindersSent: v.remindersSent, lastReminderAt: iso(v.lastReminderAt), sentAt: iso(v.sentAt), createdAt: v.createdAt.toISOString() })),
    responses: rows.responses.map((r) => ({
      id: r.id, instrumentId: r.instrumentId, itemSetId: r.itemSetId, inviteId: r.inviteId, fields: r.fields, perspectives: r.perspectives, confidence: r.confidence, signedOff: r.signedOff,
      submittedAt: iso(r.submittedAt), firstSubmittedAt: iso(r.firstSubmittedAt), closingAnswer: r.closingAnswer, signOffText: r.signOffText, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
      answers: (answersOf.get(r.id) ?? []).map((a) => ({ id: a.id, itemId: a.itemId, kind: a.kind, value: a.value, reason: a.reason, comment: a.comment, updatedAt: a.updatedAt.toISOString() })),
    })),
    missingItems: rows.missingItems.map((m) => ({ id: m.id, responseId: m.responseId, text: m.text, suggestedArea: m.suggestedArea, suggestedValue: m.suggestedValue, createdAt: m.createdAt.toISOString() })),
    insights: rows.insights.map((s) => ({ kind: s.kind, title: s.title, why: s.why, citedAnswerIds: s.citedAnswerIds, citedMissingItemIds: s.citedMissingItemIds, state: s.state, closedAt: iso(s.closedAt), closedBy: s.closedByEmail, model: s.model, tokensIn: s.tokensIn, tokensOut: s.tokensOut, costEurCents: s.costEurCents, createdAt: s.createdAt.toISOString() })),
  };
}

export async function exportProject(actor: Actor, projectId: string, now = new Date()): Promise<ProjectExport> {
  await requireRole(actor, "results.export");
  const rows = await projectTransfer.readProject(actor.ws, projectId);
  if (!rows) throw new NotFoundError();
  return toFile(rows, now);
}

const D = (s: string | null) => (s === null ? null : new Date(s));

// Every id a row refers to is a row of the file (the database would refuse it half way otherwise).
function missingReference(f: ProjectExport): string | null {
  const sets = new Set(f.itemSets.map((s) => s.id));
  const items = new Set(f.itemSets.flatMap((s) => s.items.map((it) => it.id)));
  const instruments = new Set(f.instruments.map((i) => i.id));
  const invites = new Set(f.invites.map((v) => v.id));
  const responses = new Set(f.responses.map((r) => r.id));
  const answers = new Set(f.responses.flatMap((r) => r.answers.map((a) => a.id)));
  const missing = new Set(f.missingItems.map((m) => m.id));
  const all = [...sets, ...items, ...instruments, ...invites, ...responses, ...answers, ...missing];
  if (new Set(all).size !== all.length) return "an id that appears twice";
  if (f.instruments.some((i) => !sets.has(i.itemSetId))) return "an instrument's list";
  if (f.invites.some((v) => !instruments.has(v.instrumentId))) return "an invite's instrument";
  if (f.responses.some((r) => !instruments.has(r.instrumentId) || !sets.has(r.itemSetId) || !invites.has(r.inviteId))) return "a response's instrument, list or invite";
  if (f.responses.some((r) => r.answers.some((a) => !items.has(a.itemId)))) return "an answer's item";
  if (f.missingItems.some((m) => !responses.has(m.responseId))) return "a missing item's response";
  if (f.insights.some((s) => s.citedAnswerIds.some((x) => !answers.has(x)) || s.citedMissingItemIds.some((x) => !missing.has(x)))) return "an action's citation";
  return null;
}

export async function importProject(actor: Actor, raw: string, now = new Date()): Promise<{ error: string } | { projectId: string }> {
  await requireRole(actor, "projects.create");
  const E = EXPORT_COPY.importErrors;
  if (raw.length > PROJECT_FILE_MAX) return { error: E.tooLarge };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { error: E.notJson }; }
  const head = z.object({ format: z.unknown(), version: z.unknown() }).safeParse(parsed);
  if (!head.success || head.data.format !== PROJECT_FORMAT) return { error: E.notProject };
  if (typeof head.data.version !== "number" || !Number.isInteger(head.data.version)) return { error: E.notProject };
  if (head.data.version > PROJECT_VERSION) return { error: E.newer(head.data.version, PROJECT_VERSION) };
  if (head.data.version < 1) return { error: E.notProject };
  const file = ProjectFile.safeParse(parsed);
  if (!file.success) return { error: E.damaged(file.error.issues[0]?.path.join(".") || "the file") };
  const f = file.data;
  if (f.sample) return { error: E.sample };
  const name = workspaceNameSchema.safeParse(f.project.name);
  if (!name.success) return { error: E.damaged("project.name") };
  const broken = missingReference(f);
  if (broken) return { error: E.damaged(broken) };
  if (!(await withinPlan(actor.ws, "projects"))) return { error: PROJECTS_COPY.planFull };
  const input: TransferInput = {
    project: { name: name.data, contextGoal: f.project.contextGoal, contextTerms: f.project.contextTerms },
    itemSets: f.itemSets.map((s) => ({ id: s.id, version: s.version, source: s.source, sourceFilename: s.sourceFilename, importReport: s.importReport as TransferInput["itemSets"][number]["importReport"], importedAt: new Date(s.importedAt), areas: s.areas as TransferInput["itemSets"][number]["areas"], shapeRuns: s.shapeRuns, shapedAt: D(s.shapedAt), contextUsed: s.contextUsed as TransferInput["itemSets"][number]["contextUsed"] })),
    items: f.itemSets.flatMap((s) => s.items.map((it) => ({ ...it, itemSetId: s.id, flags: it.flags as TransferInput["items"][number]["flags"] }))),
    instruments: f.instruments.map((i) => ({ ...i, respondentFields: i.respondentFields as TransferInput["instruments"][number]["respondentFields"], scaleLabels: i.scaleLabels as TransferInput["instruments"][number]["scaleLabels"], closing: i.closing as TransferInput["instruments"][number]["closing"], publishedAt: D(i.publishedAt), createdAt: new Date(i.createdAt) })),
    invites: f.invites.map((v) => ({ id: v.id, instrumentId: v.instrumentId, kind: v.kind, email: v.email, name: v.name, roleHint: v.roleHint, opensAt: D(v.opensAt), closesAt: D(v.closesAt), revokedAt: D(v.revokedAt), remindersSent: v.remindersSent, lastReminderAt: D(v.lastReminderAt), sentAt: D(v.sentAt), createdAt: new Date(v.createdAt) })),
    responses: f.responses.map((r) => ({ id: r.id, instrumentId: r.instrumentId, itemSetId: r.itemSetId, inviteId: r.inviteId, fields: r.fields, perspectives: r.perspectives, confidence: r.confidence, signedOff: r.signedOff, submittedAt: D(r.submittedAt), firstSubmittedAt: D(r.firstSubmittedAt), closingAnswer: r.closingAnswer, signOffText: r.signOffText, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) })),
    answers: f.responses.flatMap((r) => r.answers.map((a) => ({ id: a.id, responseId: r.id, itemId: a.itemId, kind: a.kind, value: a.value, reason: a.reason, comment: a.comment, updatedAt: new Date(a.updatedAt) }))),
    missingItems: f.missingItems.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })),
    insights: f.insights.map((s) => ({ kind: s.kind, title: s.title, why: s.why, citedAnswerIds: s.citedAnswerIds, citedMissingItemIds: s.citedMissingItemIds, state: s.state, closedAt: D(s.closedAt), model: s.model, tokensIn: s.tokensIn, tokensOut: s.tokensOut, costEurCents: s.costEurCents, createdAt: new Date(s.createdAt) })),
  };
  const projectId = await projectTransfer.writeProject(actor.ws, input, actor.userId, now);
  return { projectId };
}
