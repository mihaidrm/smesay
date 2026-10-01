# 0019 One pull request per request, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01.

Each message from Mihai that asks for changes ends in its own pull request, pushed as soon as
the work is checked. Several requests in one message may share a pull request. Requests from
different messages do not stack in one pull request.

Why: PR 2 had grown to nine messages' worth of changes before it was merged, which makes review
and rollback harder than they need to be.

How: after each reply that delivered changes, the branch is pushed and the pull request opened
as a draft. Mihai merges, or tells Claude to merge. The next request starts from main on the
same branch name.

Consequence: rule added to CLAUDE.md. PR 2 merged the same day to start the cadence.
