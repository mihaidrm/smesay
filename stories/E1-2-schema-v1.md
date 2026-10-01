# E1-2 Schema v1 and migrations

User: Claude, building every later epic on it; Mihai, reading docs/schema.md
Status: built
Outcome: the object model in docs/schema.md exists as Postgres tables, created by migrations
that run from an empty database, with every table scoped to a workspace.

## Acceptance criteria
1. `npm run db:migrate` on an empty database creates every table below and records the
   migrations; running it again changes nothing (exit 0, the migrations table is unchanged).
   A unit test in CI drops and recreates its own test database (`<database>_test`, never the
   one DATABASE_URL names), applies the migrations and asserts both.
2. Every application table has a `workspace_id` column with a foreign key to `workspace`, and
   every child row references its parent on `(parent_id, workspace_id)`, so a child can never
   belong to a different workspace than its parent. The better-auth tables (`user`, `session`,
   `account`, `verification`) are outside the rule: a user exists before any workspace and
   `workspace_member` is the bridge (decision 0028, pending). A test reads the information
   schema and fails if an application table has no such foreign key, and proves that a child
   pointing at another workspace's parent is refused.
3. Item text is never overwritten: `item` has `original_text` and `reader_text`, both kept;
   a check constraint keeps `original_text` non-empty and a trigger refuses any update that
   changes it. A test proves both.
4. A response references the set version it was given: `(response.instrument_id,
   response.item_set_id)` is a foreign key to `(instrument.id, instrument.item_set_id)`, so a
   response can only carry the version its instrument shows, and a re-import (new `item_set`
   version) never changes what an old response points at. `item_set.version` is never
   renumbered (trigger).
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
Tables (all timestamps `timestamptz`, UTC; ids `uuid` with `gen_random_uuid()`). The
better-auth tables are the exception on both counts: text ids and `timestamp` without time
zone, as the Better Auth CLI generates them (`npx auth@1.7.7 generate --config src/lib/auth.ts
--output src/db/auth-schema.ts -y`, run 2026-10-01; better-auth.com/docs/concepts/cli). Their
columns are the CLI's, not ours, and are not edited by hand.

Every application table: `workspace_id` (fk workspace, on delete cascade) and an index on it.
Every parent that has children carries a unique constraint on `(id, workspace_id)`
(`<table>_id_workspace_uq`) so children can reference it on both columns.

- `workspace`: id, name, slug (unique), accent_hex, logo_object_key, ai_budget_eur (default 50),
  created_at, deleted_at (E11 removes rows within 24 hours of deletion).
- `workspace_member`: workspace_id, user_id (text, fk `user`, on delete cascade), role
  (owner, member), created_at; primary key (workspace_id, user_id); index on user_id (the
  sign-in path looks up a user's workspaces).
- `project`: id, workspace_id, name, context_goal, context_terms (decision 0011), is_sample
  (boolean, default false: the watermarked sample project, E1-4), created_by (fk `user`, on
  delete set null), created_at, archived_at.
- `item_set`: id, workspace_id, project_id (fk project with workspace_id, on delete cascade),
  version (integer >= 1, unique per project, never renumbered), source (xlsx, csv, pasted),
  source_filename, import_report (jsonb, ImportReport in INTERFACES.md), imported_at. Decision
  0010.
- `item`: id, workspace_id, item_set_id (fk item_set with workspace_id, on delete cascade),
  position, source_ref, original_text (not blank, never changed), reader_text, reader_status
  (suggested, accepted, rejected, or null), area, area_rationale, proposed_value, custom (jsonb,
  up to five custom fields in E3), flags (jsonb, ItemFlags). Index on item_set_id.
- `instrument`: id, workspace_id, project_id (fk project with workspace_id, cascade),
  item_set_id (fk item_set with workspace_id, restrict), title, intro, method (moscow, fit,
  kcd; default moscow, decision 0016), show_proposed (default true, decision 0016), layout
  (chapters, item, page; default chapters, decision 0018), respondent_fields (jsonb, default
  `[]`), closing (jsonb, default `{}`), created_at. Unique (id, item_set_id) so a response can
  reference both. Index on project_id.
- `invite`: id, workspace_id, instrument_id (fk instrument with workspace_id, cascade), kind
  (public, personal), token (text, unique, at least 32 characters: crypto.randomBytes(16) as
  hex), email (required when kind is personal), name, role_hint, opens_at, closes_at,
  passcode_hash, revoked_at, reminders_sent (default 0), last_reminder_at, created_at. Index
  on instrument_id.
- `response`: id, workspace_id, instrument_id, item_set_id, invite_id, device_token (text,
  unique, at least 32 characters, separate from the invite token), fields (jsonb, default
  `{}`), confidence (1 to 5 or null), signed_off (default false), submitted_at, created_at,
  updated_at. Foreign keys: (instrument_id, workspace_id) to instrument, (instrument_id,
  item_set_id) to instrument, (invite_id, workspace_id) to invite, all on delete restrict.
- `answer`: id, workspace_id, response_id (fk response with workspace_id, cascade), item_id
  (fk item with workspace_id, restrict), kind (agree, change, disagree, unclear, pick), value,
  reason, comment, updated_at; unique (response_id, item_id), index on item_id. Decisions
  0014 and 0018.
- `missing_item`: id, workspace_id, response_id (fk response with workspace_id, cascade), text
  (not blank), suggested_area, created_at. Index on response_id.
- `insight`: id, workspace_id, project_id (fk project with workspace_id, cascade), title, why,
  cited_answer_ids (uuid[], default empty), state (open, done, dismissed; default open), model,
  tokens_in, tokens_out, cost_eur_cents, created_at. Index on project_id.
- `ai_run`: id, workspace_id, project_id (nullable, fk project with workspace_id, cascade),
  purpose (shape, insights), model, tokens_in, tokens_out, cost_eur_cents (integers, default
  0), duration_ms, created_at (E4's budget and logging land here).
- better-auth: `user`, `session`, `account`, `verification`, generated with the Better Auth
  CLI from src/lib/auth.ts (better-auth.com/docs/adapters/drizzle; core schema at
  better-auth.com/docs/concepts/database).

Costs are integer euro cents (`cost_eur_cents`), never a float column.

Delete rules (decision 0028, pending): workspace cascades to everything in it; project
cascades to its sets, items, instruments, invites, insights and runs; anything with responses
or answers under it (item_set, item, instrument, invite) is restricted, so deleting a project
that has responses fails until the code deletes the responses first, on purpose. Nothing is
deleted by the application in R1 except through workspace removal (E11); projects are
archived (`archived_at`).

Two rules are triggers in drizzle/0001_item_text_and_version_immutable.sql (a custom migration,
`drizzle-kit generate --custom`): `item.original_text` and `item_set.version` refuse any
update that changes them. Everything else is in drizzle/0000_schema_v1.sql, generated from
src/db/schema.ts.

INTERFACES.md carries the enums (AnswerKind, ScoringMethod, Layout, InviteKind, InsightState,
ReaderStatus, MemberRole, ItemSetSource, AiPurpose) and the jsonb shapes (RespondentFieldSpec,
ClosingSpec, ImportReport, ItemFlags, ResponseFields). Enums are text with a check constraint,
so adding a value is a plain migration.

Indexes: workspace_id on every application table; (project_id, version) unique on item_set;
item_set_id on item; project_id on instrument; instrument_id on invite; token unique on
invite; (instrument_id, submitted_at) and device_token unique on response; (response_id,
item_id) unique and item_id on answer; response_id on missing_item; project_id on insight;
user_id on workspace_member.

Test: src/db/schema.test.ts connects to `<database>_test` on the server DATABASE_URL names
(creating it when missing; refuses hosts other than localhost, 127.0.0.1, ::1, postgres, db),
drops and recreates the public schema, runs the migrations twice through
drizzle-orm's `migrate()` (`npm run db:migrate` runs drizzle-kit migrate on the same drizzle/ folder
and journal; it is checked by hand below), and checks every rule
above with real inserts. docs/schema.md is generated from drizzle/meta by
scripts/schema-doc.mjs, with the triggers noted by hand in its header.
