// The whole project as one JSON file and back (stories/E10-2; ProjectExport in INTERFACES.md).
// exportProject reads every row of a project (src/db/queries/projectTransfer.ts readProject)
// and writes the file: a format name and version at the top, the project and its context,
// every version of the list with its items and its import report (the import log), the
// instruments, the invites without their tokens or passcodes, the responses with their
// answers and sign-offs, the missing items and the actions with their state. importProject
// checks a file (its format, its version, then every field with zod: zod.dev/api) and
// recreates it under the current workspace with new ids and tokens and the public link revoked
// (writeProject). A newer version is refused with its number; version 1 is the only one so
// far, so there is nothing older to migrate. A response of a validation set to Names hidden
// or Anonymous (stories/E5-7, acceptance 5) is written with no invite id and no fields, so
// the file cannot tie it to a personal invite; the import puts it on its validation's public
// invite. Amended 2026-10-06 after the audit: under those levels every time of a response (its
// start, its last save, its submits), of its answers and of its missing items is written as
// the export's own time (null stays null for a response not submitted), its perspectives as
// they are (perspective breakdowns stay under decision 0058, so an imported project shows each
// item to the same people), and no personal invite of the validation is written, so the
// imported project carries the public link only and no reminder can reach a person who
// already answered. The import refuses a personal invite on such a validation, and a response
// whose fields are not its dropdowns' values, as a damaged file. Decision 0058: under those
// levels the responses go in the fixed order of their "Anonymous [N]" numbers (their missing
// items too), under Names hidden only the submitted ones, and no answer on an item fewer than
// MIN_GROUP of them could see (hiddenSelection). The
// sample's file is refused: its invented data would show without the watermark (CLAUDE.md,
// dashboard).
import { createHash } from "node:crypto";
import { z } from "zod";
import { projectTransfer } from "@/db/queries";
import type { TransferInput, TransferRows } from "@/db/queries/projectTransfer";
import { NotFoundError } from "@/lib/errors";
import { requireRole, type Actor } from "@/lib/members";
import { monthStart } from "@/db/queries/usage";
import { roomInPlan, withinPlan } from "@/lib/plans";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { CLOSING_QUESTION_MAX, SIGN_OFF_MAX } from "@/lib/closing";
import { DEFAULT_REASON_RULE } from "@/lib/scoring";
import { DEFAULT_ANONYMITY, fieldsBlocking, namesShown } from "@/lib/anonymity";
import { FIELDS_MAX, OPTIONS_MAX, OPTIONS_MIN } from "@/lib/respondent-fields";
import { MIN_GROUP } from "@/lib/results-agreement";
import { workspaceNameSchema } from "@/lib/workspace-name";
import { EXPORT_COPY } from "./copy";
import { log } from "@/lib/log";

export const PROJECT_FORMAT = "smesay.project";
export const PROJECT_VERSION = 1;
// The largest file the import reads: 5 MB, as an upload (SECURITY.md, Data), inside the server
// action's 6 MB body limit, which leaves room for the multipart framing (next.config.ts), so
// the app's own sentence answers a file over it, not Next's 413.
export const PROJECT_FILE_MAX = 5 * 1024 * 1024;

// The enums as the schema has them (src/db/schema.ts); projectTransfer.test.ts checks they agree.
export const FILE_ENUMS = {
  source: ["xlsx", "csv", "pasted"],
  readerStatus: ["suggested", "accepted", "rejected"],
  method: ["moscow", "fit", "kcd"],
  layout: ["chapters", "item", "page"],
  reasonRule: ["differs", "never", "always"],
  anonymity: ["named", "hidden", "anonymous"],
  inviteKind: ["public", "personal"],
  answerKind: ["agree", "change", "disagree", "unclear", "pick"],
  insightKind: ["rewrite", "conflict", "followUp", "coverage"],
  insightState: ["open", "done", "dismissed"],
} as const;

// A date Postgres's timestamptz holds and the app writes: ISO 8601 with an offset, between 1970
// and 9999 in UTC (postgresql.org/docs/current/datatype-datetime.html gives the type's range).
const date = z.iso.datetime({ offset: true }).refine((s) => { const y = new Date(s).getUTCFullYear(); return y >= 1970 && y <= 9999; });
// Text with no NUL character, which Postgres text and jsonb do not store
// (postgresql.org/docs/current/datatype-character.html: "The character with code zero ... cannot be stored").
const text = (max: number) => z.string().max(max).refine((s) => !s.includes("\u0000"));
// What a list import keeps whole (src/db/queries/importCommit.ts writes text, reference, area,
// value and the extra columns with no limit): bounded only by the file's 5 MB.
const WHOLE = 5 * 1024 * 1024;
const id = z.string().min(1).max(64);
// Postgres integer (postgresql.org/docs/current/datatype-numeric.html: -2147483648 to
// +2147483647); a count in the file is never negative.
const count = z.number().int().min(0).max(2147483647);

// The JSON columns, each as src/db/types.ts declares it, so a file cannot write a shape the
// app cannot read (RespondentFieldSpec, ClosingSpec, ScaleLabels, ShapeArea, ImportReport,
// ProjectContext, ItemFlags; custom holds the extra columns of an import, text by name).
const importReport = z.strictObject({
  emptyRows: count, exactDuplicates: count, overLimit: count, rowsRead: count, headerRow: count, unrecognisedValues: count,
  duplicateRefs: z.array(z.strictObject({ kept: text(WHOLE), folded: z.array(text(WHOLE)) })),
}).nullable();
const areas = z.array(z.strictObject({ name: text(200), rationale: text(1000) })).max(50).nullable();
const contextUsed = z.strictObject({ goal: text(2000).nullable(), terms: text(2000).nullable() }).nullable();
const flags = z.strictObject({ duplicateOf: text(200).optional(), ambiguity: text(1000).optional(), dismissed: z.boolean().optional(), foldedRefs: z.array(text(200)).max(2000).optional(), areaBy: z.enum(["ai", "pm"]).optional(), importedArea: text(200).optional() }).nullable();
const custom = z.record(text(WHOLE), text(WHOLE)).nullable();
// A dropdown has OPTIONS_MIN to OPTIONS_MAX options, as the Build form requires (respondent-fields.ts).
const respondentFields = z.array(z.strictObject({ key: z.string().min(1).max(60), label: z.string().min(1).max(200), type: z.enum(["text", "dropdown", "email"]), mandatory: z.boolean(), options: z.array(z.string().min(1).max(200)).max(50).optional() }))
  .max(FIELDS_MAX).refine((list) => new Set(list.map((f) => f.key)).size === list.length)
  .refine((list) => list.every((f) => f.type !== "dropdown" || ((f.options?.length ?? 0) >= OPTIONS_MIN && (f.options?.length ?? 0) <= OPTIONS_MAX)));
const scaleLabels = z.record(text(50), text(200)).nullable();
const closing = z.strictObject({ confidence: z.literal(true), missingForm: z.boolean(), signOffText: text(SIGN_OFF_MAX), closingQuestion: text(CLOSING_QUESTION_MAX).optional() });

const ProjectFile = z.strictObject({
  format: z.literal(PROJECT_FORMAT),
  version: z.literal(PROJECT_VERSION),
  exportedAt: date,
  sample: z.boolean(),
  note: text(200).nullable(),
  project: z.strictObject({ name: text(80), contextGoal: text(2000).nullable(), contextTerms: text(2000).nullable(), createdAt: date }),
  itemSets: z.array(z.strictObject({
    id, version: count.min(1), source: z.enum(FILE_ENUMS.source), sourceFilename: text(300).nullable(), importReport, importedAt: date,
    areas, shapeRuns: count, shapedAt: date.nullable(), contextUsed,
    items: z.array(z.strictObject({
      id, position: count.min(1), sourceRef: text(WHOLE).nullable(), originalText: text(WHOLE), readerText: text(WHOLE).nullable(), readerStatus: z.enum(FILE_ENUMS.readerStatus).nullable(),
      area: text(WHOLE).nullable(), areaRationale: text(WHOLE).nullable(), proposedValue: text(WHOLE).nullable(), custom, flags, perspectives: z.array(text(100)),
    })).max(2000),
  })),
  instruments: z.array(z.strictObject({
    id, itemSetId: id, title: text(200).refine((s) => s.trim() !== ""), intro: text(5000).nullable(), method: z.enum(FILE_ENUMS.method), showProposed: z.boolean(), layout: z.enum(FILE_ENUMS.layout),
    // From 2026-10-05 (design note 98): a file written before has none and reads the default.
    reasonRule: z.enum(FILE_ENUMS.reasonRule).optional(),
    // From 2026-10-06 (E5-7): a file written before has none and reads Named.
    anonymity: z.enum(FILE_ENUMS.anonymity).optional(),
    respondentFields, scaleLabels, perspectives: z.array(text(100)), closing, publishedAt: date.nullable(), createdAt: date,
  })).max(100),
  invites: z.array(z.strictObject({
    id, instrumentId: id, kind: z.enum(FILE_ENUMS.inviteKind), email: text(320).nullable(), name: text(200).nullable(), roleHint: text(200).nullable(),
    opensAt: date.nullable(), closesAt: date.nullable(), hadPasscode: z.boolean(), revokedAt: date.nullable(), remindersSent: count, lastReminderAt: date.nullable(), sentAt: date.nullable(), createdAt: date,
  })),
  responses: z.array(z.strictObject({
    // Null for a response of a validation that hides names (E5-7).
    id, instrumentId: id, itemSetId: id, inviteId: id.nullable(), fields: z.record(z.string(), text(500)), perspectives: z.array(text(100)), confidence: z.number().int().min(1).max(5).nullable(),
    signedOff: z.boolean(), submittedAt: date.nullable(), firstSubmittedAt: date.nullable(), closingAnswer: text(5000).nullable(), signOffText: text(1000).nullable(), createdAt: date, updatedAt: date,
    answers: z.array(z.strictObject({ id, itemId: id, kind: z.enum(FILE_ENUMS.answerKind), value: text(50).nullable(), reason: text(5000).nullable(), comment: text(5000).nullable(), updatedAt: date })),
  })),
  missingItems: z.array(z.strictObject({ id, responseId: id, text: text(5000), suggestedArea: text(200).nullable(), suggestedValue: text(50).nullable(), createdAt: date })),
  insights: z.array(z.strictObject({
    kind: z.enum(FILE_ENUMS.insightKind).nullable(), title: text(500), why: text(2000).nullable(), citedAnswerIds: z.array(id), citedMissingItemIds: z.array(id),
    state: z.enum(FILE_ENUMS.insightState), closedAt: date.nullable(), closedBy: text(320).nullable(), model: text(100).nullable(), tokensIn: count.nullable(), tokensOut: count.nullable(), costEurCents: count.nullable(), createdAt: date,
  })),
});
export type ProjectExport = z.infer<typeof ProjectFile>;

const iso = (d: Date | null) => (d === null ? null : d.toISOString());

// The fixed order of the "Anonymous [N]" numbers (src/db/queries/results.ts head): md5 of the
// response id and the instrument id as text, compared byte by byte, as the SQL compares it under
// the "C" collation. createHash and digest("hex"): nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options.
const fixedKey = (r: { id: string; instrumentId: string }) => createHash("md5").update(r.id + r.instrumentId).digest("hex");

// Decision 0058: under Names hidden and Anonymous the responses written are, per validation,
// in the fixed order of their numbers (not their start, which Share shows); under Names hidden
// only the submitted ones (Share names who has finished, so a response not submitted would say
// who has not; Results count the same set, src/db/queries/results.ts head); and no answer on
// an item fewer than MIN_GROUP of the responses written could see (its perspectives), as on
// Results. A missing item follows its response: under those levels in the same fixed order of
// the responses, then by its id, never by when it was written. For every project, Named ones
// too, an action keeps only the citations still in the file (a citation of a row deleted
// since goes) and is not written when it had some and none is left; under those levels an
// action that cites an answer or a missing item the file leaves out is not written at all,
// since its words could quote what was left out.
function hiddenSelection(rows: TransferRows, hides: Set<string>) {
  const level = new Map(rows.instruments.map((i) => [i.id, i.anonymity]));
  const written = rows.responses.filter((r) => !hides.has(r.instrumentId) || level.get(r.instrumentId) !== "hidden" || r.submittedAt !== null);
  const sees = (itemPerspectives: string[], r: { perspectives: string[] }) => itemPerspectives.length === 0 || itemPerspectives.some((p) => r.perspectives.includes(p));
  const setOf = new Map(rows.instruments.map((i) => [i.id, i.itemSetId]));
  const few = new Set<string>();
  for (const id of hides) {
    const mine = written.filter((r) => r.instrumentId === id);
    for (const it of rows.items.filter((x) => x.itemSetId === setOf.get(id))) if (mine.filter((r) => sees(it.perspectives, r)).length < MIN_GROUP) few.add(`${id} ${it.id}`);
  }
  const responseIds = new Set(written.map((r) => r.id));
  const instrumentOf = new Map(written.map((r) => [r.id, r.instrumentId]));
  const answers = rows.answers.filter((a) => responseIds.has(a.responseId) && !few.has(`${instrumentOf.get(a.responseId)} ${a.itemId}`));
  const answerIds = new Set(answers.map((a) => a.id));
  const kept = rows.missingItems.filter((m) => responseIds.has(m.responseId));
  const missingIds = new Set(kept.map((m) => m.id));
  // Rows of the project the file leaves out (only under the two levels), as against rows
  // deleted since an action cited them, which are in neither list.
  const leftOut = new Set([...rows.answers.filter((a) => !answerIds.has(a.id)), ...rows.missingItems.filter((m) => !missingIds.has(m.id))].map((x) => x.id));
  const insights = rows.insights.flatMap((s) => {
    if ([...s.citedAnswerIds, ...s.citedMissingItemIds].some((x) => leftOut.has(x))) return [];
    const cited = { citedAnswerIds: s.citedAnswerIds.filter((x) => answerIds.has(x)), citedMissingItemIds: s.citedMissingItemIds.filter((x) => missingIds.has(x)) };
    const had = s.citedAnswerIds.length + s.citedMissingItemIds.length;
    return had > 0 && cited.citedAnswerIds.length + cited.citedMissingItemIds.length === 0 ? [] : [{ ...s, ...cited }];
  });
  const byKey = <T,>(key: (x: T) => string) => (p: T, q: T) => (key(p) < key(q) ? -1 : key(p) > key(q) ? 1 : 0);
  const ordered = [
    ...written.filter((r) => !hides.has(r.instrumentId)),
    ...[...hides].flatMap((id) => written.filter((r) => r.instrumentId === id).sort(byKey(fixedKey))),
  ];
  const position = new Map(ordered.map((r, i) => [r.id, i]));
  const hidden = (m: { responseId: string }) => hides.has(instrumentOf.get(m.responseId)!);
  const missingItems = [
    ...kept.filter((m) => !hidden(m)),
    ...kept.filter(hidden).sort((p, q) => position.get(p.responseId)! - position.get(q.responseId)! || byKey<{ id: string }>((x) => x.id)(p, q)),
  ];
  return { responses: ordered, answers, missingItems, insights };
}

export function toFile(all: TransferRows, now = new Date()): ProjectExport {
  const hides = new Set(all.instruments.filter((i) => !namesShown(i.anonymity)).map((i) => i.id));
  const rows: TransferRows = { ...all, ...hiddenSelection(all, hides) };
  const answersOf = new Map<string, TransferRows["answers"]>();
  for (const a of rows.answers) answersOf.set(a.responseId, [...(answersOf.get(a.responseId) ?? []), a]);
  // E5-7: one time for every row of a response of a validation that hides names.
  const at = now.toISOString();
  const hiddenResponses = new Set(rows.responses.filter((r) => hides.has(r.instrumentId)).map((r) => r.id));
  const when = (hidden: boolean, d: Date) => (hidden ? at : d.toISOString());
  const whenOrNull = (hidden: boolean, d: Date | null) => (d === null ? null : hidden ? at : d.toISOString());
  return {
    format: PROJECT_FORMAT, version: PROJECT_VERSION, exportedAt: now.toISOString(), sample: rows.project.isSample,
    note: rows.project.isSample ? EXPORT_COPY.watermark : null,
    project: { name: rows.project.name, contextGoal: rows.project.contextGoal, contextTerms: rows.project.contextTerms, createdAt: rows.project.createdAt.toISOString() },
    itemSets: rows.itemSets.map((s) => ({
      id: s.id, version: s.version, source: s.source, sourceFilename: s.sourceFilename, importReport: s.importReport, importedAt: s.importedAt.toISOString(),
      areas: s.areas, shapeRuns: s.shapeRuns, shapedAt: iso(s.shapedAt), contextUsed: s.contextUsed,
      items: rows.items.filter((it) => it.itemSetId === s.id).map((it) => ({ id: it.id, position: it.position, sourceRef: it.sourceRef, originalText: it.originalText, readerText: it.readerText, readerStatus: it.readerStatus, area: it.area, areaRationale: it.areaRationale, proposedValue: it.proposedValue, custom: it.custom as Record<string, string> | null, flags: it.flags, perspectives: it.perspectives })),
    })),
    instruments: rows.instruments.map((i) => ({ id: i.id, itemSetId: i.itemSetId, title: i.title, intro: i.intro, method: i.method, showProposed: i.showProposed, layout: i.layout, reasonRule: i.reasonRule, anonymity: i.anonymity, respondentFields: i.respondentFields, scaleLabels: i.scaleLabels, perspectives: i.perspectives, closing: i.closing, publishedAt: iso(i.publishedAt), createdAt: i.createdAt.toISOString() })),
    invites: rows.invites.filter((v) => v.kind === "public" || !hides.has(v.instrumentId)).map((v) => ({ id: v.id, instrumentId: v.instrumentId, kind: v.kind, email: v.email, name: v.name, roleHint: v.roleHint, opensAt: iso(v.opensAt), closesAt: iso(v.closesAt), hadPasscode: v.passcodeHash !== null, revokedAt: iso(v.revokedAt), remindersSent: v.remindersSent, lastReminderAt: iso(v.lastReminderAt), sentAt: iso(v.sentAt), createdAt: v.createdAt.toISOString() })),
    responses: rows.responses.map((r) => {
      const h = hides.has(r.instrumentId);
      return {
        id: r.id, instrumentId: r.instrumentId, itemSetId: r.itemSetId, inviteId: h ? null : r.inviteId, fields: h ? {} : r.fields, perspectives: r.perspectives, confidence: r.confidence, signedOff: r.signedOff,
        submittedAt: whenOrNull(h, r.submittedAt), firstSubmittedAt: whenOrNull(h, r.firstSubmittedAt), closingAnswer: r.closingAnswer, signOffText: r.signOffText, createdAt: when(h, r.createdAt), updatedAt: when(h, r.updatedAt),
        answers: (answersOf.get(r.id) ?? []).map((a) => ({ id: a.id, itemId: a.itemId, kind: a.kind, value: a.value, reason: a.reason, comment: a.comment, updatedAt: when(h, a.updatedAt) })),
      };
    }),
    missingItems: rows.missingItems.map((m) => ({ id: m.id, responseId: m.responseId, text: m.text, suggestedArea: m.suggestedArea, suggestedValue: m.suggestedValue, createdAt: when(hiddenResponses.has(m.responseId), m.createdAt) })),
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

// Every id a row refers to is a row of the file, and the rules of src/db/schema.ts a crafted file
// can break (unique indexes, checks, composite keys) hold, so the PM reads which part is wrong.
// A refusal these checks do not foresee still rolls back whole (importProject catches it).
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
  if (f.instruments.some((i) => !sets.has(i.itemSetId))) return "a validation's list";
  // E5-7: a validation that hides names has dropdown fields only.
  if (f.instruments.some((i) => fieldsBlocking(i.respondentFields, i.anonymity ?? DEFAULT_ANONYMITY).length > 0)) return "a validation's fields";
  if (f.invites.some((v) => !instruments.has(v.instrumentId))) return "an invite's validation";
  // A response with no invite (E5-7) only on a validation that hides names, which then needs
  // a public invite to carry it. Such a validation has no personal invite in the file, and its
  // responses carry no field but its dropdowns' values (amended 2026-10-06).
  const hiding = new Set(f.instruments.filter((i) => !namesShown(i.anonymity ?? DEFAULT_ANONYMITY)).map((i) => i.id));
  if (f.invites.some((v) => v.kind === "personal" && hiding.has(v.instrumentId))) return "a personal invite on a validation that hides names";
  const dropdowns = new Map(f.instruments.map((i) => [i.id, new Map(i.respondentFields.filter((x) => x.type === "dropdown").map((x) => [x.key, x.options ?? []]))]));
  if (f.responses.some((r) => hiding.has(r.instrumentId) && Object.entries(r.fields).some(([k, v]) => !(dropdowns.get(r.instrumentId)?.get(k) ?? []).includes(v)))) return "a response's fields";
  const publicOf = new Set(f.invites.filter((v) => v.kind === "public").map((v) => v.instrumentId));
  if (f.responses.some((r) => !instruments.has(r.instrumentId) || !sets.has(r.itemSetId) || (r.inviteId === null ? !hiding.has(r.instrumentId) || !publicOf.has(r.instrumentId) : !invites.has(r.inviteId)))) return "a response's validation, list or invite";
  if (f.responses.some((r) => r.answers.some((a) => !items.has(a.itemId)))) return "an answer's item";
  if (f.missingItems.some((m) => !responses.has(m.responseId))) return "a missing item's response";
  if (f.insights.some((s) => s.citedAnswerIds.some((x) => !answers.has(x)) || s.citedMissingItemIds.some((x) => !missing.has(x)))) return "an action's citation";
  // item_set_project_version_idx: one list per version.
  if (new Set(f.itemSets.map((s) => s.version)).size !== f.itemSets.length) return "a list's version";
  // item_original_text_check and missing_item_text_check: text that is not only spaces.
  if (f.itemSets.some((s) => s.items.some((it) => it.originalText.trim() === ""))) return "an item's text";
  if (f.missingItems.some((m) => m.text.trim() === "")) return "a missing item's text";
  // response_instrument_set_fk and answer_response_set_fk: a response answers its instrument's
  // list, and every answer is on an item of that list, once (answer_response_item_idx).
  const setOfInstrument = new Map(f.instruments.map((i) => [i.id, i.itemSetId]));
  const setOfItem = new Map(f.itemSets.flatMap((s) => s.items.map((it) => [it.id, s.id] as const)));
  if (f.responses.some((r) => setOfInstrument.get(r.instrumentId) !== r.itemSetId)) return "a response's list";
  // response_invite_instrument_fk: a response came by an invite of its own instrument.
  const instrumentOfInvite = new Map(f.invites.map((v) => [v.id, v.instrumentId]));
  if (f.responses.some((r) => r.inviteId !== null && instrumentOfInvite.get(r.inviteId) !== r.instrumentId)) return "a response's invite";
  // A submitted response has its first Submit (the plan counts by it).
  if (f.responses.some((r) => r.submittedAt !== null && r.firstSubmittedAt === null)) return "a response's dates";
  if (f.responses.some((r) => r.answers.some((a) => setOfItem.get(a.itemId) !== r.itemSetId) || new Set(r.answers.map((a) => a.itemId)).size !== r.answers.length)) return "an answer's item";
  // invite_personal_email_check and invite_personal_email_idx: a personal invite has an email,
  // one per instrument.
  const personal = f.invites.filter((v) => v.kind === "personal");
  // The address check of the invitee form (src/lib/invitees-rules.ts), and one per instrument
  // whatever its case.
  if (personal.some((v) => !v.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))) return "a personal invite's email";
  if (new Set(personal.map((v) => `${v.instrumentId} ${v.email!.toLowerCase()}`)).size !== personal.length) return "a personal invite's email";
  // insight_closed_check: an open action has no closing date, a closed one has one.
  if (f.insights.some((s) => (s.state === "open") !== (s.closedAt === null))) return "an action's state";
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
  const thisMonth = f.responses.filter((r) => r.firstSubmittedAt !== null && new Date(r.firstSubmittedAt) >= monthStart(now)).length;
  const room = thisMonth > 0 ? await roomInPlan(actor.ws, "responses", now) : null;
  if (room !== null && thisMonth > room) return { error: E.responsesFull(thisMonth, room) };
  // A response keeps only the fields its instrument asks for (CLAUDE.md, respondent side).
  const keysOf = new Map(f.instruments.map((i) => [i.id, new Set(i.respondentFields.map((s) => s.key))]));
  // A response with no invite (E5-7) goes on its validation's public invite, the first in the file.
  const publicInvite = new Map<string, string>();
  for (const v of f.invites) if (v.kind === "public" && !publicInvite.has(v.instrumentId)) publicInvite.set(v.instrumentId, v.id);
  const fieldsOf = (r: ProjectExport["responses"][number]) => Object.fromEntries(Object.entries(r.fields).filter(([k]) => keysOf.get(r.instrumentId)?.has(k)));
  const input: TransferInput = {
    project: { name: name.data, contextGoal: f.project.contextGoal, contextTerms: f.project.contextTerms },
    itemSets: f.itemSets.map((s) => ({ id: s.id, version: s.version, source: s.source, sourceFilename: s.sourceFilename, importReport: s.importReport as TransferInput["itemSets"][number]["importReport"], importedAt: new Date(s.importedAt), areas: s.areas as TransferInput["itemSets"][number]["areas"], shapeRuns: s.shapeRuns, shapedAt: D(s.shapedAt), contextUsed: s.contextUsed as TransferInput["itemSets"][number]["contextUsed"] })),
    items: f.itemSets.flatMap((s) => s.items.map((it) => ({ ...it, itemSetId: s.id, flags: it.flags as TransferInput["items"][number]["flags"] }))),
    instruments: f.instruments.map((i) => ({ ...i, reasonRule: i.reasonRule ?? DEFAULT_REASON_RULE, anonymity: i.anonymity ?? DEFAULT_ANONYMITY, respondentFields: i.respondentFields as TransferInput["instruments"][number]["respondentFields"], scaleLabels: i.scaleLabels as TransferInput["instruments"][number]["scaleLabels"], closing: i.closing as TransferInput["instruments"][number]["closing"], publishedAt: D(i.publishedAt), createdAt: new Date(i.createdAt) })),
    invites: f.invites.map((v) => ({ id: v.id, instrumentId: v.instrumentId, kind: v.kind, email: v.email, name: v.name, roleHint: v.roleHint, opensAt: D(v.opensAt), closesAt: D(v.closesAt), revokedAt: D(v.revokedAt), remindersSent: v.remindersSent, lastReminderAt: D(v.lastReminderAt), sentAt: D(v.sentAt), createdAt: new Date(v.createdAt) })),
    responses: f.responses.map((r) => ({ id: r.id, instrumentId: r.instrumentId, itemSetId: r.itemSetId, inviteId: r.inviteId ?? publicInvite.get(r.instrumentId)!, fields: fieldsOf(r), perspectives: r.perspectives, confidence: r.confidence, signedOff: r.signedOff, submittedAt: D(r.submittedAt), firstSubmittedAt: D(r.firstSubmittedAt), closingAnswer: r.closingAnswer, signOffText: r.signOffText, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) })),
    answers: f.responses.flatMap((r) => r.answers.map((a) => ({ id: a.id, responseId: r.id, itemId: a.itemId, kind: a.kind, value: a.value, reason: a.reason, comment: a.comment, updatedAt: new Date(a.updatedAt) }))),
    missingItems: f.missingItems.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })),
    insights: f.insights.map((s) => ({ kind: s.kind, title: s.title, why: s.why, citedAnswerIds: s.citedAnswerIds, citedMissingItemIds: s.citedMissingItemIds, state: s.state, closedAt: D(s.closedAt), model: s.model, tokensIn: s.tokensIn, tokensOut: s.tokensOut, costEurCents: s.costEurCents, createdAt: new Date(s.createdAt) })),
  };
  // A database refusal the checks above did not foresee: the transaction rolls back, and the
  // error, which carries the rows' values (drizzle-orm's DrizzleQueryError puts the query's
  // params in its message), is not rethrown, so no respondent's data reaches the server log.
  // Postgres's integrity and data errors (SQLSTATE classes 23 and 22: postgresql.org/docs/
  // current/errcodes-appendix.html) are the file's; anything else (a lost connection, a
  // deadlock) is thrown again without the values, so the PM gets the error page's "Try again".
  try {
    return { projectId: await projectTransfer.writeProject(actor.ws, input, actor.userId, now) };
  } catch (err) {
    const code = String((err as { cause?: { code?: unknown } })?.cause?.code ?? "");
    log("error", "Project import: the database refused the file.", { sqlstate: code || "none" });
    if (code.startsWith("23") || code.startsWith("22")) return { error: E.damaged("the file") };
    throw new Error("project import: the write did not finish");
  }
}
