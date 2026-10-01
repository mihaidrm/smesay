# Interfaces between components

Add an entry whenever two builders depend on each other. Each entry: owner, consumer, shape,
version, date. Change the shape here first, then the code.

## Response schema (runtime -> dashboard, runtime -> exports)
Owner: runtime. Consumers: dashboard, exports, offline import.
Status: to be written in Setup after docs/schema.md is approved.

## AI shaping output (ai -> builder)
Owner: ai route. Consumer: builder review view.
Status: JSON schema in evals/schema.json, to be written with E4.
