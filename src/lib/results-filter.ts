// The one filter of Results (stories/E8-1, acceptance 3 and 7; INTERFACES.md ResultsFilter):
// every tile, tab, register, detail and export takes it, so a filtered screen still adds up
// to the CSV. It travels in the URL, so a view can be shared within the workspace; this
// module is the one place it is read from the URL and written back, against the
// instrument's respondent fields and perspectives (a key, a value or a name the instrument
// does not have is dropped, never passed to a query). No database here.
//
// What it selects (decision 0044, docs/review-list.md): people, as the Responses tab lists
// them (stories/E8-2, acceptance 2). A field filter matches a person's About you values; a
// dropdown field takes any of the chosen options, a text field the words it contains. The
// answer-kind filter keeps a person with at least one answer of a chosen kind, or with "Not
// answered" at least one item they see and did not answer; the comment filter a person with
// at least one answer with a reason or comment (with a kind chosen too, an answer of that
// kind). Every number is then counted over the answers of the people kept.
//
// URL: f.[key] per field (repeated for a dropdown's options), kind (repeated), comment=1,
// perspective, status (repeated), unsubmitted=1 or 0 (absent: the PM's stored choice), and
// the table's sort, sort=[column]&dir=asc or desc (E8-2; each table checks the column against
// its own list, so the sort never narrows anything and is no filter).
import type { RespondentFieldSpec } from "@/db/types";

export const RESULTS_KINDS = ["agree", "change", "disagree", "unclear", "pick", "none"] as const;
export type ResultsKind = (typeof RESULTS_KINDS)[number];
export const RESULTS_STATUSES = ["submitted", "inProgress"] as const;
export type ResultsStatus = (typeof RESULTS_STATUSES)[number];

// The names of the answer kinds on Results (decision 0014; design note 40): "Pushed back" is
// not a label anywhere on Results. "Rated" is a value picked with no proposal shown (E5-2).
export const KIND_LABELS: Record<ResultsKind, string> = {
  agree: "Agree",
  change: "Different priority",
  disagree: "Disagree",
  unclear: "Unclear",
  pick: "Rated",
  none: "Not answered",
};
export const STATUS_LABELS: Record<ResultsStatus, string> = { submitted: "Submitted", inProgress: "In progress" };

export type ResultsFilter = {
  // A dropdown field's chosen options, or the words a text field contains.
  fields: Record<string, string[] | string>;
  kinds: ResultsKind[];
  withComment: boolean;
  perspective: string | null;
  status: ResultsStatus[];
  includeUnsubmitted: boolean;
  // The table's sort (E8-2): a column key in a safe shape; each table maps it to SQL from its
  // own list, never from the URL.
  sort: ResultsSort | null;
};
export type ResultsSort = { key: string; dir: "asc" | "desc" };
const SORT_KEY = /^[a-z][a-zA-Z0-9._-]{0,60}$/;

export type FilterContext = { fields: RespondentFieldSpec[]; perspectives: string[] };
export type SearchParams = Record<string, string | string[] | undefined>;

// The longest text a text-field filter keeps (a search, not a value).
export const FILTER_TEXT_MAX = 100;

const all = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const first = (v: string | string[] | undefined): string | undefined => all(v)[0];
const unique = <T,>(xs: T[]): T[] => [...new Set(xs)];

// The filter in the URL, against the instrument; `stored` is the PM's include-unsubmitted
// choice when the URL does not say (default on, decision 0030).
export function parseResultsFilter(params: SearchParams, ctx: FilterContext, stored: boolean | null = null): ResultsFilter {
  const fields: ResultsFilter["fields"] = {};
  for (const spec of ctx.fields) {
    const raw = params[`f.${spec.key}`];
    if (spec.type === "dropdown") {
      const picked = unique(all(raw).filter((v) => (spec.options ?? []).includes(v)));
      if (picked.length > 0) fields[spec.key] = picked;
    } else {
      const text = (first(raw) ?? "").trim().slice(0, FILTER_TEXT_MAX);
      if (text) fields[spec.key] = text;
    }
  }
  const kinds = unique(all(params.kind).filter((k): k is ResultsKind => (RESULTS_KINDS as readonly string[]).includes(k)));
  const status = unique(all(params.status).filter((s): s is ResultsStatus => (RESULTS_STATUSES as readonly string[]).includes(s)));
  const perspective = first(params.perspective) ?? null;
  const unsubmitted = first(params.unsubmitted);
  return {
    fields,
    // In the catalogue's order, so a URL written in another order reads the same.
    kinds: RESULTS_KINDS.filter((k) => kinds.includes(k)),
    withComment: first(params.comment) === "1",
    perspective: perspective !== null && ctx.perspectives.includes(perspective) ? perspective : null,
    status: RESULTS_STATUSES.filter((s) => status.includes(s)),
    includeUnsubmitted: unsubmitted === "1" ? true : unsubmitted === "0" ? false : (stored ?? true),
    sort: sortOf(first(params.sort), first(params.dir)),
  };
}

function sortOf(key: string | undefined, dir: string | undefined): ResultsSort | null {
  if (!key || !SORT_KEY.test(key)) return null;
  return { key, dir: dir === "desc" ? "desc" : "asc" };
}

// Whether anything narrows the people (the include-unsubmitted switch is not a filter).
export function filterActive(f: ResultsFilter): boolean {
  return Object.keys(f.fields).length > 0 || f.kinds.length > 0 || f.withComment || f.perspective !== null || f.status.length > 0;
}

// The URL query of a filter (without the leading "?"), in a fixed order so equal filters
// write equal URLs. `unsubmitted` is always written, so a shared view counts the same answers
// for whoever opens it, whatever their own stored choice. `extra` keeps other parameters of
// the page (the tab).
export function filterQuery(f: ResultsFilter, ctx: FilterContext, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(extra)) q.append(k, v);
  for (const spec of ctx.fields) {
    const v = f.fields[spec.key];
    if (v === undefined) continue;
    for (const one of Array.isArray(v) ? v : [v]) q.append(`f.${spec.key}`, one);
  }
  for (const k of f.kinds) q.append("kind", k);
  if (f.withComment) q.append("comment", "1");
  if (f.perspective) q.append("perspective", f.perspective);
  for (const s of f.status) q.append("status", s);
  q.append("unsubmitted", f.includeUnsubmitted ? "1" : "0");
  if (f.sort) { q.append("sort", f.sort.key); q.append("dir", f.sort.dir); }
  return q.toString();
}

// The filter with nothing narrowing (Clear filters keeps the switch and the sort).
export const clearedFilter = (f: ResultsFilter): ResultsFilter => ({ fields: {}, kinds: [], withComment: false, perspective: null, status: [], includeUnsubmitted: f.includeUnsubmitted, sort: f.sort });

// The sort a column header links to: the column ascending, or descending when it is the
// current ascending sort.
export const nextSort = (current: ResultsSort | null, key: string): ResultsSort => (current?.key === key && current.dir === "asc" ? { key, dir: "desc" } : { key, dir: "asc" });

// "[FILTERS]" of "Showing [N] of [M] responses: [FILTERS]." (docs/copy/errors.md): each part
// named as the filter bar names it, parts joined by "; ".
export function describeFilter(f: ResultsFilter, ctx: FilterContext): string {
  const parts: string[] = [];
  for (const spec of ctx.fields) {
    const v = f.fields[spec.key];
    if (v === undefined) continue;
    parts.push(Array.isArray(v) ? `${spec.label}: ${v.join(", ")}` : `${spec.label} contains "${v}"`);
  }
  if (f.kinds.length > 0) parts.push(f.kinds.map((k) => KIND_LABELS[k]).join(", "));
  if (f.withComment) parts.push("With a reason or comment");
  if (f.perspective) parts.push(`Perspective: ${f.perspective}`);
  if (f.status.length > 0) parts.push(f.status.map((s) => STATUS_LABELS[s]).join(", "));
  return parts.join("; ");
}
