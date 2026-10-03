# E13-1 Product events: a catalogue, a log table and one tracking function

User: Mihai, finding out what people do in the product
Status: ready
Outcome: every step that matters writes one event row, named from a catalogue, with no
personal data, so the funnel in E13-2 can be counted in SQL.

## Acceptance criteria
1. docs/analytics.md lists the events and their properties: signed_up, workspace_created,
   member_joined, project_created, import_committed (source, rows), shape_run (items, cost
   cents), instrument_published (method, layout), invite_sent (kind), link_opened (kind),
   response_started, response_submitted (items, minutes), reminder_sent, insight_run,
   export_downloaded (format), sample_opened, sample_deleted, quickstart_seen, workspace_deleted;
   from E15-5: guide_shown, guide_dismissed, guide_acted (tip id).
   An event not in the catalogue is refused by the tracking function (unit test).
2. Table event: id, workspace_id (nullable for events before a workspace exists), user_id
   (nullable, never for respondent events), name, properties jsonb, created_at. Migration
   0002 or later; INTERFACES.md gets EventName and the property shapes first.
3. `track(name, properties, { workspaceId, userId })` in src/lib/analytics.ts is the only
   writer; it never stores emails, names, free text or respondent field values (a test feeds
   each and sees them refused); respondent events carry the instrument id and nothing about
   the person.
4. Each story from E2 onward calls track() where its event happens; this story adds the
   calls to the stories already built when it runs, and the Stories board lists the event in
   the technical notes of each later story.
5. Events of a deleted workspace go with it (E11-2); events with no workspace are kept.

## Out of scope
- Showing the events: E13-2. Visitor analytics: E13-3.

## Open questions
- None.

## Technical notes
Writes are fire-and-forget inside the request (an insert that fails never fails the user's
action; the failure is logged). Index on (name, created_at) and on workspace_id.
