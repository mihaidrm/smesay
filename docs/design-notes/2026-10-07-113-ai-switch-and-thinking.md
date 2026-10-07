# Design note 113: the AI switch, the stand-in in the app and the thinking state, 2026-10-07

Made in the Claude Code cloud session of 2026-10-07 under decisions 0044 and 0039, from
Mihai's message about the Actions tab on his local machine. Story: stories/E4-8.

## What Mihai asked

"I am looking at the actions tab on the results page - clicking write actions doesnt do
anything (not sure if its because its only one respondent). But we should make sure this
works correctly because its our most valuable feature maybe - being able to give some
suggestions. Need to also add nice animation there - saying we are thinking etc - and we can
use AI to process them. Also, you need to put a feature flag on anything that can use AI
credits while i am on the local env. Like a debug menu i can turn on and off to use or not
AI. And i think so far no AI was used, or at least it doesnt show it anywhere."

## What "nothing happens" most likely was

Write actions always answered; the answer was easy to miss. Three cases fit one respondent
on a local machine:

1. The respondent had not pressed Submit. writeActions reads submitted answers only (decision
   0030) and returned "Actions are written from the submitted answers. Write them once
   someone has submitted." in the unclear tint beside the button, the same tint the page
   uses for mild notes.
2. The respondent agreed with everything. The run went to the model, every action it wrote
   cited nothing the app could keep, and the line said "The answers gave no new action worth
   writing." under the button.
3. ANTHROPIC_API_KEY or ANTHROPIC_MONTHLY_BUDGET_EUR missing from .env.local. runModel
   refused before the call with "The AI did not answer. No action changed. Try again in a
   minute." in the same tint; the server log named the variable, the screen did not.

Nothing in src/lib/insights.ts returns without a message: the sample, no instrument, no
submitted answer, a prompt over the limit, every runModel refusal, and a run that keeps no
action each have a sentence. What was missing was weight on the screen, a reason before the
press, and a way to run without spending.

## What was decided

1. One switch, in a developer menu at the bottom of the sidebar, "AI calls": Stand-in (free),
   Real (spends credits), Off. The choice is a cookie (smesay-ai-mode), read by runModel
   through src/lib/ai/mode.ts, so every AI feature obeys it through the one door (E4-1). The
   menu exists only when the server sees NODE_ENV other than "production" or
   SMESAY_DEV_MENU=1; a production build without the variable ignores the cookie and always
   calls the model. A fresh local checkout with no cookie starts on the stand-in, so it never
   spends until Mihai moves the switch. The menu shows the month's runs and spend from
   usage(), the same sum as Settings.
2. The stand-in is the Playwright one, moved into src/lib/ai/stand-in.ts so the app and the
   test server answer alike; in the app it answers through the SDK's fetch option, the way
   the unit tests swap the network out. A stand-in run is a row with model "stand-in" and
   cost 0, so the usage counts show it ran and that it cost nothing. The in-process stand-in
   waits two seconds before answering, so the thinking state is visible on a local machine.
3. Every screen with AI output says when it came from the stand-in ("These actions came from
   the stand-in, not the AI."; "These areas and readable versions came from the stand-in,
   not the AI."), and the project header carries "AI: stand-in" or "AI: off" beside the
   stepper while the mode is not real. Invented output is never taken for the model's.
4. The thinking state: the mascot in the analysis pose (56 px) beside one line that changes
   every 1.6 seconds ("Reading 2 items and 2 answers", "Looking for where people disagree",
   "Writing the to-do list"; Shape has its own three), three dots pulsing after it. The line
   is a polite status region. Under prefers-reduced-motion the first line stays and nothing
   moves. No spinner on its own, no counter that spins (design system, Motion).
5. Every outcome visible: refusals move to the danger tint with an alert icon; before any
   press the tab says "[S] of [R] responses are submitted." while nothing is submitted;
   "No AI run on this project yet." under the actions until the first run.
6. "Off" is a refusal of its own ("AI is switched off in the developer menu. Switch it to
   Stand-in or Real to run this."), before the budget checks, with no ai_run row and no
   shape_failed event: a developer's switch is not a failed run.
7. scripts/ai-smoke.ts and evals/run.ts pass the mode "real", so Mihai's paid checks are
   never answered by the stand-in (decision 0039).

## Why

- The one door (E4-1) is the place for the switch: a flag per feature would drift. The
  cookie, not an environment variable, so Mihai switches without restarting the dev server.
- Default to the stand-in outside production, because a spend by accident is worse than a
  missing answer; the pill and the lines keep the stand-in's output from being mistaken.
- CI's production server keeps "real": ANTHROPIC_BASE_URL already points it at the stand-in
  server, so "real" there is free, and the existing browser tests keep their cost line.
- The thinking lines name what the run reads (counts from the page), so the wait reads as
  work on this project rather than a generic spinner.
