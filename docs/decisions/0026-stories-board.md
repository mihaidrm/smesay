# 0026 Stories on the canvas, generated from the story files, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01: "get it done, I want to have
a good view of them and be able to reference where we are on them".

1. Every story file carries a `Status:` line: ready, building, built, accepted, done,
   deferred (stories/README.md). It is the one place a story's state is typed.
2. The Stories board on the canvas (docs/design-notes/prototype-01/Stories.dc.html) lists
   every epic from stories/backlog.md with its stories, status pill, acceptance criteria count
   and open question count. scripts/stories-board.mjs generates it; `node
   scripts/sync-status.mjs --write` runs it with the roadmap; the pre-commit hook refuses a
   commit when the board does not match the files (decision 0022 extended).
3. Epics without stories show "not written yet"; stories are written when the epic before is
   accepted, the way E1's were written at the end of Phase 2. Superseded by decision 0029 on
   the same day: every R1 story is written now.

Consequence: stories E1-2 to E1-4 marked ready, E1-1 done, E1-5 deferred; TEMPLATE.md has the
line; CLAUDE.md and README name the board; canvas index gets the board under the golden set.
