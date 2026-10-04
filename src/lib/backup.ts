// Backups (stories/E11-4): the parts of `npm run backup` and `npm run restore` that decide
// things, pure so a test covers them; the scripts (scripts/backup.ts, scripts/restore.ts,
// scripts/backup-check.ts) run the commands. No database import.
//
// pg_dump and pg_restore (postgresql.org/docs/16/app-pgdump.html, app-pgrestore.html; the
// custom format, -Fc, is the one pg_restore reads selectively and compressed) come from one of:
// - "local": the tools on the PATH;
// - "compose": `docker compose exec -T postgres ...`, the compose file's postgres:16 service,
//   so nothing is installed on Mihai's PC (the story's technical notes);
// - "docker": `docker run --rm -i --network host postgres:16-alpine ...`, for CI, where the
//   database is a service container.
// PG_TOOLS names one; unset, the PATH is tried first, then compose.

export type PgTools = "local" | "compose" | "docker";
export const PG_IMAGE = "postgres:16-alpine";

export function pgCommand(tools: PgTools, program: "pg_dump" | "pg_restore" | "psql", args: string[]): { cmd: string; args: string[] } {
  if (tools === "local") return { cmd: program, args };
  if (tools === "compose") return { cmd: "docker", args: ["compose", "exec", "-T", "postgres", program, ...args] };
  return { cmd: "docker", args: ["run", "--rm", "-i", "--network", "host", PG_IMAGE, program, ...args] };
}

export function toolsFrom(value: string | undefined): PgTools | null {
  return value === "local" || value === "compose" || value === "docker" ? value : null;
}

// Where a backup goes: a folder, or s3://[BUCKET]/[PREFIX] at the launch gate.
export type Target = { kind: "folder"; path: string } | { kind: "s3"; bucket: string; prefix: string };
export function targetOf(backupPath: string): Target {
  const m = backupPath.match(/^s3:\/\/([a-z0-9][a-z0-9.-]{1,62})\/?(.*)$/);
  if (m) return { kind: "s3", bucket: m[1], prefix: m[2].replace(/\/+$/, "") };
  return { kind: "folder", path: backupPath.replace(/\/+$/, "") || "." };
}

// One backup's name: its UTC time to the second, sortable ("2026-10-04T23-15-07Z").
export const stampOf = (d: Date) => d.toISOString().slice(0, 19).replace(/:/g, "-") + "Z";

// The database's name from its URL, which the restore asks to be typed.
export function databaseName(url: string): string {
  const name = new URL(url).pathname.replace(/^\//, "");
  if (!name) throw new Error("DATABASE_URL names no database.");
  return decodeURIComponent(name);
}

// Two databases' row counts, table by table: the tables whose counts differ.
export function countDifferences(before: Record<string, number>, after: Record<string, number>): string[] {
  const names = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return names.filter((t) => before[t] !== after[t]).map((t) => `${t}: ${before[t] ?? "missing"} before, ${after[t] ?? "missing"} after`);
}
