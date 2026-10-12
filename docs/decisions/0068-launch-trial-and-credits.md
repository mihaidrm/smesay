# 0068 The Launch button, the trial and the AI credits, 2026-10-12

Mihai, 2026-10-12: "need to make rules - while on free plan - 0 AI credits. When in Free trial
- you get 15 cents. then, paying users get 20 % of the value of the monthly payment they make
in credits (we dont show this info)". Then, to Claude's questions: "we make a button to press
and the product launches (also when the developer menu disappears)"; "Trial is just 1 form, 20
respondents - 7 days"; "we split difference and make it 33 cents"; yearly payers get the same
as monthly payers; unused credits are lost.

Decision:
- The product launches when Mihai presses Launch in the admin area (stories/E2-7). This
  replaces the usage metric of decision 0008 as the switch for the paid plans; the metric
  stays on the admin page as information. Launching also removes the developer menu.
- Until launch nothing changes: free without limits, the hidden EUR 10 budget of decision 0036.
- After launch: free plan 0 AI credits, 1 project, 25 responses a month (the business plan's
  free limits). A new workspace starts a 7-day trial: 1 validation, 20 respondents, 33 cents
  of AI. Paid plans get 20 percent of their monthly price in AI credits a month (Pro EUR 9.80,
  Team EUR 29.80, Enterprise EUR 100); a yearly payer gets the same as a monthly one; unused
  credits are lost at the month's end. The credits are never shown to the workspace.
- Mihai's question "maybe better plans should use a better model and have slightly more
  credits?": Claude's recommendation, accepted for now: one model (claude-sonnet-5-5) for every
  plan, with the plan table carrying a model per plan so a tier change is one line; 20 percent
  flat. The reasons are in design note 133.
- Claude's choices under decision 0044 (docs/review-list.md): the launch is reversible by the
  same page; existing free workspaces get the 7-day trial at launch; the admin can set a
  workspace's credits in cents, replacing the euro budget after launch.

Consequences: migration 0041 (product table; workspace.trial_ends_at, ai_credits_cents),
src/lib/plans.ts (entitlementFor, TRIAL, credits and model per plan), src/lib/ai/client.ts,
src/lib/ai/mode.ts, the admin Overview and workspace page, Settings' Plan card,
docs/copy/app.md and errors.md, INTERFACES.md, docs/accounts.md (step 14), .env.example,
docs/setup.md, stories/E2-6 and E2-7, design note 133, decisions 0008 and 0036 (amended).
