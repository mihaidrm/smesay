// npm run restore -- [BACKUP] (stories/E11-4, acceptance 2): BACKUP is one backup's folder, or
// its s3://[BUCKET]/[PREFIX]/[TIME] at the launch gate. Asks for the target database's name to
// be typed (the prompt does not show it, so it is read from DATABASE_URL, not copied), refuses a
// database that is not empty, restores the dump in one transaction, puts the objects back when
// the bucket is empty, then prints the row counts against the backup's (scripts/backup-tools.ts).
// The name can also come on stdin, for a script.
import { createInterface } from "node:readline/promises";
import { countDifferences } from "../src/lib/backup";
import { restore } from "./backup-tools";

async function main() {
  const source = process.argv[2];
  if (!source) throw new Error("Give the backup: npm run restore -- [BACKUP FOLDER]");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const typed = await rl.question("Type the name of the database DATABASE_URL points at, to restore into it: ");
  rl.close();
  const started = Date.now();
  const { manifest, after, objects, objectsSkipped, objectsMissing } = await restore(source, typed);
  const diff = countDifferences(manifest.tables, after);
  const rows = Object.values(after).reduce((a, b) => a + b, 0);
  console.log(`restored ${Object.keys(after).length} tables, ${rows} rows and ${objects} objects in ${((Date.now() - started) / 1000).toFixed(1)} s`);
  if (objectsSkipped > 0) console.log(`${objectsSkipped} objects not put back: the bucket is in use. To restore them, point S3_BUCKET at an empty bucket and run the restore into a new empty database.`);
  if (objectsMissing.length > 0) { console.error(`${objectsMissing.length} objects are missing from the bucket after the restore, or have another size. Empty the bucket, then run it again into a new empty database.`); process.exit(1); }
  if (diff.length > 0) { console.error(`row counts differ from the backup:\n${diff.join("\n")}`); process.exit(1); }
  console.log("every table's row count matches the backup");
}

main().then(() => process.exit(0)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`restore failed: ${message}`);
  if (message.startsWith("pg_restore")) console.error("The restore runs in one transaction, so the database is left empty. Fix the cause above and run it again (docs/runbooks/backup-restore.md).");
  process.exit(1);
});
