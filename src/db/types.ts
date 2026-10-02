// TypeScript twins of the INTERFACES.md jsonb shapes (section "Schema v1 enums and shapes").
// Change INTERFACES.md first, then this file. The enum arrays live in schema.ts.
export type RespondentFieldSpec = { key: string; label: string; type: "text" | "dropdown"; mandatory: boolean; options?: string[] };
export type ClosingSpec = { confidence: true; missingForm: boolean; signOffText: string };
// The check before import (stories/E3-5): counts over the data rows, headerRow 0 when the
// file had none, the folded duplicates by reference (E3-3's unrecognised values too).
export type ImportReport = { emptyRows: number; exactDuplicates: number; overLimit: number; rowsRead: number; headerRow: number; unrecognisedValues: number; duplicateRefs: { kept: string; folded: string[] }[] };
// foldedRefs (E3-5): the references of the exact duplicates folded into this item at import.
// areaBy (E4-2): who put the item in its area, "ai" (the model; a re-run places it again) or
// "pm" (a move; a re-run leaves it); absent, the area came with the import. duplicateOf and
// the refs in it are item positions in the set, as strings (E4-4 shows the source reference).
export type ItemFlags = { duplicateOf?: string; ambiguity?: string; dismissed?: boolean; foldedRefs?: string[]; areaBy?: "ai" | "pm" };
// ShapeArea (E4-2, item_set.areas): an area in the model's order with its rationale.
export type ShapeArea = { name: string; rationale: string };
export type ResponseFields = { [key: string]: string };
// Column roles of an import (stories/E3-3): one column is the item text, at most one each the
// area, the proposed value and the reference, up to five custom fields, the rest not imported.
// A ColumnMapping is keyed by the column's header (its letter when the file has no header).
export type ScoringMethod = "moscow" | "fit" | "kcd";
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
