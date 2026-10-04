// The CSV files of the Export tab (stories/E10-1): Answers, Items with totals, People and
// Missing items, each built from the queries Results reads (src/db/queries/results.ts: rows,
// agreement.byItem, tracker.people with results.people, registers.missing) under the page's
// filter, never from a second computation, so every number on Results is a sum of a file's
// rows (acceptance 3). A respondent is named as the Responses tab names them; a value is the
// scale's code with the instrument's label beside it (E5-2, acceptance 3). The sample's files
// start with the watermark line, a filtered file with the filter in words (design note 40), a
// file with the answers not submitted yet with a line saying so; with none of these the header
// is the first line (RFC 4180, section 2.3).
import { items } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import { agreement, registers, results, tracker } from "@/db/queries/results";
import type { ExportFile, WorkspaceId } from "@/db/types";
import { textFor, type ReaderFields } from "@/lib/item-text";
import { describeFilter, filterActive, KIND_LABELS, type FilterContext, type ResultsFilter, type ResultsKind } from "@/lib/results-filter";
import { RESPONSES_COPY } from "@/lib/results-copy";
import { labelFor, proposedCode } from "@/lib/scoring";
import { type Cell, isoUtc } from "./csv";
import { EXPORT_COPY } from "./copy";

export type ExportTable = { preamble: Cell[][]; header: Cell[]; rows: Cell[][] };

const name = (p: { who: string | null; anon: number | null }) => p.who ?? RESPONSES_COPY.anonymous(p.anon ?? 0);
// The Responses tab's mark beside Submitted (decision 0030), in its own column so Status counts.
const since = (p: { changedSince: boolean; submittedAgain?: boolean }) => (p.changedSince ? RESPONSES_COPY.changedSince : p.submittedAgain ? RESPONSES_COPY.submittedAgain : "");

export async function exportTable(ws: WorkspaceId, instrument: Instrument, file: ExportFile, f: ResultsFilter, ctx: FilterContext, sample: boolean): Promise<ExportTable> {
  const preamble: Cell[][] = [];
  if (sample) preamble.push([EXPORT_COPY.watermark]);
  if (filterActive(f)) preamble.push([EXPORT_COPY.filtered(describeFilter(f, ctx))]);
  if (f.includeUnsubmitted) preamble.push([EXPORT_COPY.withUnsubmitted]);
  const fields = instrument.respondentFields;
  const method = instrument.method;
  const label = (code: string | null) => (code === null ? "" : labelFor(method, instrument.scaleLabels, code) ?? "");
  const setItems = await items.forSet(ws, instrument.itemSetId);
  const text = (it: (typeof setItems)[number]) => textFor({ readerStatus: it.readerStatus as ReaderFields["readerStatus"], readerText: it.readerText, originalText: it.originalText });
  const proposed = (it: (typeof setItems)[number]) => (instrument.showProposed ? proposedCode(method, it.proposedValue) : null);
  const C = EXPORT_COPY.columns;

  if (file === "answers") {
    const byId = new Map(setItems.map((it) => [it.id, it]));
    const rows = await results.rows(ws, instrument.id, f);
    return {
      preamble,
      header: [C.respondent, ...fields.map((s) => s.label), C.reference, C.area, C.item, C.proposedValue, C.proposedLabel, C.answer, C.theirValue, C.theirLabel, C.reasonOrQuestion, C.comment, C.submittedAt, C.sinceSubmit, C.source, C.perspectives],
      rows: rows.map((r) => {
        const it = byId.get(r.itemId);
        const p = it ? proposed(it) : null;
        return [name(r), ...fields.map((s) => r.fields[s.key] ?? ""), it?.sourceRef ?? "", it?.area ?? "", it ? text(it) : "", p ?? "", label(p),
          KIND_LABELS[r.kind as ResultsKind] ?? r.kind, r.value ?? "", label(r.value), r.reason ?? "", r.comment ?? "", isoUtc(r.submittedAt), since(r), EXPORT_COPY.sources[r.source], r.perspectives.join(", ")];
      }),
    };
  }

  if (file === "items") {
    const counts = new Map((await agreement.byItem(ws, instrument.id, f)).map((c) => [c.itemId, c]));
    return {
      preamble,
      header: [C.reference, C.item, C.original, C.area, C.proposedValue, C.proposedLabel, KIND_LABELS.agree, KIND_LABELS.change, KIND_LABELS.disagree, KIND_LABELS.unclear, KIND_LABELS.pick, C.notAnswered, C.agreement],
      rows: setItems.map((it) => {
        const c = counts.get(it.id);
        const p = proposed(it);
        const answered = c ? c.agree + c.change + c.disagree + c.unclear + c.pick : 0;
        return [it.sourceRef ?? "", text(it), it.originalText, it.area ?? "", p ?? "", label(p), c?.agree ?? 0, c?.change ?? 0, c?.disagree ?? 0, c?.unclear ?? 0, c?.pick ?? 0, Math.max(0, (c?.couldSee ?? 0) - answered), c?.percent ?? ""];
      }),
    };
  }

  if (file === "people") {
    const keys = fields.map((s) => s.key);
    const people = await tracker.people(ws, instrument.id, { ...f, sort: null }, keys);
    const minutes = new Map((await results.people(ws, instrument.id, f)).map((p) => [p.id, p.minutesToSubmit]));
    return {
      preamble,
      header: [C.respondent, ...fields.map((s) => s.label), C.status, C.sinceSubmit, C.answered, C.visible, C.submittedAt, C.minutes, C.source, C.reminders, C.withComment],
      rows: people.map((p) => {
        const m = minutes.get(p.id);
        return [name(p), ...keys.map((k) => p.fields[k] ?? ""), EXPORT_COPY.statuses[p.status], since(p), p.answered, p.visible, isoUtc(p.submittedAt), m ?? "", EXPORT_COPY.sources[p.source], p.reminders ?? "", p.withComment];
      }),
    };
  }

  const keys = fields.map((s) => s.key);
  const missing = await registers.missing(ws, instrument.id, { ...f, sort: null }, keys, method);
  return {
    preamble,
    header: [C.suggested, C.suggestedArea, C.suggestedValue, C.suggestedLabel, C.respondent, ...fields.map((s) => s.label), C.status, C.sinceSubmit],
    rows: missing.map((m) => [m.text, m.area ?? "", m.value ?? "", label(m.value), name(m), ...keys.map((k) => m.fields[k] ?? ""), m.submitted ? EXPORT_COPY.statuses.submitted : EXPORT_COPY.statuses.inProgress, since(m)]),
  };
}
