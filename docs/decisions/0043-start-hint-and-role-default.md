# 0043 The hint under Start names the required fields; Role starts as a text field, 2026-10-03

Design note 38 raised two questions from building E5-1. Mihai: "regarding the 2 decisions,
going with your recommendation."

Decision 1: the hint under a disabled Start reads "Fill in your name and role to start." (the
respondent board's line) only while the required fields are exactly Name and Role. With any
other set of required fields (a field renamed, Role made optional, a required Team added),
it reads "Fill in the required fields to start." The rule is startHint() in
src/lib/respondent-fields.ts, keyed on the field keys `name` and `role`.

Decision 2: a new instrument's Role field is a text field, required, like Name. The board's
dropdown with roles stays on the sample, whose roles are known; a PM turns Role into a
dropdown by picking the type and typing the roles.

Consequences: src/components/respondent/about-you.tsx uses startHint(); stories E5-1 and E7-1,
docs/copy/app.md, docs/copy/errors.md and design note 38 point here.
