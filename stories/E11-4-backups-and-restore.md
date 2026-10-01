# E11-4 Backups nightly with a tested restore

User: Mihai, the night something goes wrong
Status: ready
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
