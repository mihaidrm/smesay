# E8-7 Live updates while the instrument is open

User: a PM watching answers arrive during a workshop
Status: ready
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
(github.com/porsager/postgres README, Listen and notify; verified when the story starts). A
Route Handler streaming a ReadableStream with `text/event-stream` (nextjs.org/docs/app/api-
reference/file-conventions/route, read when the story starts; unverified until then).
