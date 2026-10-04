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

A missing variable is named and nothing runs.

## Back up

    npm run backup

Writes `[BACKUP_PATH]/[YYYY-MM-DDTHH-MM-SSZ]/` with `database.dump`, `objects/[KEY]` for every
object, `objects.txt` (key, bytes, type) and `manifest.json` (when, the database, every table's
row count, the number of objects), and prints the counts.

## Restore

1. Create an empty database, for example on the compose server:
   `docker compose exec postgres createdb -U smesay smesay_restore`
2. Point `DATABASE_URL` at it for this one command and give the backup's folder:

        DATABASE_URL=postgres://smesay:smesay@localhost:5432/smesay_restore npm run restore -- ./backups/[FOLDER]

3. Type the database's name when asked. A database that already has tables is refused.

The restore puts back the dump, then every object the bucket does not already have, and prints
the row counts against the manifest; a difference is printed and the command fails.

To make the restored database the app's, point `DATABASE_URL` at it in `.env.local`.

## The restores performed

| When (UTC) | Where | Backup | Tables | Rows before | Rows after | Objects | Time |
|---|---|---|---|---|---|---|---|
| 2026-10-04 23:27 | The Claude Code cloud session (Postgres 16.14, tools on the PATH) into a fresh database | 4.3 MB, the dump 4,482,017 bytes | 20 | 78,114 | 78,114 | 0 (the session's bucket is in memory) | 1.0 s |
| [DATE] | Mihai's PC, with compose, into a fresh database | | | | | | |

The second row is Mihai's to fill (SECURITY.md: one restore performed and documented before
launch): run the backup, create `smesay_restore`, run the restore, and write the line.

## Every night at the launch gate

On the host, as the app's user, with the app's environment loaded:

    15 2 * * * cd /srv/smesay && npm run backup >> /var/log/smesay-backup.log 2>&1

(02:15 every night, server time; the host's path and log file are set at the gate.) Nothing runs
on its own locally. The removal job (E11-2) needs its own line: `15 * * * * ... npm run
jobs:purge`.

## In CI

`npm run backup:check` runs after the end-to-end tests on every push: it backs up the CI
database, creates an empty one beside it, restores into it, compares every table's row count and
drops it.
