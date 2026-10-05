# E13-1 Product events: a catalogue, a log table and one tracking function

User: Mihai, finding out what people do in the product
Status: built
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
   0028; INTERFACES.md gets EventName and the property shapes first.
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
Writes are awaited inside the request after the step has succeeded (design note 82); an insert
that fails never fails the user's action; the failure is logged. Index on (name, created_at) and on workspace_id.

Built 2026-10-05 (design note 82, decision 0044):
- Acceptance 1: docs/analytics.md and src/lib/analytics-catalogue.ts list the 22 events (21 at the build; shape_failed added by E15-4 on 2026-10-05, carrying
  the refusal reason and the project id, for the Shape rescue tip).
  project_created carries from (new, import), insight_run carries actions and costCents (the
  story named none; both are counts or fixed values). trackProblem refuses a name not in the
  catalogue (src/db/queries/analytics.test.ts).
- Acceptance 2: the event table, migration 0028 (drizzle/0028_events.sql); workspace_id
  nullable with a cascading foreign key, user_id nullable (set null when the user goes; a check
  refuses it on the three respondent events);
  indexes on (name, created_at), workspace_id, user_id. INTERFACES.md has EventName and the
  property shapes.
- Acceptance 3: track() in src/lib/analytics.ts is the only writer (events.record); a
  property is a count, a uuid, a short key or a fixed value, so an email, a name or typed text
  is refused (the test feeds each); respondent events refuse a user id.
- Acceptance 4: track() calls at the 18 events of built stories (docs/analytics.md, Written
  where); a test checks each is called somewhere. The guide's three events are in E15-5's
  acceptance 1.
- Acceptance 5: the foreign key cascades when the removal job deletes the workspace (the
  test purges one); signed_up and workspace_deleted hold no workspace and stay.
