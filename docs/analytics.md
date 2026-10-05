# Product events

The steps that matter in the product, one row each in the `event` table (stories/E13-1). Written
only by `track(name, properties, { workspaceId, userId })` in src/lib/analytics.ts, from the
catalogue in src/lib/analytics-catalogue.ts (this file and that one list the same events; a
unit test checks that every event below except the guide's is called somewhere in the app).

What a property can hold: a count (a whole number from 0 to 1,000,000,000), a uuid or one value
of a fixed list (the guide's tip ids are an empty list until E15 names them). Nothing else fits, so no email, name
or typed text is ever stored. A respondent's event carries no user id (track() refuses one,
and a check on the table, event_respondent_no_user_check, too). Only src/lib/analytics.ts
may import the table's helpers (the lint rule; tests aside). A refused event or a
failed write is logged without its values and never fails what the person was doing.

| Event | Properties | Written where | Workspace | User |
|---|---|---|---|---|
| signed_up | none | better-auth's user create hook, after the row is committed (src/lib/auth.ts) | none | the new user |
| workspace_created | none | naming the workspace (src/app/app/actions.ts) | yes | yes |
| member_joined | none | an invitation becoming a membership on the next request (src/lib/current-workspace.ts) | the joined one | yes |
| project_created | from: new, import | New project; Import a project (E10-2) | yes | yes |
| import_committed | source: upload, paste; rows | the import commit (src/lib/imports.ts) | yes | yes |
| shape_run | items; costCents | a shaping run that applied (src/lib/shaping.ts) | yes | yes |
| instrument_published | method: moscow, fit, kcd; layout: chapters, item, page | Publish on Share, and Publish again after a withdrawn link | yes | yes |
| invite_sent | kind: personal, public | each personal invite sent or renewed; the public link published (again after a withdrawal) | yes | yes |
| link_opened | kind: personal, public; instrument | each render of an open link's app, including a mail scanner's or a preview fetcher's request and the PM opening the link | yes | none |
| response_started | instrument | a new response at Start | yes | none |
| response_submitted | instrument; items; minutes (from Start to the first Submit) | the first Submit | yes | none |
| reminder_sent | none | each reminder sent | yes | yes |
| insight_run | actions (kept); costCents | Write actions after a run (src/lib/insights.ts) | yes | yes |
| export_downloaded | format: csv, json, pdf, zip | each download (the export routes) | yes | yes |
| sample_opened | none | opening the sample's Results (tabs, filters and reloads after that are not counted) | yes | yes |
| sample_deleted | none | Delete sample | yes | yes |
| quickstart_seen | none | the first showing of the quickstart (E12-2) | yes | yes |
| workspace_deleted | none | Delete this workspace | none (kept after the workspace goes) | yes |
| guide_shown | tip | E15-5, once the guide card is built | yes | yes |
| guide_dismissed | tip | E15-5 | yes | yes |
| guide_acted | tip | E15-5 | yes | yes |

Kept and removed: a workspace's events go with it when the removal job deletes the workspace
(the foreign key cascades, E11-2). signed_up and workspace_deleted hold no workspace and stay;
a removed user's id goes null on them. Indexes on (name, created_at), workspace_id and user_id.
The admin page (E13-2) counts the funnel from this table in SQL.
