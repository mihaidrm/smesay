// The deciding parts of backup and restore (stories/E11-4): which command runs the Postgres
// tools, where a backup goes, its name, the database name to type, and the count comparison.
import { describe, expect, it } from "vitest";
import { countDifferences, databaseName, pgCommand, stampOf, targetOf, toolsFrom } from "./backup";

describe("backup", () => {
  it("runs the Postgres tools locally, through compose or through docker", () => {
    expect(pgCommand("local", "pg_dump", ["-Fc", "url"])).toEqual({ cmd: "pg_dump", args: ["-Fc", "url"] });
    expect(pgCommand("compose", "pg_restore", ["-l"])).toEqual({ cmd: "docker", args: ["compose", "exec", "-T", "postgres", "pg_restore", "-l"] });
    expect(pgCommand("docker", "psql", ["url"])).toEqual({ cmd: "docker", args: ["run", "--rm", "-i", "--network", "host", "postgres:16-alpine", "psql", "url"] });
    expect([toolsFrom("docker"), toolsFrom("brew"), toolsFrom(undefined)]).toEqual(["docker", null, null]);
  });
  it("reads a folder or an S3 prefix, names a backup by its time and a database by its URL", () => {
    expect(targetOf("/backups/")).toEqual({ kind: "folder", path: "/backups" });
    expect(targetOf("s3://smesay-backups/nightly/")).toEqual({ kind: "s3", bucket: "smesay-backups", prefix: "nightly" });
    expect(stampOf(new Date("2026-10-04T23:15:07.123Z"))).toBe("2026-10-04T23-15-07Z");
    expect(databaseName("postgres://u:p@localhost:5432/smesay_restore?sslmode=disable")).toBe("smesay_restore");
    expect(() => databaseName("postgres://u:p@localhost:5432")).toThrow();
  });
  it("lists the tables whose counts differ", () => {
    expect(countDifferences({ answer: 34, item: 6 }, { answer: 34, item: 6 })).toEqual([]);
    expect(countDifferences({ answer: 34, item: 6 }, { answer: 30, upload: 1 })).toEqual(["answer: 34 before, 30 after", "item: 6 before, missing after", "upload: missing before, 1 after"]);
  });
});
