# 0060 The missing-item form is one text box, 2026-10-07

Mihai, 2026-10-07, on the sample's Wrap up: "instead of having these 3 fields maybe just make
one comment box and allow users to text with bullet points or numbers just in case they have
more things to add. so instead of 3 fields just have 1 bigger box and give users freedom to
write".

Decision:
- The Wrap up's "Is anything missing from the list?" asks one question, "What is missing?", in a
  five-line box of up to 2,000 characters (was 500 in one line), with the hint "More than one
  thing? Put each on its own line." Line breaks are kept and shown in the register, the PDF
  and the CSV.
- "Where does it belong?" and "How important is it?" are gone, on the live link and in the
  Build preview. Migration 0036 drops suggested_area and suggested_value from missing_item;
  the register, the Missing items CSV, the PDF register, the Whole project JSON and the Write
  actions prompt lose the two columns. A JSON file exported before today still imports: the
  two keys are read and dropped.
- The Closing card's line reads "On: respondents write what the list lacks in their own words,
  with room for a list."

Why: three fields ask the respondent to classify before they have said what they mean; a
box with room for a list gets more said. The PM reads the text; an area and a priority are
the PM's call on the Results page.

Consequences: INTERFACES.md (WrapValue, the wrap and submit bodies, registers.missing, the JSON
file); docs/copy/app.md and errors.md; stories E7-5, E8-4 and E10-1; design note 105;
docs/schema.md from the snapshot; src/lib/respondent-submit.test.ts, wrap-queue.test.ts,
results.test.ts, insights.test.ts, files.test.ts; e2e/respondent-submit.spec.ts. Mihai runs
`npm run db:migrate` after pulling.
