# E9-1 Generate actions from the responses, each citing the answers behind it

User: a PM who wants to know what to do next
Status: ready
Outcome: a short list of actions written from the answers; every action names the responses
it comes from; an action without a citation is never shown.

## Acceptance criteria
1. Actions tab (PM app board): "Write actions" (and "Write again"); each action has a title,
   the reason in one or two sentences, and the citations as "[Name] and [Name] on [REF]" or
   "[Name], missing item", each citation linking to the item detail (E8-5).
2. The model receives the items, the registers (pushed back, disagree, unclear, missing) and
   the project context (E4-5) as data, and returns actions of four kinds: items to rewrite,
   group conflicts, follow-ups (open questions), low-coverage areas. Output validated against
   a JSON schema; a cited answer id that does not exist drops the action (SECURITY.md, AI).
3. An action without at least one valid citation is dropped before display (business plan
   E9); a test feeds an uncited action and sees it gone.
4. Actions are stored as insight rows with cited_answer_ids, model, tokens and cost
   (docs/schema.md); a second run replaces open actions, keeps done and dismissed (E9-2), and
   logs an ai_run with purpose insights.
5. A small eval set in evals/insights/ (two invented response sets with the expected action
   kinds) runs with E4-6's runner; passing means every expected kind appears and no action is
   uncited.
6. Playwright: on the seeded project, Write actions (fake transport in test mode returns the
   four seeded actions), see four actions with citations.

## Out of scope
- Editing an action's text: R2.

## Open questions
- None.

## Technical notes
Prompt in src/lib/ai/prompts/insights.md; the citation ids are answer ids and missing_item
ids; INTERFACES.md gets InsightOutput before the first run. The four seeded actions (E1-4)
are the fixture for tests.
