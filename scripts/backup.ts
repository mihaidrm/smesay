// npm run backup (stories/E11-4, acceptance 1): one timestamped backup of the database and the
// bucket to BACKUP_PATH (scripts/backup-tools.ts). A missing variable is named, and nothing runs.
import { backup } from "./backup-tools";

backup()
  .then(({ where, manifest }) => {
    const rows = Object.values(manifest.tables).reduce((a, b) => a + b, 0);
    console.log(`backup written to ${where}: ${Object.keys(manifest.tables).length} tables, ${rows} rows, ${manifest.objects} objects`);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(`backup failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error("Nothing usable was written. Check that the database is up and DATABASE_URL is right, then run it again (docs/runbooks/backup-restore.md).");
    process.exit(1);
  });
