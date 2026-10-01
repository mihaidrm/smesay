# Object model (draft, Setup)

Workspace        organisation: members, billing, AI budget, branding defaults
Project          one validation effort; holds requirement sets and instruments
RequirementSet   imported items, versioned; each item: original text, source ref, area,
                 proposed value (optional), custom fields
Instrument       a presentation of one set version: grouping, order, scoring method, template,
                 intro, respondent fields, closing questions, whether the proposed value is shown
Invite           a link: public token or personal per email; open/close dates; passcode; revoked
Response         one respondent's session against one instrument: fields, answers, progress,
                 sign-off, submitted_at
Answer           per item: value, reason, question, comment
Insight          a generated action on a project with the responses it cites

Rules
- Every table carries workspace_id or is reachable only through a table that does.
- Item text is never overwritten; reader versions live beside the original.
- Responses reference the set version they were given, so re-runs on a new version compare.
