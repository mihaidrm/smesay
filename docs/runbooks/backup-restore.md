# Backup and restore

Stories/E11-4. A backup is the database (pg_dump's custom format) and every object in the
bucket, with a manifest of every table's row count. Restoring puts both back into an empty
database and the bucket, then compares the row counts with the manifest.

## Settings

In `.env.local` (`.env.example` lists them):

- `BACKUP_PATH`: where backups go. A folder locally (`./backups`, which git ignores), or
  `s3://[BUCKET]/[PREFIX]` at the launch gate, written with the app's S3 settings.
- `PG_TOOLS`: how pg_dump and pg_restore run. `compose` runs them inside the compose file's
  postgres service (`docker compose exec -T postgres`), so nothing is installed on the PC;
  `local` uses the tools on the PATH; `docker` runs the postgres:16-alpine image on the host's
  network (CI). Empty: the PATH if pg_dump is there, else compose.
- `DATABASE_URL` and the `S3_*` variables, as the app uses them.

A missing variable is named and nothing runs. The connection reaches pg_dump and pg_restore in
libpq's environment variables (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGSSLMODE), never on a command
line, and an error from either has the password taken out. Backup folders are created readable by
their owner only (0700, files 0600) on Linux and macOS; Windows does not apply these modes, so
keep the folder in your own user's files. Backups hold personal data. Delete old local backups by hand.

## Back up

    npm run backup

Writes `[BACKUP_PATH]/[YYYY-MM-DDTHH-MM-SSZ]/` with `database.dump`, `objects/[KEY]` for every
object, `objects.txt` (key, bytes, type) and `manifest.json` (when, the database, every table's
row count, the number of objects), and prints the counts.

## Restore

1. Create an empty database, for example on the compose server:
   `docker compose exec postgres createdb -U smesay smesay_restore`
2. Point `DATABASE_URL` at it for this one command and give the backup's folder (or, at the
   gate, its `s3://[BUCKET]/[PREFIX]/[TIME]`, which is copied to a private temporary folder
   first):

        DATABASE_URL=postgres://smesay:smesay@localhost:5432/smesay_restore npm run restore -- ./backups/[FOLDER]

   In PowerShell on Windows, set the variable for the window, run, then remove it:

        $env:DATABASE_URL="postgres://smesay:smesay@localhost:5432/smesay_restore"; npm run restore -- ./backups/[FOLDER]; Remove-Item Env:DATABASE_URL

3. Type the database's name when asked (the prompt does not show it). A database that holds any
   table, sequence, index or type is refused.

The restore runs pg_restore in one transaction: if it fails, the database is left empty, and
the command can run again after the cause is fixed. Objects go back only into an empty bucket:
into a bucket in use, the app's own, they would bring back files deleted since the backup (a
purged workspace's, a replaced logo), so they are skipped and counted. For a full restore after
losing the bucket, point `S3_BUCKET` at the new, empty bucket. Every object put back is checked,
then the row counts are printed against the manifest; a difference fails the command.

To make the restored database the app's, point `DATABASE_URL` at it in `.env.local`.

## The restores performed

| When (UTC) | Where | Backup | Tables | Rows before | Rows after | Objects | Time |
|---|---|---|---|---|---|---|---|
| 2026-10-04 23:27 | The Claude Code cloud session (Postgres 16.14, tools on the PATH) into a fresh database | 4.3 MB, the dump 4,482,017 bytes | 20 | 78,114 | 78,114 | 0 (the session's bucket is in memory) | 1.0 s |
| 2026-10-04 23:57 | The cloud session, `npm run backup:check` after the audit fixes (the migration log now counted, one probe object) | the dump 4,489,909 bytes | 21 | 78,283 | 78,283 | 1 | 0.8 s |
| [DATE] | Mihai's PC, with compose, into a fresh database | | | | | | |

The last row is Mihai's to fill (SECURITY.md: one restore performed and documented before
launch): run the backup, create `smesay_restore`, run the restore, and write the line.

## Every night at the launch gate

On the host, as the app's user, with the app's environment loaded:

    15 2 * * * cd /srv/smesay && npm run backup >> /var/log/smesay-backup.log 2>&1

(02:15 every night, server time; the host's path and log file are set at the gate.) Nothing runs
on its own locally. The removal job (E11-2) needs its own line: `15 * * * * ... npm run
jobs:purge`.

## In CI

`npm run backup:check` runs after the end-to-end tests on every push: it backs up the CI
database, creates an empty one beside it, restores into it, compares every table's row count
(the migration log included), drops it and deletes the backup folder. For the objects it puts a
probe object in the bucket before the backup and restores into a new, empty bucket (CI's RustFS),
checks every object's size and the probe byte for byte, then empties and deletes that bucket and
removes the probe. With S3_ENDPOINT=memory: (one store per process) the probe is deleted before
the restore, which puts it back.
