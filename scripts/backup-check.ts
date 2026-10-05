// npm run backup:check (stories/E11-4, acceptance 5): CI's backup and restore. Puts one probe
// object in the bucket, backs up the database DATABASE_URL names and the bucket to a temporary
// folder, creates an empty database beside it and an empty bucket, restores into both, compares
// every table's row count with the backup's, checks every object (the probe byte for byte),
// then drops the database, empties and deletes the bucket, deletes the probe and the folder (it
// holds personal data). With S3_ENDPOINT=memory: there is one store per process: the probe is
// deleted from it before the restore, which then puts it back.
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CreateBucketCommand, DeleteBucketCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import postgres from "postgres";
import { countDifferences, databaseName } from "../src/lib/backup";
import { deleteObject, getObject, putObject } from "../src/lib/storage";
import { backup, need, restore, s3For } from "./backup-tools";

const PROBE = "backup-check/probe.txt";
const PROBE_BODY = Buffer.from("smesay backup check\n");

async function main() {
  const source = need("DATABASE_URL");
  const bucket = process.env.S3_BUCKET;
  const memory = process.env.S3_ENDPOINT === "memory:";
  const folder = mkdtempSync(join(tmpdir(), "smesay-backup-"));
  process.env.BACKUP_PATH = folder;
  const check = `${databaseName(source)}_restore_check`;
  // A new name each run, so a bucket left by a run that was killed never blocks the next.
  const checkBucket = `${bucket ?? "smesay"}-check-${randomBytes(4).toString("hex")}`;
  const admin = postgres(source, { max: 1, onnotice: () => {} });
  let madeBucket = false;
  try {
    await putObject(PROBE, PROBE_BODY, "text/plain");
    const { where, manifest } = await backup();
    await deleteObject(PROBE);
    if (!memory) {
      // CreateBucket and DeleteBucket: node_modules/@aws-sdk/client-s3/dist-types/commands/.
      await s3For().send(new CreateBucketCommand({ Bucket: checkBucket }));
      madeBucket = true;
      process.env.S3_BUCKET = checkBucket;
    }
    await admin.unsafe(`drop database if exists "${check}"`);
    await admin.unsafe(`create database "${check}"`);
    const target = new URL(source);
    target.pathname = `/${check}`;
    process.env.DATABASE_URL = target.toString();
    const started = Date.now();
    const { after, objects, objectsSkipped, objectsMissing } = await restore(where, check);
    const diff = countDifferences(manifest.tables, after);
    const rows = Object.values(after).reduce((a, b) => a + b, 0);
    console.log(`backup:check restored ${Object.keys(after).length} tables, ${rows} rows and ${objects} objects in ${((Date.now() - started) / 1000).toFixed(1)} s`);
    if (diff.length > 0) throw new Error(`row counts differ:\n${diff.join("\n")}`);
    if (objectsSkipped > 0) throw new Error(`${objectsSkipped} objects skipped: the bucket was not empty`);
    if (objectsMissing.length > 0) throw new Error(`${objectsMissing.length} objects missing or another size after the restore`);
    const back = await getObject(PROBE);
    if (!back || !PROBE_BODY.equals(Buffer.from(back.body))) throw new Error("the probe object did not come back");
    console.log(`backup:check every table's row count matches; ${manifest.objects} objects back, the probe byte for byte`);
  } finally {
    process.env.DATABASE_URL = source;
    if (madeBucket) {
      const s3 = s3For();
      const listed = await s3.send(new ListObjectsV2Command({ Bucket: checkBucket }));
      for (const o of listed.Contents ?? []) if (o.Key) await s3.send(new DeleteObjectCommand({ Bucket: checkBucket, Key: o.Key }));
      await s3.send(new DeleteBucketCommand({ Bucket: checkBucket }));
      process.env.S3_BUCKET = bucket;
    }
    // The probe leaves the app's bucket whatever failed above (deleting a missing key is fine).
    await deleteObject(PROBE).catch(() => {});
    await admin.unsafe(`drop database if exists "${check}"`);
    await admin.end();
    rmSync(folder, { recursive: true, force: true });
  }
}

main().then(() => process.exit(0)).catch((error: unknown) => { console.error(`backup:check failed: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
