// npm run backup:check (stories/E11-4, acceptance 5): CI's backup and restore. Backs up the
// database DATABASE_URL names to a temporary folder, creates an empty database beside it,
// restores into it, compares every table's row count with the backup's, then drops the
// database and deletes the folder (it holds personal data).
// With S3_ENDPOINT=memory: (CI) the bucket is this process's own, so the check also proves the
// objects: it puts one probe object before the backup, deletes it before the restore, and
// fails unless the restore puts it back byte for byte.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postgres from "postgres";
import { countDifferences, databaseName } from "../src/lib/backup";
import { deleteObject, getObject, putObject } from "../src/lib/storage";
import { backup, need, restore } from "./backup-tools";

const PROBE = "backup-check/probe.txt";
const PROBE_BODY = Buffer.from("smesay backup check\n");

async function main() {
  const source = need("DATABASE_URL");
  const memory = process.env.S3_ENDPOINT === "memory:";
  const folder = mkdtempSync(join(tmpdir(), "smesay-backup-"));
  process.env.BACKUP_PATH = folder;
  const check = `${databaseName(source)}_restore_check`;
  const admin = postgres(source, { max: 1, onnotice: () => {} });
  try {
    if (memory) await putObject(PROBE, PROBE_BODY, "text/plain");
    const { where, manifest } = await backup();
    if (memory) await deleteObject(PROBE);
    await admin.unsafe(`drop database if exists "${check}"`);
    await admin.unsafe(`create database "${check}"`);
    const target = new URL(source);
    target.pathname = `/${check}`;
    process.env.DATABASE_URL = target.toString();
    const started = Date.now();
    const { after, objects, objectsMissing } = await restore(where, check);
    const diff = countDifferences(manifest.tables, after);
    const rows = Object.values(after).reduce((a, b) => a + b, 0);
    console.log(`backup:check restored ${Object.keys(after).length} tables, ${rows} rows and ${objects} objects in ${((Date.now() - started) / 1000).toFixed(1)} s`);
    if (diff.length > 0) throw new Error(`row counts differ:\n${diff.join("\n")}`);
    if (objectsMissing.length > 0) throw new Error(`${objectsMissing.length} objects missing after the restore`);
    if (memory) {
      const back = await getObject(PROBE);
      if (!back || !PROBE_BODY.equals(Buffer.from(back.body))) throw new Error("the probe object did not come back");
      await deleteObject(PROBE);
      console.log("backup:check the probe object came back byte for byte");
    }
    console.log("backup:check every table's row count matches");
  } finally {
    process.env.DATABASE_URL = source;
    await admin.unsafe(`drop database if exists "${check}"`);
    await admin.end();
    rmSync(folder, { recursive: true, force: true });
  }
}

main().then(() => process.exit(0)).catch((error: unknown) => { console.error(`backup:check failed: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
