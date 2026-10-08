# E9-1 Generate actions from the responses, each citing the answers behind it

User: a PM who wants to know what to do next
Status: built
Outcome: a short list of actions written from the answers; every action names the responses
it comes from; an action without a citation is never shown.

## Acceptance criteria
1. Actions tab (PM app board): "Write actions" (and "Write again"); each action has a title,
   the reason in one or two sentences, and the citations as "[Name] and [Name] on [REF]" or
   "[Name], missing item", each citation linking to the item detail (E8-5).
2. The model receives the items, the registers (pushed back, disagree, unclear, missing) and
   the project context (E4-5) as data, and returns actions of four kinds: items to rewrite,
   group conflicts, follow-ups (open questions), low-coverage areas. Output validated against
   a JSON schema; a cited answer or missing-item id that does not exist drops the action
   (SECURITY.md, AI).
3. An action without at least one valid citation is dropped before display (business plan
   E9); a test feeds an uncited action and sees it gone.
4. Actions are stored as insight rows with cited_answer_ids, model, tokens and cost
   (docs/schema.md); a second run replaces open actions, keeps done and dismissed (E9-2), and
   logs an ai_run with purpose insights.
5. A small eval set in evals/insights/ (two invented response sets with the expected action
   kinds) runs with E4-6's runner; passing means every expected kind appears and no action is
   uncited.
6. Playwright: on a PM's project with answers (the sample is read-only, acceptance 7), Write
   actions (fake transport in test mode returns four actions), see four actions with
   citations.
7. On the sample (E8-8, acceptance 1), the Actions tab shows its seeded actions (insight rows
   with model "sample") with their citations, read-only like every step of the sample: no
   Write actions, so no model call. Added 2026-10-04 (decision 0044) after E8-8's check.

## Out of scope
- Editing an action's text: R2.

## Open questions
- None.

## Technical notes
Prompt in src/lib/ai/prompts/insights.ts. Citations are two lists: answer ids in
insight.cited_answer_ids and missing-item ids in insight.cited_missing_item_ids (uuid[], added
in migration 0021 by this story; decision 0033). INTERFACES.md gets InsightOutput with both
before the first run. The four seeded actions (E1-4) are the fixture for tests; the seed fills
the fourth action's missing-item citation once the column exists.

Built 2026-10-04 (design note 66, decision 0044):
- Acceptance 1: the Actions tab (results/actions-tab.tsx): Write actions, Write again once
  there are actions (write-actions.tsx, a form on writeActionsAction with Try again for a
  failed or unusable answer); each action shows its kind, title, why, and the citations from
  citationLines (src/lib/insights.ts): "[Name] and [Name] on [REF]" (an item with no
  reference by its text in quotes) linking to the item's detail (E8-5), and "[Name], missing
  item". Open first, then done and dismissed.
- Acceptance 2: buildActionsPrompt (src/lib/ai/prompts/insights.ts, a .ts module as the
  shaping prompt is) sends the project context, the scale, the items with
  their counts, the respondents by their dropdown fields (no name or email), the answers
  with a reason or a question and the missing items, each by a ref (I, R, A, M); the output
  is InsightOutput (src/lib/ai/insights-schema.ts, INTERFACES.md) with four kinds; an action
  citing a ref that was not sent is dropped (keptActions).
- Acceptance 3: an action citing nothing is dropped; src/lib/insights.test.ts feeds one
  uncited and one citing an unknown ref and sees four of six kept.
- Acceptance 4: insight rows with kind, cited_answer_ids, cited_missing_item_ids (migration
  0021, not 0002 as the notes said), the model and each action's share of the run's tokens
  and cost; insights.replaceOpen keeps done and dismissed (tested); the ai_run has purpose
  insights. A run that keeps no action leaves the open ones as they are.
- Acceptance 5: evals/insights/ holds two invented response sets (a dental clinic, a food
  bank) with the expected kinds; `npm run evals -- insights` runs them through the same
  prompt and client (evals/insights.ts); evals/insights.test.ts proves pass and fail with a
  fake fetch. The real run is Mihai's (decision 0039).
- Acceptance 6: e2e/actions.spec.ts publishes a list, submits one response with a reason
  and a missing item, writes actions with the fake transport (four kept of five), checks the
  kinds, the citations and the link to the detail, and Write again.
- Acceptance 7: the sample shows its four seeded actions with their kinds and citations (the
  fourth cites the missing item now) and no Write actions; writeActions refuses the sample.


Amended 2026-10-07 (stories/E4-8, design note 113, decision 0044): the Actions tab says
"Actions are written from submitted answers. [S] of [R] responses are submitted." above the
button while no response is submitted, "No AI run on this project yet." under the actions
until the first answered run, and "These actions came from the stand-in, not the AI." when
that run was the developer menu's stand-in; a refusal shows in the danger tint with an alert
icon; while a run is pending the thinking state shows under the button with the tab's
counts. On a local checkout Write actions goes to the stand-in unless the menu says
otherwise; Playwright keeps "real", which is the stand-in server.

Amended 2026-10-08 (design note 123, decision 0044; Mihai: "If 100 ppl answer and just 1
doesnt agree with something doesnt mean we make it as an action item"): an action also needs
enough people behind it, at least one in ten of those who answered the item it cites (one
when ten or fewer answered; a missing item against everyone who submitted; both groups for
Groups disagree). The prompt says the number per item and the app drops an action below the
line (src/lib/insights.ts supportedActions, tested); the evals runner applies the same line.
The tab shows the actions under one tab per kind (Follow up, Rewrite, Groups disagree,
Coverage; src/components/app/tabs.tsx) and explains the rule under "How actions are chosen".

