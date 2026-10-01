# E1-2 Schema v1 and migrations

User: Claude, building every later epic on it; Mihai, reading docs/schema.md
Status: building
Outcome: the object model in docs/schema.md exists as Postgres tables, created by migrations
that run from an empty database, with every table scoped to a workspace.

## Acceptance criteria
1. `npm run db:migrate` on an empty database creates every table below and records the
   migration; running it again changes nothing (exit 0, no SQL executed). A unit test in CI
   drops and recreates the test database, applies the migrations and asserts both.
2. Every table has a `workspace_id` column with a foreign key to `workspace`, or is reachable
   only through a table that does (`answer` through `response`, `item` through `item_set`).
   A test reads the information schema and fails if a table has neither.
3. Item text is never overwritten: `item` has `original_text` and `reader_text`, both kept;
   a check constraint keeps `original_text` non-empty. A test proves an update that would
   blank the original is refused.
4. A response references the set version it was given: `response.item_set_id` is a foreign
   key, so a re-import (new `item_set` version) never changes what an old response points at.
5. docs/schema.md is rewritten from the migration (tables, columns, types, keys) and says
   "v1, 2026-10-xx"; INTERFACES.md carries the enums below before the migration is generated
   (CLAUDE.md: change a shared shape in INTERFACES.md first).
6. `npm run db:generate` produces no new migration after the story is merged (the schema file
   and the migration folder agree).

## Out of scope
- Rows and seed data: E1-4.
- Query helpers and the cross-workspace test: E1-3.
- Sign-in, sessions, members joining: E2 (the better-auth tables are generated here so the
  foreign keys exist, their behaviour is E2's).
- Jira or Notion fields, write-back: R2.

## Open questions
- None. The business plan's "rolls back" became "applies from empty, a second apply is a
  no-op, CI recreates the database every run" (decision 0027): drizzle-kit has no
  down-migration command in its migrate documentation (orm.drizzle.team/docs/drizzle-kit-migrate,
  read 2026-10-01).

## Technical notes
Tables (all timestamps `timestamptz`, UTC; ids `uuid` with `gen_random_uuid()` except the
better-auth tables, which use the text ids the Better Auth CLI generates):

- `workspace`: id, name, slug (unique), accent_hex, logo_object_key, ai_budget_eur (default 50),
  created_at, deleted_at (E11 removes rows within 24 hours of deletion).
- `workspace_member`: workspace_id, user_id (text, references the better-auth `user`), role
  (owner, member), created_at; primary key (workspace_id, user_id).
- `project`: id, workspace_id, name, context_goal, context_terms (decision 0011), created_by
  (user_id), created_at, archived_at.
- `item_set`: id, workspace_id, project_id, version (integer, unique per project), source
  (xlsx, csv, pasted), source_filename, imported_at, import_report (jsonb: empty rows,
  duplicates, long items). Decision 0010.
- `item`: id, workspace_id, item_set_id, position, source_ref, original_text (not empty),
  reader_text (nullable), reader_status (suggested, accepted, rejected), area, area_rationale,
  proposed_value, custom (jsonb, up to five custom fields in E3), flags (jsonb: duplicate of,
  ambiguity text, dismissed).
- `instrument`: id, workspace_id, project_id, item_set_id, title, intro, method (moscow, fit,
  kcd), show_proposed (boolean), layout (chapters, item, page), respondent_fields (jsonb:
  name, type, mandatory, options), closing (jsonb: confidence on, missing form on, sign-off
  text), created_at.
- `invite`: id, workspace_id, instrument_id, kind (public, personal), token (text, unique,
  from crypto.randomBytes(16)), email (personal only), name, role_hint, opens_at, closes_at,
  passcode_hash, revoked_at, reminders_sent (integer), last_reminder_at.
- `response`: id, workspace_id, instrument_id, item_set_id, invite_id, device_token (text,
  separate from the invite token), fields (jsonb: the configured respondent fields),
  confidence (1 to 5), signed_off (boolean), submitted_at, created_at, updated_at.
- `answer`: id, response_id, item_id, kind (agree, change, disagree, unclear, pick), value,
  reason, comment, updated_at; unique (response_id, item_id). Decisions 0014 and 0018.
- `missing_item`: id, response_id, text, suggested_area, created_at.
- `insight`: id, workspace_id, project_id, title, why, cited_answer_ids (uuid[]), state (open,
  done, dismissed), model, tokens_in, tokens_out, cost_eur, created_at.
- `ai_run`: id, workspace_id, project_id, purpose (shape, insights), model, tokens_in,
  tokens_out, cost_eur, duration_ms, created_at (E4's budget and logging land here).
- better-auth: `user`, `session`, `account`, `verification`, generated with the Better Auth
  CLI from src/lib/auth.ts (better-auth.com/docs/adapters/drizzle; core schema at
  better-auth.com/docs/concepts/database). Their columns are the CLI's, not ours.

INTERFACES.md gets: AnswerKind, ScoringMethod, Layout, InviteKind, InsightState, ReaderStatus,
RespondentFieldSpec, ImportReport. Enums as Postgres enums or text with a check constraint;
pick text with checks so adding a value is a plain migration.

Indexes: workspace_id on every scoped table; (project_id, version) on item_set; token on
invite; (instrument_id, submitted_at) on response; (response_id) on answer.
