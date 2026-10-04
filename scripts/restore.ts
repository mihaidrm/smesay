// npm run restore -- [BACKUP FOLDER] (stories/E11-4, acceptance 2): asks for the target
// database's name to be typed, refuses a database that is not empty, restores the dump and puts
// back the bucket's missing objects, then prints the row counts against the backup's
// (scripts/backup-tools.ts). The name can also come on stdin, for a script.
import { createInterface } from "node:readline/promises";
import { databaseName, countDifferences } from "../src/lib/backup";
import { need, restore } from "./backup-tools";

async function main() {
  const folder = process.argv[2];
  if (!folder) throw new Error("Give the backup's folder: npm run restore -- [BACKUP FOLDER]");
  const name = databaseName(need("DATABASE_URL"));
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const typed = await rl.question(`Type the database's name, ${name}, to restore into it: `);
  rl.close();
  const started = Date.now();
  const { manifest, after, objects } = await restore(folder, typed);
  const diff = countDifferences(manifest.tables, after);
  const rows = Object.values(after).reduce((a, b) => a + b, 0);
  console.log(`restored ${Object.keys(after).length} tables, ${rows} rows and ${objects} objects in ${((Date.now() - started) / 1000).toFixed(1)} s`);
  if (diff.length > 0) { console.error(`row counts differ from the backup:\n${diff.join("\n")}`); process.exit(1); }
  console.log("every table's row count matches the backup");
}

main().then(() => process.exit(0)).catch((error: unknown) => { console.error(`restore failed: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
