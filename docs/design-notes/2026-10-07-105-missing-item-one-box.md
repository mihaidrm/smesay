# 105 The missing-item box, 2026-10-07

Decision 0060 (Mihai: "just have 1 bigger box and give users freedom to write").

The form keeps its legend, "Is anything missing from the list? Optional.", and one label, "What
is missing?". The field is the closing question's textarea (the same FIELD class, `h-auto
py-3`) at five rows, 2,000 characters, with a muted 13 px hint under it, "More than one thing?
Put each on its own line.", tied to the box by aria-describedby. Line breaks survive the save
(the text is stored as typed, trimmed at the ends) and the register shows them with
whitespace-pre-line; the PDF and the CSV carry them as text.

Checked everywhere (decision 0056): the live link, the Build preview and the sample's Wrap up
share src/components/respondent/wrap-up.tsx; the respondent board's Wrap up already had one
textarea (docs/design-notes/prototype-01/respondent-generator.py), so the boards stand.
