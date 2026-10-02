# Interfaces between components

Add an entry whenever two builders depend on each other. Each entry: owner, consumer, shape,
version, date. Change the shape here first, then the code.

## Schema v1 enums and shapes (database -> every epic)
Owner: E1-2. Consumers: every query helper, the builder, the respondent app, the dashboard,
exports. Written before the migration is generated (stories/E1-2-schema-v1.md).
Version 1, 2026-10-01. The code twin is src/db/schema.ts (the arrays are exported from there and
the check constraints use them). Change this file first.

- AnswerKind: agree, change, disagree, unclear, pick (decisions 0014, 0018). `pick` is the
  rate-blind answer: a value with no proposal to agree with.
- ScoringMethod: moscow, fit, kcd.
- Layout: chapters, item, page (decision 0016).
- InviteKind: public, personal.
- ReaderStatus: suggested, accepted, rejected (E4; an item imported without AI has null).
- InsightState: open, done, dismissed.
- MemberRole: owner, member.
- ItemSetSource: xlsx, csv, pasted.
- AiPurpose: shape, insights.
- RespondentFieldSpec (jsonb, instrument.respondent_fields, array):
  { key: string, label: string, type: "text" | "dropdown", mandatory: boolean, options?: string[] }
- ClosingSpec (jsonb, instrument.closing):
  { confidence: true, missingForm: boolean, signOffText: string }
- ImportReport (jsonb, item_set.import_report):
  { emptyRows: number, exactDuplicates: number, overLimit: number, rowsRead: number, headerRow: number }
- ItemFlags (jsonb, item.flags): { duplicateOf?: string, ambiguity?: string, dismissed?: boolean }
- ResponseFields (jsonb, response.fields): { [key: string]: string }, keys from RespondentFieldSpec.

## Response schema (runtime -> dashboard, runtime -> exports)
Owner: runtime. Consumers: dashboard, exports, offline import.
Status: to be written in E7, on top of the E1-2 shapes.

## AI shaping output (ai -> builder)
Owner: ai route. Consumer: builder review view.
Status: JSON schema in evals/schema.json, to be written with E4.
