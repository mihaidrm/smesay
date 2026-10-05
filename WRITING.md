# Writing rules

Apply to UI copy, emails, docs, error messages, commit messages and comments.

- First sentence is the point. No "Here's", no restating the question, no preamble.
- Never use: honestly, genuinely, worth noting, I want to flag, for what it's worth, let me,
  here's the thing, seamless, leverage, empower, unlock, elevate, robust, cutting-edge.
- No em dashes. Use periods, commas, colons or parentheses.
- Headers are two or three word labels. Never a sentence, never a verdict.
- No paragraph starts with a bold label and a colon.
- No horizontal rules. No emoji. Tables only for real multi-row, multi-column data.
- End when the point is made. No closing question or offer unless the next step needs an answer.
- Hedge only the specific claim that is uncertain. State certain things as certain.
- Every paragraph adds a fact, number, command or trade-off. Delete summarising paragraphs.
- Do not narrate ("I'll push back", "let me explain"). Just do it.
- UI copy: verbs on buttons ("Publish", not "OK"), one idea per sentence, error messages say
  what happened and what to do next, never "something went wrong".
- Running text is written in full sentences with a subject and a verb, in normal word order:
  "The new tool should do six things", not "Six things the new tool should do". A question to
  the reader is written as a question ("How are your answers used?"), not as a clause.
  Exceptions: headings, labels, buttons, table cells, short statuses, empty states, toasts and
  limit hints (decision 0053).

The scan script (`npm run scan:copy`) fails a build on em dashes and the banned words above.
