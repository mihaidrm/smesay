# Schema v1 (generated)

v1, 2026-10-05 (the date of the latest migration, 0034_guide_state).

Generated from the snapshot of the 35 migrations in drizzle/ (0034_snapshot.json) by
`node scripts/schema-doc.mjs --write`; the pre-commit hook fails when this file is stale. The design
is in stories/E1-2-schema-v1.md and the enums in INTERFACES.md. Column types are Postgres types;
fk = foreign key, pk = primary key. Triggers live in the custom migrations
(drizzle/0001_item_text_and_version_immutable.sql; drizzle/0020_results_notify.sql, the NOTIFY of
live updates), not in the snapshot.

## Rules

- Every application table carries workspace_id with a foreign key to workspace. Child rows reference
  their parent on (parent_id, workspace_id), so a row cannot point at another workspace's parent.
  The better-auth tables (user, session, account, verification) are the exception: a user exists
  before any workspace; workspace_member is the bridge. src/db/schema.test.ts checks it on every run.
- Item text is never overwritten: original_text is kept beside reader_text, cannot be blank, and a
  trigger refuses any update that changes it. item_set.version is never renumbered (trigger).
- A response is pinned to the set version its instrument was built from: (instrument_id,
  item_set_id) references instrument; its invite belongs to that instrument; an answer names an
  item of that set version (answer.item_set_id); an instrument is built on a set of its own project.
  Instruments, invites, set versions and items with responses or answers under them cannot be
  deleted (on delete restrict). Deleting a workspace deletes everything in it (cascade); deleting
  a project deletes its sets, items, instruments, invites, insights and runs, and is refused while
  responses exist (decision 0028).
- Enum columns are text with a check constraint, so adding a value is a plain migration.
- Tokens (invite.token, response.device_token) are at least 32 characters; crypto.randomBytes(16)
  as hex gives exactly 32.

## workspace

organisation: members, AI budget, branding defaults (accent and logo); deleted_at starts the 24-hour removal (E11).

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| name | text | not null |
| slug | text | not null, unique |
| accent_hex | text |  |
| logo_object_key | text |  |
| ai_budget_eur | integer | not null, default 10 |
| plan | text | not null, default free |
| created_at | timestamp with time zone | not null, default now() |
| deleted_at | timestamp with time zone |  |
| deleted_by | text | fk user.id, on delete set null |
| first_source | text |  |

Indexes: workspace_slug_idx (unique) on slug.
Checks: workspace_plan_check: plan in ('free', 'pro', 'team', 'enterprise').

## workspace_member

who belongs to a workspace and as what (owner, member); user_id is better-auth's.

| Column | Type | Notes |
|---|---|---|
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| user_id | text | fk user.id, on delete cascade, not null |
| role | text | not null |
| created_at | timestamp with time zone | not null, default now() |
| quickstart_seen_at | timestamp with time zone |  |

Primary key: (workspace_id, user_id).

Indexes: workspace_member_user_idx on user_id.
Checks: workspace_member_role_check: role in ('owner', 'member').

## workspace_invite

an open invitation by email (E2-4); becomes a workspace_member row on the invitee's first signed-in request.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| email | text | not null |
| role | text | not null, default member |
| invited_by | text | fk user.id, on delete set null |
| invited_at | timestamp with time zone | not null, default now() |
| accepted_at | timestamp with time zone |  |

Indexes: workspace_invite_email_uq (unique) on workspace_id, email; workspace_invite_email_idx on email.
Checks: workspace_invite_role_check: role in ('owner', 'member').

## project

one validation effort; the AI context (decision 0011); is_sample marks the watermarked sample.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| name | text | not null |
| context_goal | text |  |
| context_terms | text |  |
| is_sample | boolean | not null, default false |
| created_by | text | fk user.id, on delete set null |
| created_at | timestamp with time zone | not null, default now() |
| updated_at | timestamp with time zone | not null, default now() |
| archived_at | timestamp with time zone |  |

Unique: project_id_workspace_uq on id, workspace_id.

Indexes: project_workspace_idx on workspace_id; project_created_by_idx on created_by.

## item_set

one imported or pasted version of the list (decision 0010); version is unique per project.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| project_id | uuid | fk project.id with workspace_id, on delete cascade, not null |
| version | integer | not null |
| source | text | not null |
| source_filename | text |  |
| import_report | jsonb |  |
| imported_by | text | fk user.id, on delete set null |
| upload_id | uuid | fk upload.id with workspace_id, unique |
| imported_at | timestamp with time zone | not null, default now() |
| areas | jsonb |  |
| shape_runs | integer | not null, default 0 |
| shaped_at | timestamp with time zone |  |
| context_used | jsonb |  |

Unique: item_set_id_workspace_uq on id, workspace_id; item_set_id_project_uq on id, project_id.

Foreign keys: item_set_project_fk (project_id, workspace_id) references project (id, workspace_id) on delete cascade; item_set_upload_fk (upload_id, workspace_id) references upload (id, workspace_id).

Indexes: item_set_workspace_idx on workspace_id; item_set_project_version_idx (unique) on project_id, version; item_set_upload_idx (unique) on upload_id.
Checks: item_set_source_check: source in ('xlsx', 'csv', 'pasted'); item_set_version_check: version >= 1.

## item

one requirement: original_text is never overwritten, reader_text sits beside it (E4); area, proposed value, custom fields, flags.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| item_set_id | uuid | fk item_set.id with workspace_id, on delete cascade, not null |
| position | integer | not null |
| source_ref | text |  |
| original_text | text | not null |
| reader_text | text |  |
| reader_status | text |  |
| area | text |  |
| area_rationale | text |  |
| proposed_value | text |  |
| custom | jsonb |  |
| flags | jsonb |  |
| perspectives | text[] | not null, default {} |

Unique: item_id_workspace_uq on id, workspace_id; item_id_item_set_uq on id, item_set_id.

Foreign keys: item_item_set_fk (item_set_id, workspace_id) references item_set (id, workspace_id) on delete cascade.

Indexes: item_workspace_idx on workspace_id; item_set_idx on item_set_id.
Checks: item_original_text_check: length(btrim(original_text)) > 0; item_reader_status_check: reader_status is null or reader_status in ('suggested', 'accepted', 'rejected').

## instrument

how one set version is shown to respondents: method, proposed value shown or not, layout, intro, respondent fields, closing (decisions 0014, 0016, 0018).

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| project_id | uuid | fk project.id with workspace_id, on delete cascade, not null |
| item_set_id | uuid | fk item_set.id with workspace_id, on delete restrict, fk item_set.id with project_id, on delete restrict, not null |
| title | text | not null |
| intro | text |  |
| method | text | not null, default moscow |
| show_proposed | boolean | not null, default true |
| layout | text | not null, default chapters |
| respondent_fields | jsonb | not null, default [] |
| scale_labels | jsonb |  |
| perspectives | jsonb | not null, default [] |
| closing | jsonb | not null, default {"confidence": true, "missingForm": true, "signOffText": ""} |
| published_at | timestamp with time zone |  |
| created_at | timestamp with time zone | not null, default now() |

Unique: instrument_id_workspace_uq on id, workspace_id; instrument_id_item_set_uq on id, item_set_id.

Foreign keys: instrument_project_fk (project_id, workspace_id) references project (id, workspace_id) on delete cascade; instrument_item_set_fk (item_set_id, workspace_id) references item_set (id, workspace_id) on delete restrict; instrument_item_set_project_fk (item_set_id, project_id) references item_set (id, project_id) on delete restrict.

Indexes: instrument_workspace_idx on workspace_id; instrument_project_idx on project_id; instrument_item_set_idx on item_set_id.
Checks: instrument_method_check: method in ('moscow', 'fit', 'kcd'); instrument_layout_check: layout in ('chapters', 'item', 'page').

## invite

a public link or a personal link per email; opens and closes; passcode; revoked; reminders. token is 128-bit random.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| instrument_id | uuid | fk instrument.id with workspace_id, on delete cascade, not null |
| kind | text | not null |
| token | text | not null, unique |
| email | text |  |
| name | text |  |
| role_hint | text |  |
| opens_at | timestamp with time zone |  |
| closes_at | timestamp with time zone |  |
| passcode_hash | text |  |
| revoked_at | timestamp with time zone |  |
| reminders_sent | integer | not null, default 0 |
| last_reminder_at | timestamp with time zone |  |
| send_started_at | timestamp with time zone |  |
| sent_at | timestamp with time zone |  |
| send_error | text |  |
| created_at | timestamp with time zone | not null, default now() |

Unique: invite_id_workspace_uq on id, workspace_id; invite_id_instrument_uq on id, instrument_id.

Foreign keys: invite_instrument_fk (instrument_id, workspace_id) references instrument (id, workspace_id) on delete cascade.

Indexes: invite_workspace_idx on workspace_id; invite_instrument_idx on instrument_id; invite_token_idx (unique) on token; invite_personal_email_idx (unique) on instrument_id, email where invite.kind = 'personal'.
Checks: invite_kind_check: kind in ('public', 'personal'); invite_personal_email_check: kind = 'public' or email is not null; invite_token_length_check: length(token) >= 32.

## response

one respondent's session against one instrument, pinned to the set version it was given; fields, confidence, sign-off, submitted_at.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| instrument_id | uuid | fk instrument.id with workspace_id, on delete restrict, fk instrument.id with item_set_id, on delete restrict, not null |
| item_set_id | uuid | not null |
| invite_id | uuid | fk invite.id with workspace_id, on delete restrict, fk invite.id with instrument_id, on delete restrict, not null |
| device_token | text | not null, unique |
| fields | jsonb | not null, default {} |
| perspectives | text[] | not null, default {} |
| confidence | integer |  |
| signed_off | boolean | not null, default false |
| submitted_at | timestamp with time zone |  |
| first_submitted_at | timestamp with time zone |  |
| closing_answer | text |  |
| sign_off_text | text |  |
| wrap_version | integer | not null, default 0 |
| wrap_writer | text |  |
| wrap_writer_seq | integer | not null, default 0 |
| created_at | timestamp with time zone | not null, default now() |
| updated_at | timestamp with time zone | not null, default now() |

Unique: response_id_workspace_uq on id, workspace_id; response_id_item_set_uq on id, item_set_id.

Foreign keys: response_instrument_fk (instrument_id, workspace_id) references instrument (id, workspace_id) on delete restrict; response_instrument_set_fk (instrument_id, item_set_id) references instrument (id, item_set_id) on delete restrict; response_invite_fk (invite_id, workspace_id) references invite (id, workspace_id) on delete restrict; response_invite_instrument_fk (invite_id, instrument_id) references invite (id, instrument_id) on delete restrict.

Indexes: response_workspace_idx on workspace_id; response_instrument_submitted_idx on instrument_id, submitted_at; response_device_token_idx (unique) on device_token; response_invite_idx on invite_id.
Checks: response_confidence_check: confidence is null or (confidence between 1 and 5); response_device_token_length_check: length(device_token) >= 32.

## answer

one answer per item per response: kind (agree, change, disagree, unclear, pick), value, reason, comment.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| response_id | uuid | fk response.id with workspace_id, on delete cascade, fk response.id with item_set_id, on delete cascade, not null |
| item_set_id | uuid | not null |
| item_id | uuid | fk item.id with workspace_id, on delete restrict, fk item.id with item_set_id, on delete restrict, not null |
| kind | text | not null |
| value | text |  |
| reason | text |  |
| comment | text |  |
| version | integer | not null, default 0 |
| writer | text |  |
| writer_seq | integer | not null, default 0 |
| updated_at | timestamp with time zone | not null, default now() |

Foreign keys: answer_response_fk (response_id, workspace_id) references response (id, workspace_id) on delete cascade; answer_item_fk (item_id, workspace_id) references item (id, workspace_id) on delete restrict; answer_response_set_fk (response_id, item_set_id) references response (id, item_set_id) on delete cascade; answer_item_set_fk (item_id, item_set_id) references item (id, item_set_id) on delete restrict.

Indexes: answer_workspace_idx on workspace_id; answer_response_item_idx (unique) on response_id, item_id; answer_item_idx on item_id.
Checks: answer_kind_check: kind in ('agree', 'change', 'disagree', 'unclear', 'pick').

## missing_item

what a respondent said was missing, with the area they suggested.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| response_id | uuid | fk response.id with workspace_id, on delete cascade, not null |
| text | text | not null |
| suggested_area | text |  |
| suggested_value | text |  |
| created_at | timestamp with time zone | not null, default now() |

Foreign keys: missing_item_response_fk (response_id, workspace_id) references response (id, workspace_id) on delete cascade.

Indexes: missing_item_workspace_idx on workspace_id; missing_item_response_idx on response_id.
Checks: missing_item_text_check: length(btrim(text)) > 0.

## insight

an AI-written action on a project with the answers it cites and its cost.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| project_id | uuid | fk project.id with workspace_id, on delete cascade, not null |
| title | text | not null |
| why | text |  |
| cited_answer_ids | uuid[] | not null, default {} |
| cited_missing_item_ids | uuid[] | not null, default {} |
| kind | text |  |
| state | text | not null, default open |
| closed_at | timestamp with time zone |  |
| closed_by | text | fk user.id, on delete set null |
| model | text |  |
| tokens_in | integer |  |
| tokens_out | integer |  |
| cost_eur_cents | integer |  |
| created_at | timestamp with time zone | not null, default now() |

Foreign keys: insight_project_fk (project_id, workspace_id) references project (id, workspace_id) on delete cascade.

Indexes: insight_workspace_idx on workspace_id; insight_project_idx on project_id; insight_closed_by_idx on closed_by.
Checks: insight_state_check: state in ('open', 'done', 'dismissed'); insight_kind_check: kind is null or kind in ('rewrite', 'conflict', 'followUp', 'coverage'); insight_closed_check: (state = 'open') = (closed_at is null).

## ai_run

every call to the model: purpose, tokens, cost in euro cents, duration (E4 budget).

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| project_id | uuid | fk project.id with workspace_id, on delete cascade |
| purpose | text | not null |
| model | text | not null |
| tokens_in | integer | not null, default 0 |
| tokens_out | integer | not null, default 0 |
| cost_eur_cents | integer | not null, default 0 |
| duration_ms | integer |  |
| created_at | timestamp with time zone | not null, default now() |

Foreign keys: ai_run_project_fk (project_id, workspace_id) references project (id, workspace_id) on delete cascade.

Indexes: ai_run_workspace_idx on workspace_id; ai_run_project_idx on project_id.
Checks: ai_run_purpose_check: purpose in ('shape', 'insights').

## export_log

every download of an export: who, when, the file, the filter in words, the rows (E10-1, for E11-2).

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| project_id | uuid | fk project.id with workspace_id, on delete cascade |
| made_by | text | fk user.id, on delete set null |
| file | text | not null |
| filter | text |  |
| rows | integer | not null |
| created_at | timestamp with time zone | not null, default now() |

Foreign keys: export_log_project_fk (project_id, workspace_id) references project (id, workspace_id) on delete cascade.

Indexes: export_log_workspace_idx on workspace_id; export_log_project_idx on project_id; export_log_made_by_idx on made_by.
Checks: export_log_file_check: file in ('answers', 'items', 'people', 'missing', 'project', 'summary', 'workspace').

## event

one row per product step from the catalogue: name, counts and fixed values, no personal data beyond the user id; no workspace for sign-ups and deletions (E13-1, docs/analytics.md).

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade |
| user_id | text | fk user.id, on delete set null |
| name | text | not null |
| properties | jsonb | not null, default {} |
| created_at | timestamp with time zone | not null, default now() |

Indexes: event_name_created_idx on name, created_at; event_workspace_idx on workspace_id; event_user_idx on user_id.
Checks: event_respondent_no_user_check: event.name not in ('link_opened', 'response_started', 'response_submitted') or event.user_id is null.

## admin_audit

one row per admin action, written before the action runs and marked done, refused or failed after; the target workspace or person in a column with no foreign key, so a row outlives its target (E14-1).

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| admin_user_id | text | not null |
| action | text | not null |
| target_workspace_id | uuid |  |
| target_user_id | text |  |
| changes | jsonb | not null, default {} |
| outcome | text |  |
| created_at | timestamp with time zone | not null, default now() |

Indexes: admin_audit_created_idx on created_at; admin_audit_workspace_idx on target_workspace_id; admin_audit_admin_idx on admin_user_id.
Checks: admin_audit_action_check: action in ('plan_changed', 'ai_budget_set', 'invite_resent', 'link_revoked', 'workspace_restored', 'note_added', 'magic_link_sent', 'signed_out_everywhere', 'member_removed', 'account_deleted', 'view_started', 'view_stopped'); admin_audit_outcome_check: admin_audit.outcome is null or outcome in ('done', 'refused', 'failed'); admin_audit_target_check: admin_audit.target_workspace_id is not null or admin_audit.target_user_id is not null.

## admin_note

a support note an admin wrote on a workspace, shown only on its admin page; goes with the workspace (E14-2).

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| admin_user_id | text | not null |
| text | text | not null |
| created_at | timestamp with time zone | not null, default now() |

Indexes: admin_note_workspace_idx on workspace_id.
Checks: admin_note_text_check: char_length(admin_note.text) between 1 and 2000.

## upload

a file a PM uploaded for a project (E3-2): the object key under uploads/<workspace id>/, the sheet and header row chosen, a ten-row preview and the column mapping in jsonb.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| project_id | uuid | fk project.id with workspace_id, on delete cascade, not null |
| object_key | text | not null |
| filename | text | not null |
| kind | text | not null |
| byte_size | integer | not null |
| sheet | text |  |
| header_row | integer |  |
| preview | jsonb | not null |
| mapping | jsonb |  |
| created_by | text | fk user.id, on delete set null |
| created_at | timestamp with time zone | not null, default now() |

Unique: upload_id_workspace_uq on id, workspace_id.

Foreign keys: upload_project_fk (project_id, workspace_id) references project (id, workspace_id) on delete cascade.

Indexes: upload_project_idx on project_id.
Checks: upload_kind_check: kind in ('xlsx', 'csv', 'pasted').

## workspace_mapping

a column mapping remembered per workspace (E3-3), keyed by the sorted headers; the next file with the same headers maps itself.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| headers_key | text | not null |
| mapping | jsonb | not null |
| updated_at | timestamp with time zone | not null, default now() |

Indexes: workspace_mapping_headers_idx (unique) on workspace_id, headers_key.

## user

better-auth: the signed-in person.

| Column | Type | Notes |
|---|---|---|
| id | text | pk |
| name | text | not null |
| email | text | not null |
| email_verified | boolean | not null, default false |
| image | text |  |
| created_at | timestamp | not null, default now() |
| updated_at | timestamp | not null, default now() |
| last_sign_in_at | timestamp |  |
| guide_state | jsonb | not null, default {"tipsOff": false, "dismissed": []} |
| results_prefs | jsonb | not null, default {} |

Unique: user_email_unique on email.

## session

better-auth: a browser session.

| Column | Type | Notes |
|---|---|---|
| id | text | pk |
| expires_at | timestamp | not null |
| token | text | not null |
| created_at | timestamp | not null, default now() |
| updated_at | timestamp | not null |
| ip_address | text |  |
| user_agent | text |  |
| user_id | text | fk user.id, on delete cascade, not null |
| current_workspace_id | uuid |  |
| view_as_workspace_id | uuid |  |
| view_as_until | timestamp |  |

Unique: session_token_unique on token.

Indexes: session_userId_idx on user_id.

## account

better-auth: a sign-in method (magic link, Google; Microsoft and Apple after launch, decision 0034) attached to a user.

| Column | Type | Notes |
|---|---|---|
| id | text | pk |
| account_id | text | not null |
| provider_id | text | not null |
| user_id | text | fk user.id, on delete cascade, not null |
| access_token | text |  |
| refresh_token | text |  |
| id_token | text |  |
| access_token_expires_at | timestamp |  |
| refresh_token_expires_at | timestamp |  |
| scope | text |  |
| password | text |  |
| created_at | timestamp | not null, default now() |
| updated_at | timestamp | not null |

Indexes: account_userId_idx on user_id.

## verification

better-auth: one-time tokens for magic links and email checks.

| Column | Type | Notes |
|---|---|---|
| id | text | pk |
| identifier | text | not null |
| value | text | not null |
| expires_at | timestamp | not null |
| created_at | timestamp | not null, default now() |
| updated_at | timestamp | not null, default now() |

Indexes: verification_identifier_idx on identifier.
