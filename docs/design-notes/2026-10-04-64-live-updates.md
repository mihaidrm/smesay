# Design note 64: live updates on Results, 2026-10-04

Made in the Claude Code cloud session of 2026-10-04 for stories/E8-7, under decision 0044.

## What was decided

- The database says what changed: a trigger on answer, response and missing_item sends
  NOTIFY "results" with the instrument's id (drizzle/0020_results_notify.sql). Every write
  path is covered (autosave, Start, Submit, a missing item), and Postgres sends identical
  payloads of one transaction once (postgresql.org/docs/current/sql-notify.html).
- One LISTEN per server process, on postgres.js's dedicated connection, fans out to the
  streams of each instrument. After the LISTEN reconnects every stream is told to read
  again, since notifications sent while it was down are lost (postgres.js calls its onlisten
  argument on each reconnect: node_modules/postgres/README.md, Listen & notify). The stream is a Route Handler that finds the project through
  the session's workspace, so a stream never carries another workspace's instrument, and the
  numbers are read again through the scoped queries.
- The page reads itself again on a change (router.refresh), not one part at a time: the
  strip, the tabs, the tracker, the detail and the conflict view stay one consistent read
  with the filter and the switch, and the client state (the filter bar, an open item
  detail) stays. The first read comes 250 ms after a change, then at most one a second, and
  none while the tab is hidden; a hidden tab reads once when it shows again
  (src/lib/results-live.ts createLiveClient).
- Live whenever the project has an instrument, not only while the public link is open: a
  link that opens on a date, and personal links after the public one is revoked, still bring
  answers. The sample has no stream (its link collects nothing). The stream sits outside the
  page's error boundary, so a failed read keeps it.
- The heartbeat is a named "ping" event every 5 seconds that travels through Postgres: the
  process sends NOTIFY results 'ping' while a stream is open, and the streams pass it on, so
  pings stop when the LISTEN is broken, not only when the page's own connection drops. 15
  seconds without one shows the banner from docs/copy/errors.md and reopens the stream with
  backoff, because the browser's own retry does not back off and stops for good after a
  refused stream. Every "ready" after the first reads the page again.
- The route answers HEAD with 405 (Next would otherwise run GET and leave a stream with no
  reader), and opens nothing for a request that aborted while it looked the project up.
- The banner sits in a status region that is always on the page, so it is announced when it
  appears; empty, the region is out of the flow and adds no gap.
- Only "ping" and "change" prove the stream works, since both travel through Postgres; the
  route's own "ready" does not clear the banner or reset the backoff. A reopened stream that
  stays silent for 15 seconds is reopened again with a longer wait, so a stream that hangs
  without an error is not left alone; the first ping after a reopen reads the page.
- Notifications with the same payload handled in the same tick collapse into one, which
  covers postgres.js holding the handler twice after a LISTEN that failed and was asked
  again. Each such retry during an outage still adds a handler to postgres.js's list for the
  life of the process; the collapse keeps the pages from reading more than once (review
  list).
- A changed cell fades (design system, Motion: 400 ms): a violet-soft layer over the cell
  that clears, on the tiles, the tracker's status and progress, and the Agreement table's
  percentages. The first render does not fade. Nothing moves under prefers-reduced-motion,
  and no counter spins.

## Components added

- FadeOnChange (src/components/app/fade-on-change.tsx) and the .cell-fade layer in
  src/app/globals.css. Not in the design system before.
- The banner is the design system's Banner, shown while the stream is stale.

## Checks

- src/lib/results-live.test.ts (the client with fake timers: the banner at 15 s, the
  backoff, a read after a reconnect, the throttle, a hidden tab), src/db/queries/
  results-events.test.ts (the heartbeat through Postgres, another instrument hears nothing),
  src/db/queries/results-events-route.test.ts (another workspace, HEAD, an early
  abort, the listener removed when the stream ends).
- e2e/results-live.spec.ts.
