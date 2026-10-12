# 133 The Launch button, the trial and the AI credits, 2026-10-12

Decision 0068. What was decided in the build, and why.

## One switch, in the database

The launched state is one row in a `product` table (id 1, launched_at, launched_by), not an
environment variable: Mihai presses a button and the product changes on the next request,
with no deploy, and the audit log says who pressed it and when. The reverse button exists
because a press by mistake must be undone the same minute; it clears the row and writes its
own audit row, and undoes nothing else (a trial already granted keeps its end date).

## The entitlement

entitlementFor(workspace, launched, now) in src/lib/plans.ts answers five questions for a
workspace at an instant: which plan name to show, the limits, the AI credits for the month,
the model, and whether it is in its trial. Everything that used to read the plan's limits or
the euro budget reads it: withinPlan and roomInPlan, runModel's budget check, the Settings
card, the admin page.

| State | Limits | AI a month | Model |
|---|---|---|---|
| Before launch, any plan | the plan's (free: none) | the hidden budget, EUR 10 by default (decision 0036) | claude-sonnet-5-5 |
| Launched, free, in the trial | 1 project, 20 responses | 33 cents | claude-sonnet-5-5 |
| Launched, free | 1 project, 25 responses | 0 | claude-sonnet-5-5 |
| Launched, Pro | 500 responses, 1 seat | EUR 9.80 | claude-sonnet-5-5 |
| Launched, Team | 2,500 responses, 5 seats | EUR 29.80 | claude-sonnet-5-5 |
| Launched, Enterprise | none | EUR 100 | claude-sonnet-5-5 |

The admin can set a workspace's credits in cents after launch (empty means the plan's); before
launch the euro budget field stays, since that is what decision 0036 built and the e2e tests
check. The credits are a monthly allowance against the same spend usage() counts, so nothing
rolls over and no new counter exists.

## What 33 cents buys

From the price table (USD 2 and 10 per million tokens, EUR at 1.1225): a Shape of a 50-item
list costs about 2 to 4 cents, a run of Write actions about 2 to 6 cents. The trial's 33 cents
is about one list shaped twice and actions written twice, with some room. The only real call
logged so far is the smoke test (1 cent); the first real runs will say.

## One model for every plan

Mihai asked whether better plans should get a better model and slightly more credits. Opus
5.5 costs USD 4 and 20 per million tokens, twice Sonnet 5.5 (the Claude API reference, read
2026-10-12). The recommendation, accepted for now: one model. Nothing shows that Opus shapes a
requirements list better; the golden set (E4-6) has only ever run on Sonnet. A tiered model
is a promise on the pricing page that the launch gate would have to prove. The plan table
carries `model` per plan, so the day the evals say otherwise the change is one line and a price
row. Credits stay at 20 percent flat for the same reason: one rule to explain, one number per
plan in the table to raise later.

## The trial

A trial is a state of the free plan, not a plan key: workspace.trial_ends_at. A workspace
created after launch gets created_at plus 7 days; at launch, every live free workspace gets
the launch instant plus 7 days, so the first users see the paid path instead of losing the AI
the same minute (Claude's choice, docs/review-list.md). After the trial the workspace is free:
1 project, 25 responses, no AI. The terms already cover a trial's end (decision 0063).

## The developer menu

devMenuShown() is devMenuOn(env) and not launched. Once launched, no cookie can send a call to
the stand-in or switch the AI off, on any build.

## Not in this note

The landing page's pricing section still describes the free plan without limits; it changes
before the button is pressed (docs/accounts.md, step 14). No checkout exists: a paying
customer is put on a plan by the admin.
