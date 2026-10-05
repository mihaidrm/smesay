// TypeScript twins of the INTERFACES.md jsonb shapes (section "Schema v1 enums and shapes").
// Change INTERFACES.md first, then this file. The enum arrays live in schema.ts.
// E5-1: email is a field type (the receipt goes only to a personal invite's address from
// E7-5, docs/copy/emails.md, 4); the rule on labels, keys and options is in
// src/lib/respondent-fields.ts (INTERFACES.md).
export type RespondentFieldSpec = { key: string; label: string; type: "text" | "dropdown" | "email"; mandatory: boolean; options?: string[] };
// E5-5: the closing question is optional; "" for signOffText means the default sentence
// (src/lib/closing.ts); confidence is always asked.
export type ClosingSpec = { confidence: true; missingForm: boolean; signOffText: string; closingQuestion?: string };
// E5-2: the PM's labels for a scale's values, keyed by the value code (M, S, C, W; 1 to 5;
// K, C, D), each up to 20 characters; a code not present keeps the default label
// (src/lib/scoring.ts). Null on the row means every default.
export type ScaleLabels = { [code: string]: string };
// The check before import (stories/E3-5): counts over the data rows, headerRow 0 when the
// file had none, the folded duplicates by reference (E3-3's unrecognised values too).
export type ImportReport = { emptyRows: number; exactDuplicates: number; overLimit: number; rowsRead: number; headerRow: number; unrecognisedValues: number; duplicateRefs: { kept: string; folded: string[] }[] };
// foldedRefs (E3-5): the references of the exact duplicates folded into this item at import.
// areaBy (E4-2): who put the item in its area, "ai" (the model; a re-run places it again) or
// "pm" (a move; a re-run leaves it); absent, the area came with the import. importedArea
// (E4-2): the area the item came with, kept from the first run on, whatever happens to
// item.area. duplicateOf and the refs in it are item positions in the set, as strings (E4-4
// shows the source reference).
export type ItemFlags = { duplicateOf?: string; ambiguity?: string; dismissed?: boolean; foldedRefs?: string[]; areaBy?: "ai" | "pm"; importedArea?: string };
// ShapeArea (E4-2, item_set.areas): an area in the model's order with its rationale.
export type ShapeArea = { name: string; rationale: string };
// ProjectContext (E4-5, item_set.context_used): the goal and the terms a run was given,
// null fields when the project had none.
export type ProjectContext = { goal: string | null; terms: string | null };
export type ResponseFields = { [key: string]: string };
// Column roles of an import (stories/E3-3): one column is the item text, at most one each the
// area, the proposed value and the reference, up to five custom fields, the rest not imported.
// A ColumnMapping is keyed by the column's header (its letter when the file has no header).
export type ScoringMethod = "moscow" | "fit" | "kcd";
// The respondent journey's shape (decision 0016; INTERFACES.md Layout): one area per screen,
// one item per screen, or every area on one page.
export type Layout = "chapters" | "item" | "page";
// The four answers and the rate-blind pick (decisions 0014, 0018; INTERFACES.md AnswerKind).
export type AnswerKind = "agree" | "change" | "disagree" | "unclear" | "pick";
export type ColumnRole = "text" | "area" | "value" | "ref" | "custom" | "skip";
export type ColumnMapping = { [column: string]: ColumnRole };
// What the server found in an upload (stories/E3-2): the sheets, the chosen sheet, the header
// row (1-based, null when none qualified), the columns with their letters and names, the first
// ten data rows, the number of data rows.
export type UploadPreview = {
  sheets: string[];
  sheet: string | null;
  headerRow: number | null;
  columns: { letter: string; name: string }[];
  rows: string[][];
  rowsRead: number;
};

export type MemberRole = "owner" | "member";
export type PlanKey = "free" | "pro" | "team" | "enterprise";

// The workspace id the query helpers take: a branded string that only src/lib/workspace.ts
// produces from the session (stories/E1-3). A plain string from a URL or a body does not fit.
declare const workspaceIdBrand: unique symbol;
export type WorkspaceId = string & { readonly [workspaceIdBrand]: true };
// E8-1: the PM's choices on Results, per instrument id (INTERFACES.md ResultsPrefs): the tiles
// (ids of src/lib/results-tiles.ts, up to six), the include-unsubmitted switch and the
// Agreement tab's view (E8-3). Read through src/lib/results-tiles.ts storedTiles, which drops
// anything else.
export type ResultsPrefs = { [instrumentId: string]: { tiles?: string[]; includeUnsubmitted?: boolean; view?: "table" | "columns" | "share" } };

// E9-1: the four kinds of action the model returns (INTERFACES.md, InsightOutput); the
// check constraint on insight.kind (src/db/schema.ts) uses the same list.
// E9-2: an action is open, done or dismissed (insight.state).
export const INSIGHT_STATES = ["open", "done", "dismissed"] as const;
export type InsightState = (typeof INSIGHT_STATES)[number];
export const INSIGHT_KINDS = ["rewrite", "conflict", "followUp", "coverage"] as const;
export type InsightKind = (typeof INSIGHT_KINDS)[number];

// E10-1: the CSV files of the Export tab; E10-2 adds the whole project (JSON). Every one is a
// kind of download in export_log.file; E10-3 adds the PDF.
export const CSV_FILES = ["answers", "items", "people", "missing"] as const;
export type CsvFile = (typeof CSV_FILES)[number];
export const EXPORT_FILES = [...CSV_FILES, "project", "summary", "workspace"] as const;
export type ExportFile = (typeof EXPORT_FILES)[number];

// The admin funnel's steps, in order (stories/E13-2): event names of the catalogue
// (src/lib/analytics-catalogue.ts), from sign-up to an export.
export const FUNNEL_STEPS = ["signed_up", "workspace_created", "project_created", "import_committed", "instrument_published", "invite_sent", "link_opened", "response_started", "response_submitted", "export_downloaded"] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

// Proof that the caller checked the admin rule (src/lib/admin.ts requireAdmin): every
// cross-workspace read in src/db/queries/admin.ts takes one, so a page or route that forgot
// the check does not compile (stories/E13-2, E14-1).
export type AdminProof = { readonly checked: "admin" } & { readonly __brand: "AdminProof" };
