# SMEsay (provisional name, decision 0005)

Hosted tool: import a requirement list, get a readable validation instrument, send one link,
get back agreement, disagreement with reasons and gaps, plus AI-written actions.

Owner: Alerty S.R.L. Built by Mihai (product, acceptance, accounts) and Claude Code (code, tests, docs).

## Folder map
- CLAUDE.md          rules every Claude Code session reads first, including the build rules
- WRITING.md         plain-English rules for all user-facing copy and docs
- SECURITY.md        checklist the reviewer audits against
- INTERFACES.md      contracts between components that depend on each other
- MISTAKES.md        log of invented APIs, wrong assumptions, what caught them
- .claude/agents/    reviewer and tester (decision 0004)
- stories/           one file per story; backlog.md is the epic list
- docs/context.md    where the project stands and what comes next
- docs/accounts.md   every account Mihai creates, in order, with the steps
- docs/brand-assets.md  placeholder logo and the list of assets to buy
- docs/business-plan.pdf  the plan, with acceptance criteria for every R1 story
- docs/decisions/    one file per decision, numbered, dated
- docs/design-notes/ dated design work; this is the record that the design is ours
- docs/schema.md     object model
- docs/copy/         every user-facing text: landing, quickstart, emails, error messages
- scripts/scan-copy.mjs  the WRITING.md scan; `node scripts/scan-copy.mjs <paths>` until Phase 2 wires `npm run scan:copy`
- scripts/sync-status.mjs  writes status from docs/plan-steps.md into the Roadmap board and docs/context.md; checks retired terms and references
- scripts/githooks/     pre-commit hook; enable with `git config core.hooksPath scripts/githooks`
- docs/retired-terms.md  words a decision replaced; the hook fails if one survives in a current file
- assets/brand/      placeholder logo files
- evals/             golden set for the AI features
- defects/           defects found in testing, fixed before a story is accepted

## What is not here, on purpose
No files, exports, screenshots or notes from any client engagement. Nothing from the 3Pillar
or Informa work enters this folder, the repository, or any Claude session that designs screens.
See docs/decisions/0002-clean-design.md.

## How a session runs
1. Mihai names the stories in scope.
2. Claude lists open questions and waits for answers.
3. Claude builds each story and returns a diff, a screenshot and the test command.
4. The reviewer agent audits the story with fresh context against the acceptance criteria and
   SECURITY.md.
5. Mihai clicks through on laptop and phone, accepts or rejects each story with a note.
6. Claude records any decision made in the session in docs/decisions/ the same day.
