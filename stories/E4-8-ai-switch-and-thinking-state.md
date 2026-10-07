# E4-8 AI switch in a developer menu, the stand-in in the app, and a thinking state

User: Mihai on his local machine, trying Write actions and Shape without spending credits;
a PM waiting for a run
Status: built
Outcome: every AI call in a local or test build goes where a switch says (the stand-in,
the real model, or nowhere), the default on a fresh checkout spends nothing, every screen
says where its AI output came from, and a run in progress shows that the app is thinking.

## Acceptance criteria
1. A developer menu at the bottom of the sidebar, shown only when the server sees
   `SMESAY_DEV_MENU=1` or `NODE_ENV` is not "production" (docs/setup.md, .env.example);
   never in a production build without the variable. It holds "AI calls" with three choices,
   "Stand-in (free)", "Real (spends credits)" and "Off", and the workspace's AI usage this
   month as "[N] AI runs, EUR [x]" from usage() (E2-6). The choice is the cookie
   `smesay-ai-mode`, read on the server by src/lib/ai/mode.ts aiMode() inside runModel; when
   the chosen mode is not "real", the project header shows a pill beside the stepper, "AI:
   stand-in" or "AI: off".
2. Without the menu (production without the variable) the mode is always "real" and the
   cookie is ignored. With the menu and no cookie, the default is "stand-in" when NODE_ENV
   is not "production" and "real" otherwise (CI runs the production server against the
   stand-in server of e2e/fake-anthropic.mjs, which is free). A fresh local checkout never
   spends money until the switch is moved.
3. "Off" refuses every call before it is made, with the reason "off" and the sentence "AI is
   switched off in the developer menu. Switch it to Stand-in or Real to run this." on the
   Shape page and the Actions tab (docs/copy/errors.md). No ai_run row.
4. "Stand-in" answers in the process from src/lib/ai/stand-in.ts, the module
   e2e/fake-anthropic.mjs serves Playwright from, with the same answers for Shape (areas,
   readable versions, one ambiguity and one duplicate flag) and Write actions (four actions
   citing the first answers and the first missing item, a fifth citing a ref never sent).
   Neither ANTHROPIC_API_KEY nor ANTHROPIC_MONTHLY_BUDGET_EUR is needed for it. The run
   writes its ai_run row with model "stand-in" and zero cost. The Actions tab then says
   "These actions came from the stand-in, not the AI." and the Shape page "These areas and
   readable versions came from the stand-in, not the AI." while the project's last run of
   that kind is a stand-in run.
5. While a run is pending, under the button, the mascot in the "analysis" pose (56 px)
   beside one line that changes every 1.6 seconds through the steps the screen passes, with
   three pulsing dots after it (src/components/app/thinking.tsx, role="status",
   aria-live="polite"). Write actions: "Reading [N] items and [M] answers", "Looking for
   where people disagree", "Writing the to-do list". Shape: "Reading [N] items", "Grouping
   them into areas", "Writing a readable version of each". Under prefers-reduced-motion the
   first line stays and nothing pulses.
6. Every outcome of Write actions is visible: a refusal shows in the danger tint (coral soft,
   danger text, a 16 px alert icon); before any press, when the project has no submitted
   response, the tab says "Actions are written from submitted answers. [S] of [R] responses
   are submitted."; a run that keeps no action keeps its line; under the actions, "No AI run
   on this project yet." until the first answered run, then the Last run line (E9-3).
7. Tests: unit tests for mode.ts (the cookie and environment rules), stand-in.ts (the two
   answers keep their contract) and the "off" refusal; e2e/actions.spec.ts sees the thinking
   line while the stand-in server waits; e2e/dev-menu.spec.ts switches to Off, sees the
   refusal, switches to Stand-in, writes actions and sees the stand-in line.

## Out of scope
- A switch per workspace or per person: the cookie is per browser, for one developer.
- A stand-in that varies its answers by project: it answers from the refs it is sent.

## Open questions
- None.

## Technical notes
Mihai, 2026-10-07: "clicking write actions doesnt do anything (not sure if its because its
only one respondent) ... Need to also add nice animation there - saying we are thinking etc
... you need to put a feature flag on anything that can use AI credits while i am on the
local env. Like a debug menu i can turn on and off to use or not AI. And i think so far no
AI was used, or at least it doesnt show it anywhere." Design note 113.

The cookie is read with next/headers cookies() (node_modules/next/dist/docs/01-app/
03-api-reference/04-functions/cookies.md) and set by a server action, the only place a
cookie can be set. runModel takes the mode from deps.mode (tests, scripts/ai-smoke.ts and
evals/run.ts pass "real"), else "real" when a test passes its own fetch, else aiMode().
Outside a request (a script, a test) cookies() throws and aiMode() uses the default. In
stand-in mode the SDK gets a `fetch` that answers from the module (client.d.ts, the client
option fetch), the same way the unit tests swap the network out. The in-process stand-in
waits 2 seconds before answering (STAND_IN_DELAY_MS), so the thinking state can be seen on a
local machine; tests pass 0. e2e/fake-anthropic.mjs imports the .ts module through Node's
type stripping (nodejs.org/api/typescript.html, on by default from Node 22.18) and its
POST /delay?ms=N makes the next answer wait, for the thinking test.

Built 2026-10-07 (design note 113, decision 0044):
- Acceptance 1: src/components/app/dev-menu.tsx in the sidebar footer, shown by
  src/app/app/(shell)/layout.tsx when devMenuOn(); the choice posts to setAiModeAction
  (src/app/app/(shell)/dev-actions.ts), which sets the cookie for a year and reloads the
  shell; the usage line from usage(); the pill in src/app/app/(shell)/projects/[projectId]/
  layout.tsx.
- Acceptance 2: src/lib/ai/mode.ts modeFrom(cookie, env) and aiMode(); src/lib/ai/mode.test.ts.
- Acceptance 3: Refusal "off" in src/lib/ai/client.ts, AI_COPY.off and
  ACTIONS_COPY.refusals.off; src/lib/ai/client.test.ts.
- Acceptance 4: src/lib/ai/stand-in.ts (shape, actions, answer, standInFetch);
  e2e/fake-anthropic.mjs imports it; the row with STAND_IN_MODEL and costEurCents 0
  (src/lib/ai/prices.ts); the lines in actions-tab.tsx and shape/page.tsx from
  aiRuns.lastFor; src/lib/ai/stand-in.test.ts, src/lib/insights.test.ts.
- Acceptance 5: src/components/app/thinking.tsx, used by write-actions.tsx and
  shape-button.tsx with the counts from the tab and the page.
- Acceptance 6: write-actions.tsx (the danger box, CircleAlert from lucide-react),
  actions-tab.tsx (the counts line from results.numbers, the no-run line).
- Acceptance 7: the tests named above; e2e/actions.spec.ts asks the stand-in server to wait
  1,500 ms and sees "Reading 2 items and 2 answers"; e2e/dev-menu.spec.ts.
