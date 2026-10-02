// createWorkspaceWithSample (stories/E2-3, acceptance 1 and 2): the owner membership, the sample
// copy, and a second workspace with the same name getting a suffixed slug. The rollback after
// a failed sample insert is not forced here (no helper fails on demand); it is read in the code.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ensureTestDatabase } from "../test-db";
import { items, members, projects } from "@/db/queries";
import { internal } from "@/db/queries/internal";
import { createWorkspaceWithSample, isUniqueViolation } from "@/db/queries/onboarding";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import { expected } from "@/db/seed/sample";

let sql: ReturnType<typeof postgres>;
const userId = `onboarding-${Date.now()}`;
const made: string[] = [];

beforeAll(async () => {
  const url = await ensureTestDatabase();
  sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${userId}, 'Onboarding', ${userId + "@example.com"}, true, now(), now())`;
}, 60_000);

afterAll(async () => {
  for (const id of made) await internal.hardDeleteWorkspace(id);
  await sql`delete from "user" where id = ${userId}`;
  await sql.end();
});

describe("createWorkspaceWithSample", () => {
  it("creates the workspace with its owner and its own sample project", async () => {
    const stamp = Date.now();
    const w = await createWorkspaceWithSample({ name: "Marlow Group", slug: `marlow-group-${stamp}` }, userId);
    made.push(w.id);
    const ws = unsafeWorkspaceId(w.id);
    expect(await members.list(ws)).toMatchObject([{ userId, role: "owner" }]);
    expect(await projects.list(ws)).toMatchObject([{ name: "Sample project", isSample: true }]);
    expect(await items.count(ws)).toBe(expected.items);
  });

  it("gives a second workspace with a taken slug a suffixed one", async () => {
    const slug = `taken-${Date.now()}`;
    const first = await createWorkspaceWithSample({ name: "Taken", slug }, userId);
    const second = await createWorkspaceWithSample({ name: "Taken", slug }, userId);
    made.push(first.id, second.id);
    expect(first.slug).toBe(slug);
    expect(second.slug).toMatch(new RegExp(`^${slug}-[0-9a-f]{4}$`));
    expect(second.id).not.toBe(first.id);
  });

  it("recognises a unique violation through Drizzle's cause chain", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation(Object.assign(new Error("Failed query"), { cause: { code: "23505" } }))).toBe(true);
    expect(isUniqueViolation(Object.assign(new Error("Failed query"), { cause: { code: "23503" } }))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
