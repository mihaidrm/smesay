# E2-7 The Launch button, the trial and the AI credits

User: Mihai, pressing one button when the product goes live; a new workspace in its first week;
a PM on a paid plan whose AI is covered by what they pay
Status: built
Outcome: one admin button launches the product: the plan limits and the AI credits take effect,
new workspaces start a 7-day trial, and the developer menu disappears; until then nothing
changes for anyone.

## Acceptance criteria
1. The admin Overview has a Launch card: the state (being built, or launched on a date by whom),
   what launching changes, and a button with a confirm line. Launching writes the product's
   one row (product.launched_at, launched_by), an audit row, and gives every live free
   workspace a trial that ends 7 days later. A second button, with its own confirm, takes the
   product back to building (the row cleared, an audit row); nothing else is undone.
2. Before launch everything stays as today: the free plan has no limits, the hidden AI budget of
   decision 0036 applies (EUR 10 a month, admin-set), the developer menu shows where it did.
3. After launch a workspace's entitlement is: trial (free plan, trial_ends_at in the future):
   1 project, 20 responses a month, 33 cents of AI a month; free: 1 project, 25 responses a
   month, 0 cents of AI; Pro EUR 9.80 of AI, Team EUR 29.80, Enterprise EUR 100 (20 percent of
   the monthly price; a yearly payer gets the same); unused credits are lost at the month's end
   (the month's spend is what usage() already counts). The admin can set a workspace's credits
   in cents on its page (empty: the plan's), audited. A new workspace created after launch
   starts its trial at once.
4. The AI client reads the entitlement: a call that would take the month's spend past the credits
   is refused with the budget sentence, and a plan with 0 credits is refused with "AI comes with
   a paid plan". The plan's "AI runs per month" cap goes: credits replace it. The model is the
   plan's (one model for every plan today, src/lib/plans.ts).
5. After launch the developer menu is gone everywhere, whatever SMESAY_DEV_MENU or NODE_ENV say,
   and every AI call goes to the real model.
6. Settings, Plan card after launch: Trial until [DATE] with its line, Free with its line, or
   the paid plan's name with its line; the usage line stays; no credit number is shown
   (decision 0036).
7. Tests: unit tests for the entitlement matrix, withinPlan and the client's credit check with
   the launched state injected (the shared test database is never launched); Playwright, in a
   project that runs after every other spec: the admin launches, the developer menu is gone,
   Settings shows the trial, the admin takes the product back, the menu is back.

## Out of scope
- A way to pay: no checkout exists. A paying customer is put on their plan by the admin
  (Change the plan) after paying by invoice, until billing is built.
- The landing page's pricing: the Free card still says "without limits" and "paid plans come
  later"; it changes in its own pull request before the button is pressed (docs/accounts.md,
  step 14).
- A better model for better plans: one model today; the plan table carries a model per plan so
  a tier change is one line, after the golden set is run on both (design note 133).
- Credits bought on top of a plan (decision 0036, item 3).

## Open questions
- None. Mihai's rules of 2026-10-12 (decision 0068).

## Built
Built 2026-10-12 (decision 0068, design note 133). The admin's credit override and the trial
grant at launch to existing free workspaces are Claude's under decision 0044
(docs/review-list.md). Tests: src/lib/plans.test.ts, src/lib/ai/client.test.ts,
src/lib/ai/mode.test.ts, src/db/queries/admin-workspaces.test.ts, e2e/launch.spec.ts.

## Technical notes
- product: one row (id 1), launched_at, launched_by; src/db/queries/product.ts. workspace:
  trial_ends_at, ai_credits_cents (the admin's override, null for the plan's). Migration 0041.
- entitlementFor(workspace, launched, now) in src/lib/plans.ts is the one place that turns a
  plan, a trial and the launched state into limits, credits and a model; withinPlan,
  roomInPlan, runModel, the Settings card and the admin page read it.
- devMenuShown() in src/lib/ai/mode.ts is devMenuOn(env) and not launched; aiMode() is "real"
  once launched.
