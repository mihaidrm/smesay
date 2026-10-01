# 0011 AI context: a text field in R1, file upload in R2, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01, on Claude's recommendation.

1. E4 gets one more story: a "Project context" field on the project with three parts, the goal
   (one or two sentences), the domain and audience, and a glossary of terms to keep as written.
   Capped at a few thousand characters. Passed as data to the E4 shaping prompts and the E9
   insight prompts. Shown once on the shaping screen so the PM knows it was used. The golden
   set gets two specs with a context block, to prove it changes grouping and keeps glossary terms.

2. No file upload for AI context in R1. Reasons: every run would carry the attached pages
   against a workspace budget capped at EUR 50 per month; E3 parses xlsx and csv only, and PDF
   or docx extraction is its own pipeline; a document is a larger prompt injection surface than
   one bounded field (SECURITY.md, AI); two inputs make the "items invented" eval much harder;
   and a brief invites "add what the brief mentions", which conflicts with "model may not add
   items".

3. R2 candidate, if PMs paste long text into the field: file upload with extraction, a page cap
   per file, a token cap per run, and "gaps against the brief" as its own story with its own
   eval.

Consequence: stories/backlog.md E4 line updated the same day.
