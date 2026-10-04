// The work of `npm run backup`, `npm run restore` and `npm run backup:check` (stories/E11-4).
// The deciding parts are pure, in src/lib/backup.ts, with its test; this file runs pg_dump and
// pg_restore (through the tools src/lib/backup.ts picks), reads and writes the bucket through
// src/lib/storage.ts, and counts rows with the postgres client the app uses. A backup is a
// folder (or an S3 prefix at the launch gate) named by its time, holding database.dump (pg_dump's
// custom format), objects/[KEY] for every object in the bucket, objects.txt (key, bytes, type)
// and manifest.json (when, the database's name, every table's row count, the object count).
// Like scripts/ai-smoke.ts, this reads every workspace's rows and objects (SECURITY.md,
// Multi-tenancy). Backup files hold personal data: folders are created 0700 and files 0600.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import postgres from "postgres";
import { connectionEnv, databaseName, pgCommand, redact, stampOf, targetOf, toolsFrom, type PgTools } from "../src/lib/backup";
import { getObject, listKeys, putObject } from "../src/lib/storage";

export type Manifest = { createdAt: string; database: string; tables: Record<string, number>; objects: number };

export function need(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Set it in .env.local (docs/runbooks/backup-restore.md).`);
  return value;
}

export function pickTools(): PgTools {
  const named = toolsFrom(process.env.PG_TOOLS);
  if (process.env.PG_TOOLS && !named) throw new Error("PG_TOOLS is local, compose or docker.");
  if (named) return named;
  return spawnSync("pg_dump", ["--version"]).status === 0 ? "local" : "compose";
}

// Runs a Postgres tool against the database `url` names, with the connection in the
// environment (src/lib/backup.ts) and the given stdin; resolves with its stdout, rejects with
// its stderr's last lines, the password and the URL taken out.
function run(url: string, program: "pg_dump" | "pg_restore", args: string[], input?: Buffer): Promise<Buffer> {
  const { cmd, args: argv } = pgCommand(pickTools(), program, args);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, argv, { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, ...connectionEnv(url) } });
    const out: Buffer[] = []; const err: Buffer[] = [];
    child.stdout.on("data", (b: Buffer) => out.push(b));
    child.stderr.on("data", (b: Buffer) => err.push(b));
    child.on("error", (error) => reject(new Error(`${cmd} could not start (${error.name}). Check PG_TOOLS (docs/runbooks/backup-restore.md).`)));
    child.on("close", (code) => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`${program} exited ${code}:\n${redact(Buffer.concat(err).toString(), url)}`))));
    child.stdin.on("error", () => {});
    child.stdin.end(input ?? Buffer.alloc(0));
  });
}

// The schemas a backup covers: the app's tables (public) and the migration log (drizzle).
const SCHEMAS = ["public", "drizzle"];

export async function rowCounts(url: string): Promise<Record<string, number>> {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const tables = await sql<{ schema: string; name: string }[]>`select table_schema as schema, table_name as name from information_schema.tables where table_schema in ${sql(SCHEMAS)} and table_type = 'BASE TABLE' order by table_schema, table_name`;
    const out: Record<string, number> = {};
    for (const t of tables) out[t.schema === "public" ? t.name : `${t.schema}.${t.name}`] = (await sql`select count(*)::int as n from ${sql(t.schema)}.${sql(t.name)}`)[0].n as number;
    return out;
  } finally {
    await sql.end();
  }
}

// What the target database already holds in those schemas: tables, sequences, views, indexes
// and types such as enums. Anything means it is not empty.
async function objectsIn(url: string): Promise<number> {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const [{ n }] = await sql<{ n: number }[]>`select ((select count(*) from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname in ${sql(SCHEMAS)}) + (select count(*) from pg_type t join pg_namespace s on s.oid = t.typnamespace where s.nspname in ${sql(SCHEMAS)} and t.typrelid = 0 and t.typelem = 0))::int as n`;
    return n;
  } finally {
    await sql.end();
  }
}

function writePrivate(path: string, data: Buffer) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, data, { mode: 0o600 });
}

function s3For(): S3Client {
  return new S3Client({ endpoint: need("S3_ENDPOINT"), region: process.env.S3_REGION ?? "auto", forcePathStyle: true, credentials: { accessKeyId: need("S3_ACCESS_KEY_ID"), secretAccessKey: need("S3_SECRET_ACCESS_KEY") } });
}

// Writes one backup and returns where it went and its manifest.
export async function backup(now = new Date()): Promise<{ where: string; manifest: Manifest }> {
  const url = need("DATABASE_URL");
  const target = targetOf(need("BACKUP_PATH"));
  const stamp = stampOf(now);
  const files = new Map<string, Buffer>();
  files.set("database.dump", await run(url, "pg_dump", ["-Fc", "--no-owner", "--no-privileges", databaseName(url)]));
  const keys = await listKeys("");
  const listing: string[] = [];
  for (const key of keys) {
    const object = await getObject(key);
    if (!object) continue;
    files.set(`objects/${key}`, Buffer.from(object.body));
    listing.push(`${key}\t${object.body.length}\t${object.contentType}`);
  }
  files.set("objects.txt", Buffer.from(listing.join("\n") + (listing.length ? "\n" : "")));
  const manifest: Manifest = { createdAt: now.toISOString(), database: databaseName(url), tables: await rowCounts(url), objects: listing.length };
  files.set("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2)));
  if (target.kind === "folder") {
    const dir = join(target.path, stamp);
    for (const [name, data] of files) writePrivate(join(dir, name), data);
    return { where: dir, manifest };
  }
  // The launch gate's backup bucket, with the app's S3 settings (the same store, another bucket).
  const s3 = s3For();
  const prefix = [target.prefix, stamp].filter(Boolean).join("/");
  for (const [name, data] of files) await s3.send(new PutObjectCommand({ Bucket: target.bucket, Key: `${prefix}/${name}`, Body: data }));
  return { where: `s3://${target.bucket}/${prefix}`, manifest };
}

// A backup at s3://[BUCKET]/[PREFIX]/[TIME] is copied to a private temporary folder first.
async function download(bucket: string, prefix: string): Promise<string> {
  const s3 = s3For();
  const dir = mkdtempSync(join(tmpdir(), "smesay-restore-"));
  let token: string | undefined;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `${prefix}/`, ContinuationToken: token }));
    for (const item of page.Contents ?? []) {
      if (!item.Key) continue;
      const body = await (await s3.send(new GetObjectCommand({ Bucket: bucket, Key: item.Key }))).Body?.transformToByteArray();
      writePrivate(join(dir, item.Key.slice(prefix.length + 1)), Buffer.from(body ?? new Uint8Array()));
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return dir;
}

export type Restored = { manifest: Manifest; after: Record<string, number>; objects: number; objectsSkipped: number; objectsMissing: string[] };

// Restores a backup (a folder, or an S3 prefix at the gate) into the database DATABASE_URL
// names, which must be empty. Objects go back only into an empty bucket: into a bucket in use
// they would bring back files deleted since the backup (a purged workspace's, a replaced logo),
// which nothing would delete again. confirm is the database name as typed.
export async function restore(source: string, confirm: string): Promise<Restored> {
  const url = need("DATABASE_URL");
  const name = databaseName(url);
  if (confirm.trim() !== name) throw new Error(`The name typed does not match the database DATABASE_URL names. Nothing was restored.`);
  const target = targetOf(source);
  const folder = target.kind === "s3" ? await download(target.bucket, target.prefix) : target.path;
  try {
    const dump = join(folder, "database.dump");
    if (!existsSync(dump)) throw new Error(`${dump} does not exist. Give the folder of one backup, named by its time. Nothing was restored.`);
    const manifest = JSON.parse(readFileSync(join(folder, "manifest.json"), "utf8")) as Manifest;
    const present = await objectsIn(url);
    if (present > 0) throw new Error(`The database ${name} is not empty: ${present} tables, sequences, indexes or types. Restore only into an empty database. Nothing was restored.`);
    // The bucket is read before the database is touched, so a missing S3 setting stops the
    // restore with nothing written (storage.ts reads the settings on first use).
    const bucket = manifest.objects > 0 ? await listKeys("") : [];
    // One transaction: a failure leaves the database as empty as it was (app-pgrestore.html,
    // --single-transaction: "either all the commands complete successfully, or no changes are
    // applied"; it implies --exit-on-error).
    await run(url, "pg_restore", ["--no-owner", "--no-privileges", "--single-transaction", "-d", name], readFileSync(dump));
    let objects = 0;
    let objectsSkipped = 0;
    const objectsMissing: string[] = [];
    const root = join(folder, "objects");
    if (manifest.objects > 0 && existsSync(root)) {
      const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
      const listed = readFileSync(join(folder, "objects.txt"), "utf8").split("\n").filter(Boolean).map((l) => l.split("\t"));
      const types = new Map(listed.map(([k, , t]) => [k, t] as const));
      if (bucket.length > 0) objectsSkipped = listed.length;
      else {
        for (const file of walk(root)) {
          const key = relative(root, file).split("\\").join("/");
          await putObject(key, readFileSync(file), types.get(key) ?? "application/octet-stream");
          objects += 1;
        }
        const now = new Set(await listKeys(""));
        for (const [key] of listed) if (!now.has(key)) objectsMissing.push(key);
      }
    }
    return { manifest, after: await rowCounts(url), objects, objectsSkipped, objectsMissing };
  } finally {
    if (target.kind === "s3") rmSync(folder, { recursive: true, force: true });
  }
}
