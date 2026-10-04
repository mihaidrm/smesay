# E11-4 Backups nightly with a tested restore

User: Mihai, the night something goes wrong
Status: built
Outcome: a nightly dump of the database and the bucket, and one restore into a fresh database
performed and documented before launch.

## Acceptance criteria
1. `npm run backup` writes a timestamped `pg_dump` (custom format) and a listing plus copy of
   the bucket objects to a backup location set by `BACKUP_PATH` (a folder locally, an S3
   prefix at the gate); missing variable: named, and stop.
2. `npm run restore -- [DUMP]` restores into the database DATABASE_URL names after a typed
   confirmation of the database name; refuses when the database is not empty.
3. docs/runbooks/backup-restore.md documents both, with one full restore performed on Mihai's
   PC into a fresh database and the date, row counts before and after, and the time it took
   written in the file (SECURITY.md, Dependencies and backups).
4. The nightly schedule is a cron line in the runbook for the host at the launch gate; locally
   nothing runs on its own.
5. A CI job runs backup then restore into the test database and compares table counts.

## Out of scope
- Point-in-time recovery: the managed database's feature at the gate.

## Open questions
- None.

## Technical notes
pg_dump and pg_restore from the postgres:16 image (`docker compose exec postgres pg_dump`) so
nothing is installed on the PC; the bucket copy uses the S3 client from E2-5.

Built 2026-10-04 (design note 75, decision 0044):
- Acceptance 1: `npm run backup` (scripts/backup.ts, scripts/backup-tools.ts) writes a folder
  named by its time with database.dump (pg_dump -Fc), objects/[KEY] for every object in the
  bucket, objects.txt and manifest.json (every table's row count), to BACKUP_PATH: a folder, or
  s3://[BUCKET]/[PREFIX] with the app's S3 settings. A missing variable is named and nothing
  runs. pg_dump and pg_restore run from the PATH, from the compose service (nothing installed
  on the PC) or from the postgres:16-alpine image (CI), as PG_TOOLS says.
- Acceptance 2: `npm run restore -- [FOLDER]` asks for the database's name to be typed, refuses
  a database with tables, restores the dump, puts back the objects the bucket lacks, and
  compares the row counts with the manifest.
- Acceptance 3: docs/runbooks/backup-restore.md documents both, with one full restore performed
  in the build session (2026-10-04: 20 tables, 78,114 rows before and after, 1.0 s). The restore
  on Mihai's PC is his to run and write in the same table.
- Acceptance 4: the runbook carries the cron line for the host; nothing runs on its own locally.
- Acceptance 5: CI runs `npm run backup:check` after the end-to-end tests: a backup, a restore
  into a new empty database, every table's row count compared, the database dropped.
- src/lib/backup.ts holds the deciding parts (which command, where, the name, the comparison)
  with src/lib/backup.test.ts.
