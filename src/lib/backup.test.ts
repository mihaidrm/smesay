// The deciding parts of backup and restore (stories/E11-4): which command runs the Postgres
// tools, where a backup goes, its name, the database name to type, and the count comparison.
import { describe, expect, it } from "vitest";
import { connectionEnv, countDifferences, databaseName, pgCommand, redact, stampOf, targetOf, toolsFrom } from "./backup";

describe("backup", () => {
  it("runs the Postgres tools locally, through compose or through docker", () => {
    expect(pgCommand("local", "pg_dump", ["-Fc", "url"])).toEqual({ cmd: "pg_dump", args: ["-Fc", "url"] });
    const pass = ["-e", "PGHOST", "-e", "PGPORT", "-e", "PGUSER", "-e", "PGPASSWORD", "-e", "PGSSLMODE"];
    expect(pgCommand("compose", "pg_restore", ["-l"])).toEqual({ cmd: "docker", args: ["compose", "exec", "-T", ...pass, "postgres", "pg_restore", "-l"] });
    expect(pgCommand("docker", "psql", ["db"])).toEqual({ cmd: "docker", args: ["run", "--rm", "-i", "--network", "host", ...pass, "postgres:16-alpine", "psql", "db"] });
    expect([toolsFrom("docker"), toolsFrom("brew"), toolsFrom(undefined)]).toEqual(["docker", null, null]);
  });
  it("reads a folder or an S3 prefix, names a backup by its time and a database by its URL", () => {
    expect(targetOf("/backups/")).toEqual({ kind: "folder", path: "/backups" });
    expect(targetOf("s3://smesay-backups/nightly/")).toEqual({ kind: "s3", bucket: "smesay-backups", prefix: "nightly" });
    expect(() => targetOf("s3://MyBucket/x")).toThrow(/valid bucket/);
    expect(stampOf(new Date("2026-10-04T23:15:07.123Z"))).toBe("2026-10-04T23-15-07Z");
    expect(databaseName("postgres://u:p@localhost:5432/smesay_restore?sslmode=disable")).toBe("smesay_restore");
    expect(() => databaseName("postgres://u:p@localhost:5432")).toThrow();
  });
  it("puts the connection in libpq's variables and keeps the password out of an error", () => {
    expect(connectionEnv("postgres://u%40x:p%2Fw@db.example:6543/app?sslmode=require")).toEqual({ PGHOST: "db.example", PGPORT: "6543", PGUSER: "u@x", PGPASSWORD: "p/w", PGSSLMODE: "require" });
    expect(connectionEnv("postgres://u:p@localhost/app").PGPORT).toBe("5432");
    const url = "postgres://u:Secr3t%zzPW@localhost:5432/app";
    const said = redact(`one\ntwo\nthree\nfour\nfive\npg_dump: error: invalid percent-encoded token: "Secr3t%zzPW" in ${url}`, url);
    expect(said).not.toContain("Secr3t");
    expect(said.split("\n")).toHaveLength(5);
  });
  it("lists the tables whose counts differ", () => {
    expect(countDifferences({ answer: 34, item: 6 }, { answer: 34, item: 6 })).toEqual([]);
    expect(countDifferences({ answer: 34, item: 6 }, { answer: 30, upload: 1 })).toEqual(["answer: 34 before, 30 after", "item: 6 before, missing after", "upload: missing before, 1 after"]);
  });
});
