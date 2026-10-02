// TypeScript twins of the INTERFACES.md jsonb shapes (section "Schema v1 enums and shapes").
// Change INTERFACES.md first, then this file. The enum arrays live in schema.ts.
export type RespondentFieldSpec = { key: string; label: string; type: "text" | "dropdown"; mandatory: boolean; options?: string[] };
export type ClosingSpec = { confidence: true; missingForm: boolean; signOffText: string };
export type ImportReport = { emptyRows: number; exactDuplicates: number; overLimit: number; rowsRead: number; headerRow: number };
export type ItemFlags = { duplicateOf?: string; ambiguity?: string; dismissed?: boolean };
export type ResponseFields = { [key: string]: string };
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
