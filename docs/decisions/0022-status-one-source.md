# 0022 Status has one source, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01, after the Roadmap board still
said "Done 4 of 6 steps" with the PM phone board in its left list, two commits after decision
0020 removed that board and after the copy draft closed step 1.5: "do whatever you must do to
not forget anymore to update what needs updating in all files".

Why it happened: the step count and the left list were typed by hand in three places (the
plan-steps table, the next-tasks list in docs/context.md, the Roadmap board) with nothing
linking them. Decision 0017's grep catches wording I know is old; it does not catch a number I
forgot to change.

1. The Phase tables in docs/plan-steps.md are the only place a step's status is typed, in a
   Status column: done, drafted, open, mihai.
2. `node scripts/sync-status.mjs --write` derives from that table the Roadmap board's step
   count, left list, done list, bar width and decision range, and the status block in
   docs/context.md. The board marks the written spots with data-sync attributes; context.md
   with sync comments. Nothing else in those files is generated.
3. Without --write the script checks: every synced spot matches the table; no term from
   docs/retired-terms.md appears in a current file (decisions, dated design notes, MISTAKES.md
   and the superseded landing pages are history and exempt); every "decision NNNN" and
   "note NN" reference has a file.
4. scripts/githooks/pre-commit runs that check and the copy scan. Every session enables it with
   `git config core.hooksPath scripts/githooks` (git does not store hooks in the repository).
   A commit that fails the check is refused.
5. A decision that retires a word adds it to docs/retired-terms.md in the same commit.

Consequence: CLAUDE.md names the hook and the scripts; README lists them; docs/context.md's
next-tasks list is replaced by the generated block; the Roadmap board is regenerated.
