# 0057 "Validation" replaces "instrument" in everything a person reads, 2026-10-05

Mihai, 2026-10-05: "Another thing throughtout the app -- the word instrument sounds weird -
find something more friendly and simple to call".

Claude took the word under decision 0044 and recorded it in docs/review-list.md.

Decision: the thing the PM builds on Build, publishes on Share and respondents answer is a
"validation" wherever a person reads it: the app's screens and messages, the admin pages, the
sample at /sample ("Sample validation"), the guide and the quickstart, the export files' notes,
the visit-count goal ("First validation published"), the legal pages, docs/copy and the PM
board. The product already speaks of it that way: the quickstart says "Your first validation
in four steps" and the privacy policy says "those who use SMEsay to run a validation".

Rejected: "survey", because decision 0010 says SMEsay is "a list with reasons, not a survey
tool", and the landing page compares SMEsay with a survey form; "review", because respondents
already read "No items to review." on the Wrap up; "questionnaire", for the same reason as
survey and its length.

Scope: "instrument" stays the word in the code (types, tables, columns, functions, routes,
test ids), the schema, INTERFACES.md, the stories and the planning boards (the epic is still
"E5 Instrument builder"), where it names the same thing for people who build SMEsay. Renaming
the table and the code would touch every query and migration for no change a user sees.
docs/retired-terms.md does not list it, since the scan reads the stories and INTERFACES.md.

Consequences: WRITING.md has the rule. 33 strings changed in src, plus the tests and docs that
quote them; the visit-count goal is set up in Plausible at the launch gate under its new name
(docs/accounts.md).
