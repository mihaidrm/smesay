# Design note 64: live updates on Results, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E8-7, under decision 0044.

## What was decided

- The database says what changed: a trigger on answer, response and missing_item sends
  NOTIFY "results" with the instrument's id (drizzle/0020_results_notify.sql). Every write
  path is covered (autosave, Start, Submit, a missing item), and Postgres sends identical
  payloads of one transaction once (postgresql.org/docs/current/sql-notify.html).
- One LISTEN per server process, on postgres.js's dedicated connection, fans out to the
  streams of each instrument. The stream is a Route Handler that finds the project through
  the session's workspace, so a stream never carries another workspace's instrument, and the
  numbers are read again through the scoped queries.
- The page reads itself again on a change (router.refresh), not one part at a time: the
  strip, the tabs, the tracker, the detail and the conflict view stay one consistent read
  with the filter and the switch, and the client state (the filter bar, an open dialog)
  stays. Several writes within 250 ms read once.
- Live only while the public link is open: a closed, revoked or draft link has no stream.
- The heartbeat is a named "ping" event every 5 seconds; 15 seconds without one shows the
  banner from docs/copy/errors.md and reopens the stream with backoff, because the browser's
  own retry does not back off and stops for good after a refused stream.
- A changed cell fades (design system, Motion: 400 ms): a violet-soft layer over the cell
  that clears, on the tiles, the tracker's status and progress, and the Agreement table's
  percentages. The first render does not fade. Nothing moves under prefers-reduced-motion,
  and no counter spins.

## Components added

- FadeOnChange (src/components/app/fade-on-change.tsx) and the .cell-fade layer in
  src/app/globals.css. Not in the design system before.
- The banner is the design system's Banner, shown while the stream is stale.

## Checks

- src/lib/results-live.test.ts, src/db/queries/results-events.test.ts.
- e2e/results-live.spec.ts.
