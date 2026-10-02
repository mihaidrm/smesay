# 0032 CI runs the tests, not every pull request session, 2026-10-02

Decided by Mihai in the Claude Code cloud session of 2026-10-02: "dont run tests after every
single PR cause it take too long, leave the testing for a bit later".

1. Claude no longer runs the whole check set (unit tests, build, Playwright) in the session
   before every pull request. CI runs all of it on every push (.github/workflows/ci.yml) and
   a red run is fixed before the merge (decision 0023).
2. In the session Claude still runs what is fast and specific to the change: typecheck, lint,
   the copy scan, the status check (the pre-commit hook runs the last two anyway) and the test
   file it just wrote, once.
3. A full local run happens when Mihai asks, before a story is accepted, or when CI is red and
   the failure has to be reproduced.

Consequence: CLAUDE.md's "run npm test and npx playwright test before any handoff" becomes
"CI runs them on every push; report the CI result"; the reviewer agent still audits each
story.
