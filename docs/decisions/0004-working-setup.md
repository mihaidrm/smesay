# 0004 Working setup, 2026-09-30

Decided by Mihai in the Claude Code session of 2026-09-30.

1. One main Claude session does the code, tests, docs, copy, research and story writing. The
   ten-agent setup is retired. Two agents stay: reviewer (fresh-context audit against acceptance
   criteria and SECURITY.md) and tester (used only when Mihai asks for it). The rules from the
   retired agents now live in CLAUDE.md under "Build rules".

2. Testing is basic. Unit tests for logic and one Playwright test for the main path of each
   user-facing flow. Mihai tests on real devices and in real mail clients (iPhone, Android,
   Gmail, Outlook, Apple Mail). Claude does not spend tokens on wide browser or device matrices.

3. Legal pages (privacy policy, terms, DPA, subprocessor list) are drafted by Claude with a
   marker at every place a lawyer must confirm. Mihai has a lawyer confirm them before launch.

4. Nothing hand-drawn. No illustration set and no commissioned painting; this replaces item 4 of
   design note 02. The product uses a placeholder logo (assets/brand/) until the name is decided.
   Claude lists low-budget assets Mihai can buy in docs/brand-assets.md. Mihai buys; Claude
   places them.

5. Decisions: Claude asks, Mihai approves. Claude proposes one recommended option and does not
   act on scope, name, pricing or spend until Mihai answers.

6. Decisions are made in the Claude Code chat. Claude records each one in this folder on the same
   day: a numbered file in docs/decisions/, a dated note in docs/design-notes/ for design work,
   and updates to CLAUDE.md, README.md and docs/context.md when they change how sessions run.

Why: two sessions a week, one story per session or less, is sequential work. Parallel builders
add handoffs and token cost without adding speed. A fresh-context review is the one thing a
single session cannot give itself.

Consequence: README.md, CLAUDE.md and docs/context.md were updated on 2026-09-30. Eight agent
files in .claude/agents/ are retired and wait for Mihai to delete them (see docs/context.md).
