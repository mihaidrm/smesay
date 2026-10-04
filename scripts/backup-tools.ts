// The work of `npm run backup`, `npm run restore` and `npm run backup:check` (stories/E11-4).
// The deciding parts are pure, in src/lib/backup.ts, with its test; this file runs pg_dump and
// pg_restore (through the tools src/lib/backup.ts picks), reads and writes the bucket through
// src/lib/storage.ts, and counts rows with the postgres client the app uses. A backup is a
// folder (or an S3 prefix at the launch gate) named by its time, holding database.dump (pg_dump's
// custom format), objects/[KEY] for every object in the bucket, objects.txt (key, bytes, type)
// and manifest.json (when, the database's name, every table's row count, the object count).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import postgres from "postgres";
import { databaseName, pgCommand, stampOf, targetOf, toolsFrom, type PgTools } from "../src/lib/backup";
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

// Runs a Postgres tool with the given stdin; resolves with its stdout, rejects with its stderr's
// last line (pg tools print no data on stderr).
function run(tools: PgTools, program: "pg_dump" | "pg_restore", args: string[], input?: Buffer): Promise<Buffer> {
  const { cmd, args: argv } = pgCommand(tools, program, args);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, argv, { stdio: ["pipe", "pipe", "pipe"] });
    const out: Buffer[] = []; const err: Buffer[] = [];
    child.stdout.on("data", (b: Buffer) => out.push(b));
    child.stderr.on("data", (b: Buffer) => err.push(b));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`${program} exited ${code}: ${Buffer.concat(err).toString().trim().split("\n").at(-1) ?? ""}`))));
    child.stdin.end(input ?? Buffer.alloc(0));
  });
}

export async function rowCounts(url: string): Promise<Record<string, number>> {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const tables = await sql<{ name: string }[]>`select table_name as name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`;
    const out: Record<string, number> = {};
    for (const t of tables) out[t.name] = (await sql`select count(*)::int as n from ${sql(t.name)}`)[0].n as number;
    return out;
  } finally {
    await sql.end();
  }
}

// Writes one backup and returns where it went and its manifest.
export async function backup(now = new Date()): Promise<{ where: string; manifest: Manifest }> {
  const url = need("DATABASE_URL");
  const target = targetOf(need("BACKUP_PATH"));
  const tools = pickTools();
  const stamp = stampOf(now);
  const files = new Map<string, Buffer>();
  files.set("database.dump", await run(tools, "pg_dump", ["-Fc", "--no-owner", "--no-privileges", url]));
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
    for (const [name, data] of files) { mkdirSync(dirname(join(dir, name)), { recursive: true }); writeFileSync(join(dir, name), data); }
    return { where: dir, manifest };
  }
  // The launch gate's backup bucket, with the app's S3 settings (the same store, another bucket).
  const s3 = new S3Client({ endpoint: need("S3_ENDPOINT"), region: process.env.S3_REGION ?? "auto", forcePathStyle: true, credentials: { accessKeyId: need("S3_ACCESS_KEY_ID"), secretAccessKey: need("S3_SECRET_ACCESS_KEY") } });
  const prefix = [target.prefix, stamp].filter(Boolean).join("/");
  for (const [name, data] of files) await s3.send(new PutObjectCommand({ Bucket: target.bucket, Key: `${prefix}/${name}`, Body: data }));
  return { where: `s3://${target.bucket}/${prefix}`, manifest };
}

// Restores a backup folder into the database DATABASE_URL names, which must be empty, and puts
// back every object the bucket does not have. confirm is the database name as typed.
export async function restore(folder: string, confirm: string): Promise<{ manifest: Manifest; after: Record<string, number>; objects: number }> {
  const url = need("DATABASE_URL");
  const name = databaseName(url);
  if (confirm.trim() !== name) throw new Error(`The name typed does not match the database ${name}. Nothing was restored.`);
  const dump = join(folder, "database.dump");
  if (!existsSync(dump)) throw new Error(`${dump} does not exist. Give the folder of one backup, named by its time.`);
  const tables = Object.keys(await rowCounts(url));
  if (tables.length > 0) throw new Error(`The database ${name} is not empty: ${tables.length} tables. Restore only into an empty database.`);
  await run(pickTools(), "pg_restore", ["--no-owner", "--no-privileges", "--exit-on-error", "-d", url], readFileSync(dump));
  let objects = 0;
  const root = join(folder, "objects");
  if (existsSync(root)) {
    const have = new Set(await listKeys(""));
    const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
    const types = new Map(readFileSync(join(folder, "objects.txt"), "utf8").split("\n").filter(Boolean).map((l) => { const [k, , t] = l.split("\t"); return [k, t] as const; }));
    for (const file of walk(root)) {
      const key = relative(root, file).split("\\").join("/");
      if (have.has(key)) continue;
      await putObject(key, readFileSync(file), types.get(key) ?? "application/octet-stream");
      objects += 1;
    }
  }
  const manifest = JSON.parse(readFileSync(join(folder, "manifest.json"), "utf8")) as Manifest;
  return { manifest, after: await rowCounts(url), objects };
}
