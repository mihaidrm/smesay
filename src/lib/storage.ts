// The one object store (stories/E2-5; decision 0025): an S3-compatible bucket through
// @aws-sdk/client-s3 3.1145.0 (Apache-2.0, released 2026-10-01; github.com/aws/aws-sdk-js-v3),
// RustFS locally and in CI, Cloudflare R2 at the launch gate (docs/accounts.md step 8), so the
// switch is the four S3_* variables. endpoint, forcePathStyle (bucket in the path, as RustFS
// serves it) and credentials: node_modules/@aws-sdk/client-s3/dist-types/runtimeConfig.d.ts
// and S3Client.d.ts; the commands: dist-types/commands/*.d.ts; Body.transformToByteArray():
// node_modules/@smithy/types/dist-types/serde.d.ts. "memory:" as S3_ENDPOINT keeps objects in
// a map for the unit tests and the session's dev server. The bucket is created on first use.
// A missing variable is named and nothing is stored.
import { CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type StoredObject = { body: Uint8Array; contentType: string };

// One map per process, on globalThis, because Next bundles a route handler and a server action
// separately and each bundle would otherwise get its own module instance.
const memory: Map<string, StoredObject> = ((globalThis as { __smesayObjects?: Map<string, StoredObject> }).__smesayObjects ??= new Map());
let client: S3Client | null = null;
let bucketReady: Promise<void> | null = null;

function env(name: "S3_ENDPOINT" | "S3_BUCKET" | "S3_ACCESS_KEY_ID" | "S3_SECRET_ACCESS_KEY"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in (docs/setup.md).`);
  return value;
}

// "memory:" is for tests and the dev server only: a production process would lose every
// object on restart, so it refuses, as src/lib/auth.ts refuses an http base URL.
function isMemory(): boolean {
  const memoryMode = env("S3_ENDPOINT") === "memory:";
  if (memoryMode && process.env.NODE_ENV === "production") throw new Error("S3_ENDPOINT=memory: is for tests only. Set the bucket's address in production (docs/accounts.md step 8).");
  return memoryMode;
}

function s3(): S3Client {
  client ??= new S3Client({
    endpoint: env("S3_ENDPOINT"),
    region: process.env.S3_REGION ?? "auto",
    forcePathStyle: true,
    credentials: { accessKeyId: env("S3_ACCESS_KEY_ID"), secretAccessKey: env("S3_SECRET_ACCESS_KEY") },
  });
  return client;
}

// HeadBucket answers NotFound (404) for a missing bucket (node_modules/@aws-sdk/client-s3/
// dist-types/commands/HeadBucketCommand.d.ts); any other failure (wrong credentials, the store
// not up yet) is thrown as it is, and a failed attempt is not cached, so the next call tries
// again.
async function ensureBucket(): Promise<void> {
  if (bucketReady) return bucketReady;
  const attempt = (async () => {
    const Bucket = env("S3_BUCKET");
    try {
      await s3().send(new HeadBucketCommand({ Bucket }));
    } catch (error) {
      const name = typeof error === "object" && error !== null ? (error as { name?: string; $metadata?: { httpStatusCode?: number } }) : {};
      if (name.name === "NotFound" || name.$metadata?.httpStatusCode === 404) await s3().send(new CreateBucketCommand({ Bucket }));
      else throw error;
    }
  })();
  bucketReady = attempt.catch((error) => { bucketReady = null; throw error; });
  return bucketReady;
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  if (isMemory()) { memory.set(key, { body, contentType }); return; }
  await ensureBucket();
  await s3().send(new PutObjectCommand({ Bucket: env("S3_BUCKET"), Key: key, Body: body, ContentType: contentType }));
}

export async function getObject(key: string): Promise<StoredObject | null> {
  if (isMemory()) return memory.get(key) ?? null;
  await ensureBucket();
  try {
    const out = await s3().send(new GetObjectCommand({ Bucket: env("S3_BUCKET"), Key: key }));
    if (!out.Body) return null;
    return { body: await out.Body.transformToByteArray(), contentType: out.ContentType ?? "application/octet-stream" };
  } catch (error) {
    if (typeof error === "object" && error !== null && (error as { name?: string }).name === "NoSuchKey") return null;
    throw error;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (isMemory()) { memory.delete(key); return; }
  await ensureBucket();
  await s3().send(new DeleteObjectCommand({ Bucket: env("S3_BUCKET"), Key: key }));
}

// Every key under a prefix (stories/E11-2: the removal job lists a workspace's objects), page by
// page with ListObjectsV2 (dist-types/models/models_0.d.ts: Prefix, ContinuationToken; the
// output's Contents, IsTruncated, NextContinuationToken).
export async function listKeys(prefix: string): Promise<string[]> {
  if (isMemory()) return [...memory.keys()].filter((k) => k.startsWith(prefix));
  await ensureBucket();
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const out = await s3().send(new ListObjectsV2Command({ Bucket: env("S3_BUCKET"), Prefix: prefix, ContinuationToken: token }));
    for (const o of out.Contents ?? []) if (o.Key) keys.push(o.Key);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}
