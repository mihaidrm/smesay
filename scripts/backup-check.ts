// npm run backup:check (stories/E11-4, acceptance 5): CI's backup and restore. Backs up the
// database DATABASE_URL names to a temporary folder, creates an empty database beside it,
// restores into it, compares every table's row count with the backup's and drops it.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postgres from "postgres";
import { countDifferences } from "../src/lib/backup";
import { backup, need, restore } from "./backup-tools";

async function main() {
  const source = need("DATABASE_URL");
  process.env.BACKUP_PATH = mkdtempSync(join(tmpdir(), "smesay-backup-"));
  const { where, manifest } = await backup();
  const target = new URL(source);
  const check = `${target.pathname.slice(1)}_restore_check`;
  const admin = postgres(source, { max: 1, onnotice: () => {} });
  await admin.unsafe(`drop database if exists "${check}"`);
  await admin.unsafe(`create database "${check}"`);
  try {
    target.pathname = `/${check}`;
    process.env.DATABASE_URL = target.toString();
    const started = Date.now();
    const { after } = await restore(where, check);
    const diff = countDifferences(manifest.tables, after);
    const rows = Object.values(after).reduce((a, b) => a + b, 0);
    console.log(`backup:check restored ${Object.keys(after).length} tables and ${rows} rows in ${((Date.now() - started) / 1000).toFixed(1)} s`);
    if (diff.length > 0) throw new Error(`row counts differ:\n${diff.join("\n")}`);
    console.log("backup:check every table's row count matches");
  } finally {
    process.env.DATABASE_URL = source;
    await admin.unsafe(`drop database if exists "${check}"`);
    await admin.end();
  }
}

main().then(() => process.exit(0)).catch((error: unknown) => { console.error(`backup:check failed: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
