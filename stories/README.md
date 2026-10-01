One file per story, named E<epic>-<n>-<slug>.md. The epic list is in backlog.md. A story is
ready when it has at least three acceptance criteria and no open questions that block building.

Every story carries a `Status:` line under its User line, one of: ready (written, not started),
building (Claude is on it), built (reviewed, waits for Mihai), accepted (Mihai accepted), done
(done before the epic started), deferred (waits for a gate). The line may continue with a date
or a reason after the word. The Stories board on the canvas
(docs/design-notes/prototype-01/Stories.dc.html) is generated from these lines and backlog.md by
`node scripts/stories-board.mjs --write`; the pre-commit hook refuses a commit when the board is
stale (decision 0026). Change the Status line, run `npm run sync:status`, commit.
