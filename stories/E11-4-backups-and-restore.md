# E11-4 Backups nightly with a tested restore

User: Mihai, the night something goes wrong
Status: built
Outcome: a nightly dump of the database and the bucket, and one restore into a fresh database
performed and documented before launch.

## Acceptance criteria
1. `npm run backup` writes a timestamped `pg_dump` (custom format) and a listing plus copy of
   the bucket objects to a backup location set by `BACKUP_PATH` (a folder locally, an S3
   prefix at the gate); missing variable: named, and stop.
2. `npm run restore -- [BACKUP]` restores into the database DATABASE_URL names after a typed
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
- Acceptance 2: `npm run restore -- [BACKUP]` (a folder, or an s3:// prefix at the gate) asks
  for the database's name to be typed without showing it, refuses a database holding any table,
  sequence, index or type, restores the dump in one transaction (a failure leaves the database
  empty), puts the objects back only into an empty bucket (into a bucket in use they would bring
  back files deleted since), checks each one is there, and compares the row counts with the
  manifest. The connection goes to pg_dump and pg_restore in libpq's environment variables, so
  the password is never on a command line, and error text has it taken out.
- Acceptance 3: met 2026-10-05. docs/runbooks/backup-restore.md documents both, with a full
  restore in the build session (2026-10-04: 20 tables, 78,114 rows before and after, 1.0 s) and
  Mihai's on his PC (2026-10-05: 24 tables, 340 rows before and after, 0.8 s; the 4 objects
  skipped because the app's bucket was in use, as the restore is meant to; CI's backup:check
  restores objects into an empty bucket on every push).
- Acceptance 4: the runbook carries the cron line for the host; nothing runs on its own locally.
- Acceptance 5: CI runs `npm run backup:check` after the end-to-end tests: a backup, a restore
  into a new empty database, every table's row count compared (the migration log included),
  the database dropped and the backup folder deleted. For the objects it puts a probe object,
  restores into a new empty bucket (CI's RustFS) and checks every object's size and the probe
  byte for byte, then deletes that bucket. In the session (in-memory bucket): 21 tables, 78,432
  rows and 1 object in 0.9 s.
- After the fresh-context audit (3 blocking, 9 should-fix, 6 nits): design note 75, Audit.
- src/lib/backup.ts holds the deciding parts (which command, where, the name, the comparison)
  with src/lib/backup.test.ts.
