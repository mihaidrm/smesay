# 0053 Running text in full sentences; questions as questions, 2026-10-05

Mihai, 2026-10-05, in two messages (as recorded in the session that made this change): the
sample's intro "Six things the new tool should do, in three chapters." is not how people
speak; normal speech is "The new tool should do six things, in three chapters." And the
privacy link "How your answers are used" should be the question "How are your answers used?".
He then approved the sweep as "prose only" and approved changing the AI prompt ("change the
AI prompt").

Decision: running text is written in full sentences with a subject and a verb, in normal word
order, and a question to the reader is written as a question. This covers intros,
descriptions, explanations, email bodies and preheaders, the robot's lines, errors of more
than one sentence, and clauses that stand alone as a sentence or as a label addressed to the
reader. These stay as they are: short empty states ("No projects yet."), toasts ("Link
revoked."), limit hints ("Up to 20 characters.", "One item per row."), short statuses ("Not
published yet.", "Reminded 3 days ago."), stat lines ("3 still to finish."), short errors,
headings, titles, table cells (the landing compare grid stays), labels with a colon ("Out of
scope: ..."), the tagline "What the SMEs say." (decision 0005) and section titles that name a
thing ("What you get back", "How confident respondents are").

The AI prompt: the Shape prompt (src/lib/ai/prompts/shape.ts) no longer asks for an area
rationale "in the form: First, because ... / Then, ... / Last, ..."; it asks for one full
sentence with a subject and a verb that says why the area sits where it does, such as "This
comes first, because every claim starts here." The schema's example (src/lib/ai/shape-schema.ts,
evals/schema.json) says the same. Nothing else in the prompt changed. No model was called for
this change (decision 0039): Mihai runs `npm run evals` before the next real Shape use.

Consequences: WRITING.md has the rule. The strings changed in the code, docs/copy/ (landing,
app, emails, errors, guide), docs/legal/subprocessors.md, the stories that quote them, the
prototype-01 boards and email samples, and the tests. docs/retired-terms.md retires "How your
answers are used". The judgement calls are rows of docs/review-list.md dated 2026-10-05.
