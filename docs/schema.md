# Schema v1 (generated)

v1, 2026-10-01 (the date of the latest migration, 0001_item_text_and_version_immutable).

Generated from the snapshot of the 2 migrations in drizzle/ (0001_snapshot.json) by
`node scripts/schema-doc.mjs --write`; the pre-commit hook fails when this file is stale. The design
is in stories/E1-2-schema-v1.md and the enums in INTERFACES.md. Column types are Postgres types;
fk = foreign key, pk = primary key. Triggers live in the custom migration
(drizzle/0001_item_text_and_version_immutable.sql), not in the snapshot.

## Rules

- Every application table carries workspace_id with a foreign key to workspace. Child rows reference
  their parent on (parent_id, workspace_id), so a row cannot point at another workspace's parent.
  The better-auth tables (user, session, account, verification) are the exception: a user exists
  before any workspace; workspace_member is the bridge. src/db/schema.test.ts checks it on every run.
- Item text is never overwritten: original_text is kept beside reader_text, cannot be blank, and a
  trigger refuses any update that changes it. item_set.version is never renumbered (trigger).
- A response is pinned to the set version its instrument was built from: (instrument_id,
  item_set_id) references instrument. Instruments, invites, set versions and items with responses
  or answers under them cannot be deleted (on delete restrict). Deleting a workspace deletes
  everything in it (cascade); deleting a project deletes its sets, items, instruments and runs,
  and is refused while responses exist.
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
| ai_budget_eur | integer | not null, default 50 |
| created_at | timestamp with time zone | not null, default now() |
| deleted_at | timestamp with time zone |  |

Indexes: workspace_slug_idx (unique) on slug.

## workspace_member

who belongs to a workspace and as what (owner, member); user_id is better-auth's.

| Column | Type | Notes |
|---|---|---|
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| user_id | text | fk user.id, on delete cascade, not null |
| role | text | not null |
| created_at | timestamp with time zone | not null, default now() |

Primary key: (workspace_id, user_id).

Indexes: workspace_member_user_idx on user_id.
Checks: workspace_member_role_check: role in ('owner', 'member').

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
| archived_at | timestamp with time zone |  |

Unique: project_id_workspace_uq on id, workspace_id.

Indexes: project_workspace_idx on workspace_id.

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
| imported_at | timestamp with time zone | not null, default now() |

Unique: item_set_id_workspace_uq on id, workspace_id.

Foreign keys: item_set_project_fk (project_id, workspace_id) references project (id, workspace_id) on delete cascade.

Indexes: item_set_workspace_idx on workspace_id; item_set_project_version_idx (unique) on project_id, version.
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

Unique: item_id_workspace_uq on id, workspace_id.

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
| item_set_id | uuid | fk item_set.id with workspace_id, on delete restrict, not null |
| title | text | not null |
| intro | text |  |
| method | text | not null, default moscow |
| show_proposed | boolean | not null, default true |
| layout | text | not null, default chapters |
| respondent_fields | jsonb | not null, default [] |
| closing | jsonb | not null, default {} |
| created_at | timestamp with time zone | not null, default now() |

Unique: instrument_id_workspace_uq on id, workspace_id; instrument_id_item_set_uq on id, item_set_id.

Foreign keys: instrument_project_fk (project_id, workspace_id) references project (id, workspace_id) on delete cascade; instrument_item_set_fk (item_set_id, workspace_id) references item_set (id, workspace_id) on delete restrict.

Indexes: instrument_workspace_idx on workspace_id; instrument_project_idx on project_id.
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
| created_at | timestamp with time zone | not null, default now() |

Unique: invite_id_workspace_uq on id, workspace_id.

Foreign keys: invite_instrument_fk (instrument_id, workspace_id) references instrument (id, workspace_id) on delete cascade.

Indexes: invite_workspace_idx on workspace_id; invite_instrument_idx on instrument_id; invite_token_idx (unique) on token.
Checks: invite_kind_check: kind in ('public', 'personal'); invite_personal_email_check: kind = 'public' or email is not null; invite_token_length_check: length(token) >= 32.

## response

one respondent's session against one instrument, pinned to the set version it was given; fields, confidence, sign-off, submitted_at.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| instrument_id | uuid | fk instrument.id with workspace_id, on delete restrict, fk instrument.id with item_set_id, on delete restrict, not null |
| item_set_id | uuid | not null |
| invite_id | uuid | fk invite.id with workspace_id, on delete restrict, not null |
| device_token | text | not null, unique |
| fields | jsonb | not null, default {} |
| confidence | integer |  |
| signed_off | boolean | not null, default false |
| submitted_at | timestamp with time zone |  |
| created_at | timestamp with time zone | not null, default now() |
| updated_at | timestamp with time zone | not null, default now() |

Unique: response_id_workspace_uq on id, workspace_id.

Foreign keys: response_instrument_fk (instrument_id, workspace_id) references instrument (id, workspace_id) on delete restrict; response_instrument_set_fk (instrument_id, item_set_id) references instrument (id, item_set_id) on delete restrict; response_invite_fk (invite_id, workspace_id) references invite (id, workspace_id) on delete restrict.

Indexes: response_workspace_idx on workspace_id; response_instrument_submitted_idx on instrument_id, submitted_at; response_device_token_idx (unique) on device_token.
Checks: response_confidence_check: confidence is null or (confidence between 1 and 5); response_device_token_length_check: length(device_token) >= 32.

## answer

one answer per item per response: kind (agree, change, disagree, unclear, pick), value, reason, comment.

| Column | Type | Notes |
|---|---|---|
| id | uuid | pk, default gen_random_uuid() |
| workspace_id | uuid | fk workspace.id, on delete cascade, not null |
| response_id | uuid | fk response.id with workspace_id, on delete cascade, not null |
| item_id | uuid | fk item.id with workspace_id, on delete restrict, not null |
| kind | text | not null |
| value | text |  |
| reason | text |  |
| comment | text |  |
| updated_at | timestamp with time zone | not null, default now() |

Foreign keys: answer_response_fk (response_id, workspace_id) references response (id, workspace_id) on delete cascade; answer_item_fk (item_id, workspace_id) references item (id, workspace_id) on delete restrict.

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
| state | text | not null, default open |
| model | text |  |
| tokens_in | integer |  |
| tokens_out | integer |  |
| cost_eur_cents | integer |  |
| created_at | timestamp with time zone | not null, default now() |

Foreign keys: insight_project_fk (project_id, workspace_id) references project (id, workspace_id) on delete cascade.

Indexes: insight_workspace_idx on workspace_id; insight_project_idx on project_id.
Checks: insight_state_check: state in ('open', 'done', 'dismissed').

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

Indexes: ai_run_workspace_idx on workspace_id.
Checks: ai_run_purpose_check: purpose in ('shape', 'insights').

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

Unique: session_token_unique on token.

Indexes: session_userId_idx on user_id.

## account

better-auth: a sign-in method (magic link, Google, Microsoft) attached to a user.

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
