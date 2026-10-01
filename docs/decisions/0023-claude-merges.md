# 0023 Claude merges every pull request, 2026-10-01

Decided by Mihai in the Claude Code cloud session of 2026-10-01: "dont wait for me to merge,
just go ahead and merge everytime".

1. When the work for one request is checked and the reply is sent, Claude marks the pull
   request ready and merges it into main in the same turn. Mihai reviews on main and sends
   corrections as new requests, each with its own pull request (decision 0019).
2. Decision 0019's "Mihai merges, or tells Claude to merge" becomes "Claude merges".
3. If a merge is refused by the tooling, Claude says so in the reply and leaves the pull request
   ready, not draft.

Why: PR 4 collected six requests because it waited as a draft while the next requests arrived,
which is what decision 0019 was meant to prevent.

Consequence: CLAUDE.md updated; PR 4 merged on this decision.
