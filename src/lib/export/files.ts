// The CSV files of the Export tab (stories/E10-1): Answers, Items with totals, People and
// Missing items, each built from the queries Results reads (src/db/queries/results.ts: rows,
// agreement.byItem, tracker.people with results.people, registers.missing) under the page's
// filter, never from a second computation, so every number on Results is a sum of a file's
// rows (acceptance 3). A respondent is named as the Responses tab names them; a value is the
// scale's code with the instrument's label beside it (E5-2, acceptance 3). The sample's files
// start with the watermark line, a filtered file with the filter in words (design note 40), a
// file with the answers not submitted yet with a line saying so; with none of these the header
// is the first line (RFC 4180, section 2.3). Under Names hidden and Anonymous (stories/E5-7,
// acceptance 5) every respondent is "Anonymous [N]" and the answers, people and missing files
// have no field column, no Submitted at, no Source, no Reminders and no Perspectives; the
// People file keeps Minutes to submit (a duration), so the median tile still adds up.
// Amended 2026-10-06 after the audit: under those levels the answers, people and missing
// files list people, so they follow no field or perspective filter (and, under Names hidden,
// no status filter); their first lines say so. The items file follows the whole filter and,
// when it keeps fewer than 3 counted people, has no row but the line saying so; an item fewer
// than 3 counted people could see has no count, its agreement cell "Fewer than 3 answers".
// Under Names hidden no file says who has submitted: no Status, Since submitting, Answered,
// Items seen or Minutes to submit, since Share names who has finished.
import { items } from "@/db/queries";
import type { Instrument } from "@/db/queries/instruments";
import { agreement, registers, results, tracker } from "@/db/queries/results";
import type { CsvFile, WorkspaceId } from "@/db/types";
import { textFor, type ReaderFields } from "@/lib/item-text";
import { namesShown } from "@/lib/anonymity";
import { describeFilter, filterActive, identityFiltered, KIND_LABELS, personFilter, type FilterContext, type ResultsFilter, type ResultsKind } from "@/lib/results-filter";
import { AGREEMENT_COPY, RESPONSES_COPY, RESULTS_COPY } from "@/lib/results-copy";
import { labelFor, proposedCode } from "@/lib/scoring";
import { type Cell, isoUtc } from "./csv";
import { EXPORT_COPY } from "./copy";

export type ExportTable = { preamble: Cell[][]; header: Cell[]; rows: Cell[][] };

const name = (p: { who: string | null; anon: number | null }) => p.who ?? RESPONSES_COPY.anonymous(p.anon ?? 0);
// The Responses tab's mark beside Submitted (decision 0030), in its own column so Status counts.
const since = (p: { changedSince: boolean; submittedAgain?: boolean }) => (p.changedSince ? RESPONSES_COPY.changedSince : p.submittedAgain ? RESPONSES_COPY.submittedAgain : "");

export async function exportTable(ws: WorkspaceId, instrument: Instrument, file: CsvFile, f: ResultsFilter, ctx: FilterContext, sample: boolean): Promise<ExportTable> {
  const preamble: Cell[][] = [];
  if (sample) preamble.push([EXPORT_COPY.watermark]);
  // A file of people reads the filter a list of people follows (E5-7, amended 2026-10-06).
  const listed = file === "items" ? f : personFilter(f, instrument.anonymity);
  if (filterActive(listed)) preamble.push([EXPORT_COPY.filtered(describeFilter(listed, ctx))]);
  if (file !== "items" && identityFiltered(f, instrument.anonymity)) preamble.push([RESULTS_COPY.personLevel]);
  if (f.includeUnsubmitted) preamble.push([EXPORT_COPY.withUnsubmitted]);
  const named = namesShown(instrument.anonymity);
  const fields = named ? instrument.respondentFields : [];
  // A column kept only under Named (E5-7).
  const only = <T,>(cells: T[]): T[] => (named ? cells : []);
  // A column that says who has submitted: not under Names hidden (E5-7, amended 2026-10-06).
  const stated = <T,>(cells: T[]): T[] => (instrument.anonymity === "hidden" ? [] : cells);
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
      header: [C.respondent, ...fields.map((s) => s.label), C.reference, C.area, C.item, C.proposedValue, C.proposedLabel, C.answer, C.theirValue, C.theirLabel, C.reasonOrQuestion, C.comment, ...only([C.submittedAt]), ...stated([C.sinceSubmit]), ...only([C.source, C.perspectives])],
      rows: rows.map((r) => {
        const it = byId.get(r.itemId);
        const p = it ? proposed(it) : null;
        return [name(r), ...fields.map((s) => r.fields[s.key] ?? ""), it?.sourceRef ?? "", it?.area ?? "", it ? text(it) : "", p ?? "", label(p),
          KIND_LABELS[r.kind as ResultsKind] ?? r.kind, r.value ?? "", label(r.value), r.reason ?? "", r.comment ?? "", ...only([isoUtc(r.submittedAt)]), ...stated([since(r)]), ...only([EXPORT_COPY.sources[r.source], r.perspectives.join(", ")])];
      }),
    };
  }

  if (file === "items") {
    const header = [C.reference, C.item, C.original, C.area, C.proposedValue, C.proposedLabel, KIND_LABELS.agree, KIND_LABELS.change, KIND_LABELS.disagree, KIND_LABELS.unclear, KIND_LABELS.pick, C.notAnswered, C.agreement];
    // Under the two levels a filter that keeps fewer than 3 counted people: no row (E5-7, B).
    if (!named && (await results.numbers(ws, instrument.id, f))?.tooFew) return { preamble: [...preamble, [RESULTS_COPY.tooFew]], header, rows: [] };
    const counts = new Map((await agreement.byItem(ws, instrument.id, f)).map((c) => [c.itemId, c]));
    return {
      preamble,
      header,
      rows: setItems.map((it) => {
        const c = counts.get(it.id);
        const p = proposed(it);
        const head = [it.sourceRef ?? "", text(it), it.originalText, it.area ?? "", p ?? "", label(p)];
        if (c?.few) return [...head, "", "", "", "", "", "", AGREEMENT_COPY.fewAnswers];
        const answered = c ? c.agree + c.change + c.disagree + c.unclear + c.pick : 0;
        return [...head, c?.agree ?? 0, c?.change ?? 0, c?.disagree ?? 0, c?.unclear ?? 0, c?.pick ?? 0, Math.max(0, (c?.couldSee ?? 0) - answered), c?.percent ?? ""];
      }),
    };
  }

  if (file === "people") {
    const keys = fields.map((s) => s.key);
    const people = await tracker.people(ws, instrument.id, { ...f, sort: null }, keys);
    const minutes = new Map((await results.people(ws, instrument.id, f)).map((p) => [p.id, p.minutesToSubmit]));
    return {
      preamble,
      header: [C.respondent, ...fields.map((s) => s.label), ...stated([C.status, C.sinceSubmit, C.answered, C.visible]), ...only([C.submittedAt]), ...stated([C.minutes]), ...only([C.source, C.reminders]), C.withComment],
      rows: people.map((p) => {
        const m = minutes.get(p.id);
        return [name(p), ...keys.map((k) => p.fields[k] ?? ""), ...stated<string | number>([EXPORT_COPY.statuses[p.status], since(p), p.answered, p.visible]), ...only([isoUtc(p.submittedAt)]), ...stated<string | number>([m ?? ""]), ...only<string | number>([EXPORT_COPY.sources[p.source], p.reminders ?? ""]), p.withComment];
      }),
    };
  }

  const keys = fields.map((s) => s.key);
  const missing = await registers.missing(ws, instrument.id, { ...f, sort: null }, keys, method);
  return {
    preamble,
    header: [C.suggested, C.suggestedArea, C.suggestedValue, C.suggestedLabel, C.respondent, ...fields.map((s) => s.label), ...stated([C.status, C.sinceSubmit])],
    rows: missing.map((m) => [m.text, m.area ?? "", m.value ?? "", label(m.value), name(m), ...keys.map((k) => m.fields[k] ?? ""), ...stated([m.submitted ? EXPORT_COPY.statuses.submitted : EXPORT_COPY.statuses.inProgress, since(m)])]),
  };
}
