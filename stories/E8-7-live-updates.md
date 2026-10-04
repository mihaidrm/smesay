# E8-7 Live updates while the instrument is open

User: a PM watching answers arrive during a workshop
Status: built
Outcome: a new answer appears on the dashboard within five seconds without a reload, through
server-sent events.

## Acceptance criteria
1. Results subscribes to /api/projects/[id]/events (server-sent events, CLAUDE.md stack) while
   the instrument is open; a saved answer or submit publishes an event, and the strip, the
   open tab and the tracker refetch within five seconds; a Playwright test answers on the
   respondent side and sees the count change on the PM side under 5 s.
2. Changed cells fade (design system, Motion: the changed cell fades, no spinning counters).
3. When the stream drops, the banner "Live updates stopped. The page keeps the last numbers;
   reload to catch up." appears after 15 seconds without a heartbeat; the client reconnects
   with backoff and the banner clears.
4. Events carry no answer content, only the instrument id and a version counter, so nothing
   personal travels on the stream and the data always comes from the scoped queries.
5. Works on plain Postgres with `docker compose up` (CLAUDE.md): events are published through
   Postgres LISTEN and NOTIFY, no vendor channel.

## Out of scope
- Live updates on the respondent side: not needed.

## Open questions
- None.

## Technical notes
postgres (the driver already in use) supports LISTEN through `sql.listen(channel, fn)`
(node_modules/postgres/README.md, Listen & notify: verified 2026-10-04, with unlisten in
node_modules/postgres/types/index.d.ts). A Route Handler streaming a ReadableStream with
`text/event-stream` (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
route.md, Streaming; the format: html.spec.whatwg.org/multipage/server-sent-events.html;
verified 2026-10-04).

Built 2026-10-04 (design note 64, decision 0044; docs/review-list.md):
- Acceptance 1: drizzle/0020_results_notify.sql sends NOTIFY on "results" after every write
  to an answer, a response or a missing item; src/db/queries/results-events.ts listens once
  per process and calls the instrument's streams; src/app/api/projects/[projectId]/events/
  route.ts streams "ready", "change" and "ping" for a project of the session's workspace; the
  page (live-updates.tsx) listens whenever the project has an instrument (not the sample),
  the empty state included, and reads the page again (router.refresh) 250 ms after a change,
  then at most once a second, so the strip, the open tab, the tracker and an open detail
  show the new numbers with the filter kept.
  e2e/results-live.spec.ts: a respondent rates two items on a phone and the PM's Agreement
  tile reads 1 of 1, then 2 of 2, each within 5 seconds of "Saved".
- Acceptance 2: src/components/app/fade-on-change.tsx: the tiles, the Responses tab's status
  and progress cells and the Agreement table's percentages fade over 400 ms when their value
  changes; none under prefers-reduced-motion.
- Acceptance 3: the heartbeat travels through Postgres (NOTIFY results 'ping' every 5
  seconds), so it also stops when the LISTEN is broken; no event for 15 seconds shows the
  banner, closes the stream and opens it again after 1, 2, 4, 8, 16, then 30 seconds; the
  next event clears the banner and reads the page again, and so does every reconnect.
  src/lib/results-live.test.ts runs the client with fake timers.
- Acceptance 4: the payload is the instrument's id; the stream adds a version counter;
  nothing else travels. src/db/queries/results-events.test.ts checks that another
  instrument's listener hears nothing and that many rows in one transaction send once;
  src/db/queries/results-events-route.test.ts that another workspace's project is
  404 and that a stream leaves no listener behind.
- Acceptance 5: Postgres LISTEN and NOTIFY only (plain Postgres in docker compose).
