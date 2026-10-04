// Backups (stories/E11-4): the parts of `npm run backup` and `npm run restore` that decide
// things, pure so a test covers them; the scripts (scripts/backup.ts, scripts/restore.ts,
// scripts/backup-check.ts) run the commands. No database import.
//
// pg_dump and pg_restore (postgresql.org/docs/16/app-pgdump.html, app-pgrestore.html; the
// custom format, -Fc, is the one pg_restore reads selectively and compressed) come from one of:
// - "local": the tools on the PATH;
// - "compose": `docker compose exec -T postgres ...`, the compose file's postgres:16 service,
//   so nothing is installed on Mihai's PC (the story's technical notes;
//   docs.docker.com/reference/cli/docker/compose/exec/, -T disables the TTY so stdin and stdout
//   carry the dump);
// - "docker": `docker run --rm -i --network host postgres:16-alpine ...`, for CI, where the
//   database is a service container (docs.docker.com/reference/cli/docker/container/run/:
//   --rm, -i keeps stdin open, --network host).
// PG_TOOLS names one; unset, the PATH is tried first, then compose. pg_dump writes the dump to
// stdout and pg_restore reads it from stdin when no file is named (app-pgrestore.html,
// "filename": "If not specified, the standard input is used").
//
// The connection never goes on a command line, where `ps` and the docker CLI would show the
// password: the tools read libpq's PGHOST, PGPORT, PGUSER, PGPASSWORD and PGSSLMODE from the
// environment (postgresql.org/docs/16/libpq-envars.html), and only the database's name is an
// argument (pg_restore does not read PGDATABASE: app-pgrestore.html, Environment). Through
// docker, `-e NAME` with no value passes the variable from the CLI's own environment
// (docs.docker.com/reference/cli/docker/container/run/, "--env": "the Docker CLI client checks
// the value the variable has in your local environment"). That `docker compose exec -e NAME`
// does the same is unverified: its page lists -e without saying; Mihai's restore (acceptance 3)
// runs that path.

export type PgTools = "local" | "compose" | "docker";
export const PG_IMAGE = "postgres:16-alpine";

export const PG_ENV = ["PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGSSLMODE"] as const;
const passEnv = PG_ENV.flatMap((name) => ["-e", name]);

export function pgCommand(tools: PgTools, program: "pg_dump" | "pg_restore" | "psql", args: string[]): { cmd: string; args: string[] } {
  if (tools === "local") return { cmd: program, args };
  if (tools === "compose") return { cmd: "docker", args: ["compose", "exec", "-T", ...passEnv, "postgres", program, ...args] };
  return { cmd: "docker", args: ["run", "--rm", "-i", "--network", "host", ...passEnv, PG_IMAGE, program, ...args] };
}

// The libpq variables for a connection string; sslmode is the one query setting carried.
const decoded = (part: string, what: string) => {
  try { return decodeURIComponent(part); } catch { throw new Error(`DATABASE_URL's ${what} has a % that is not percent-encoding: write % as %25.`); }
};

export function connectionEnv(url: string): Record<(typeof PG_ENV)[number], string> {
  const u = new URL(url);
  return {
    PGHOST: u.hostname || "localhost",
    PGPORT: u.port || "5432",
    PGUSER: decoded(u.username, "user name"),
    PGPASSWORD: decoded(u.password, "password"),
    PGSSLMODE: u.searchParams.get("sslmode") ?? "prefer",
  };
}

// A tool's error text with the password and the connection string taken out, in case libpq
// echoes either (a malformed one is quoted back), cut to its last five lines.
export function redact(text: string, url: string): string {
  let out = text;
  // The password as written between "user:" and "@", and decoded when it can be: a malformed
  // percent sign is what makes libpq quote it back.
  const raw = url.match(/^[a-z]+:\/\/[^:/@]*:([^@]*)@/i)?.[1];
  const secrets = [url];
  if (raw) {
    secrets.push(raw);
    try { secrets.push(decodeURIComponent(raw)); } catch { /* not decodable: the raw form is enough */ }
  }
  for (const s of secrets.filter(Boolean).sort((a, b) => b.length - a.length)) out = out.split(s).join("[removed]");
  return out.trim().split("\n").slice(-5).join("\n");
}

export function toolsFrom(value: string | undefined): PgTools | null {
  return value === "local" || value === "compose" || value === "docker" ? value : null;
}

// Where a backup goes: a folder, or s3://[BUCKET]/[PREFIX] at the launch gate.
export type Target = { kind: "folder"; path: string } | { kind: "s3"; bucket: string; prefix: string };
export function targetOf(backupPath: string): Target {
  const s3 = backupPath.match(/^s3:\/\/([^/]*)\/?(.*)$/i);
  if (s3) {
    // Bucket names: 3 to 63 lowercase letters, digits, dots and hyphens (the S3 naming rules,
    // docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html).
    if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(s3[1])) throw new Error(`${backupPath} names no valid bucket: use s3://[BUCKET]/[PREFIX] with a lowercase bucket name.`);
    return { kind: "s3", bucket: s3[1], prefix: s3[2].replace(/\/+$/, "") };
  }
  return { kind: "folder", path: backupPath.replace(/\/+$/, "") || "." };
}

// One backup's name: its UTC time to the second, sortable ("2026-10-04T23-15-07Z").
export const stampOf = (d: Date) => d.toISOString().slice(0, 19).replace(/:/g, "-") + "Z";

// The database's name from its URL, which the restore asks to be typed.
export function databaseName(url: string): string {
  const name = new URL(url).pathname.replace(/^\//, "");
  if (!name) throw new Error("DATABASE_URL names no database.");
  return decoded(name, "database name");
}

// Two databases' row counts, table by table: the tables whose counts differ.
export function countDifferences(before: Record<string, number>, after: Record<string, number>): string[] {
  const names = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return names.filter((t) => before[t] !== after[t]).map((t) => `${t}: ${before[t] ?? "missing"} before, ${after[t] ?? "missing"} after`);
}
