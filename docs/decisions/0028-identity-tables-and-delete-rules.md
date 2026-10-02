# 0028 Identity tables outside the workspace rule, and delete rules, 2026-10-01

Status: proposed by Claude on 2026-10-01 after the E1-2 review (findings 2 and 10); accepted by
Mihai on 2026-10-02, both parts (decision 0031).

Question 1. CLAUDE.md says every table has a workspace_id or is reachable only through a table
that does. better-auth's `user`, `session`, `account` and `verification` tables have neither:
a person signs in before they have or join any workspace, and one user can belong to several.
Proposal: these four tables sit outside the rule; `workspace_member` (workspace_id, user_id)
is the only bridge, and every query helper in E1-3 still takes the workspace id from the
session. The schema test names the four tables as the only exemption.

Question 2. What a hard delete does. Proposal: deleting a workspace deletes everything in it
(E11's 24-hour removal). Deleting a project deletes its sets, items, instruments, invites,
insights and AI runs, but is refused by the database while responses exist, so the code
deletes the responses first, on purpose, in a transaction. Instruments, invites, set versions
and items with responses or answers under them cannot be deleted directly. In R1 the app
deletes nothing except through workspace removal; projects are archived (archived_at).

Consequence if accepted: stories/E1-2 stands as built; E1-3's helpers and E11's removal follow
these rules. If refused: the foreign key actions in src/db/schema.ts change and a new
migration follows.
