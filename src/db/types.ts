// TypeScript twins of the INTERFACES.md jsonb shapes (section "Schema v1 enums and shapes").
// Change INTERFACES.md first, then this file. The enum arrays live in schema.ts.
export type RespondentFieldSpec = { key: string; label: string; type: "text" | "dropdown"; mandatory: boolean; options?: string[] };
export type ClosingSpec = { confidence: true; missingForm: boolean; signOffText: string };
export type ImportReport = { emptyRows: number; exactDuplicates: number; overLimit: number; rowsRead: number; headerRow: number };
export type ItemFlags = { duplicateOf?: string; ambiguity?: string; dismissed?: boolean };
export type ResponseFields = { [key: string]: string };
