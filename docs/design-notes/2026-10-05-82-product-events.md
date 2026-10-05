# Design note 82: product events, 2026-10-05

Made in the Claude Code cloud session of 2026-10-05 for stories/E13-1, under decision 0044.

## What was decided

- One table, event, and one writer, track(). The catalogue says, per event, which properties
  it takes and what each may hold: a count, a uuid, a short key or a value from a fixed list.
  That is the whole personal-data rule: no free text fits anywhere, so nothing typed can be
  stored by mistake. A respondent event refuses a user id.
- track() is awaited after the action's own work has succeeded and never throws: a refused
  event or a failed insert is logged (the name and the reason, no values) and the caller goes
  on. Awaiting one insert keeps the row from being lost when a server action redirects.
- workspace_deleted is kept without a workspace, like signed_up: the workspace's own events
  go with it (acceptance 5), and the deletion would otherwise vanish from the count with them.
- link_opened counts renders (a reload counts again); sample_opened counts openings (the first
  arrival without the full address); response_started
  counts new responses only; response_submitted only the first Submit, with the minutes from
  Start.
- member_joined is written where an invitation becomes a membership (the next signed-in
  request), with the joined workspace checked as every other one.
- The catalogue keeps its own lists of scoring methods and layouts, checked against the
  types at compile time, because src/lib may not import the schema.

## Why

The admin page (E13-2) counts the funnel in SQL from these rows, so every event must be
written at the moment the step succeeds and never hold anything about a person beyond ids.
