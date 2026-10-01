# Interfaces between components

Add an entry whenever two builders depend on each other. Each entry: owner, consumer, shape,
version, date. Change the shape here first, then the code.

## Schema v1 enums and shapes (database -> every epic)
Owner: E1-2. Consumers: every query helper, the builder, the respondent app, the dashboard,
exports. Written before the migration is generated (stories/E1-2-schema-v1.md).
Status: to be written in E1-2. Names fixed now so stories can refer to them:
AnswerKind (agree, change, disagree, unclear, pick; decisions 0014, 0018), ScoringMethod
(moscow, fit, kcd), Layout (chapters, item, page; decision 0016), InviteKind (public, personal),
ReaderStatus (suggested, accepted, rejected), InsightState (open, done, dismissed),
RespondentFieldSpec (name, type text or dropdown, mandatory, options), ImportReport (empty rows,
exact duplicates, items over 1,000 characters).

## Response schema (runtime -> dashboard, runtime -> exports)
Owner: runtime. Consumers: dashboard, exports, offline import.
Status: to be written in E7, on top of the E1-2 shapes.

## AI shaping output (ai -> builder)
Owner: ai route. Consumer: builder review view.
Status: JSON schema in evals/schema.json, to be written with E4.
