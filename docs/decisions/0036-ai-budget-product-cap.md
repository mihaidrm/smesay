# 0036 One AI spend cap for the product; the workspace budget stays, hidden, 2026-10-03

Status: decided by Mihai on 2026-10-03 ("my plan was 10 euro per month for entire project not
for all users, just to validate the idea. so users shouldnt see this budget, only admins";
"agree with 1. on 2 yes keep it but hide it").

1. The product has one AI spend cap for the month, across every workspace:
   ANTHROPIC_MONTHLY_BUDGET_EUR in the environment, whole euro, set to the same number as the
   Console's monthly limit (EUR 10 today, docs/accounts.md step 9). Before every call, the
   product's spend this month plus the call's estimate is checked against it
   (src/lib/ai/client.ts). Over the cap the call is refused with "AI is paused until next
   month. The list is imported and can be published as it is." A missing or non-numeric
   variable refuses every call and names the variable in the server log, as a missing key does.
2. The per-workspace budget (workspace.ai_budget_eur) stays as the limit one workspace can
   spend of the product's cap, so one workspace cannot pause the AI for every other. Its
   default drops from 50 to 10 (migration 0012, existing rows at 50 go to 10). No one in a
   workspace sees it: Settings loses the AI budget card and keeps the usage line, in the Plan
   card. The budget is set and seen in the admin area only (E14-2). Over it, the message no
   longer asks the owner to raise it: "This workspace has used its AI budget for the month. The
   list is imported and can be published as it is. Come back next month."
3. Direction, not a story: the AI may become what the workspace pays for, as credits bought
   from SMEsay, with the app itself cheap or free. The hidden per-workspace budget is the
   number such credits would top up. Nothing is built for it before the launch gate.

Consequences: stories E2-5, E2-6, E4-1 and E14-2, stories/backlog.md, docs/copy/app.md and
errors.md, INTERFACES.md, SECURITY.md, docs/accounts.md, .env.example, the PM app board
(Settings) and design note 31, all on 2026-10-03. Design notes 18 and 26 keep their text as
history with a line pointing here. docs/schema.md follows the migration through sync-status.
