// Workspace-scoped helpers for the instrument table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. latestForProject (stories/E5-1): the newest instrument of a project, the one
// Build opens; desc and orderBy: orm.drizzle.team/docs/select#order-by. createOnSet: one
// instrument per project and set, under the project row's lock (`.for("update")`,
// node_modules/drizzle-orm/pg-core/query-builders/select.d.ts; db.transaction:
// orm.drizzle.team/docs/transactions), so two opens of Build at once, or two "Build on
// version N" presses, end with one draft: the second finds the first's row and returns it.
// updateLocked (stories/E6-1, acceptance 5): a change under the instrument row's lock that
// reads whether the instrument is published (an invite row exists) inside the same lock,
// the one invites.publish takes, so a save that waited on a publish in flight sees the
// invite and is refused or narrowed. setPerspectives and tagItem (stories/E5-4) run under
// the same lock and check the same way, and a tag pressed while the names change cannot
// write a removed name back; the tags of the set's
// items are rewritten in one statement (unnest of two arrays WITH ORDINALITY,
// ARRAY(subquery): postgresql.org/docs/current/functions-srf.html,
// /sql-expressions.html#SQL-SYNTAX-ARRAY-CONSTRUCTORS). Each array arrives as one
// parameter: sql.param with the text[] column as the encoder, which Drizzle writes as a
// Postgres array literal (node_modules/drizzle-orm/pg-core/columns/common.js, PgArray
// mapToDriverValue, and pg-core/utils/array.js, makePgArray), cast with ::text[].
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { instrument, invite, item, project } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { renamePairs } from "@/lib/perspectives";
import { isUuid, scoped, type NewRow, type Patch } from "./scoped";

export type Instrument = typeof instrument.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const publishedIn = async (tx: Tx, workspaceId: WorkspaceId, instrumentId: string): Promise<boolean> =>
  (await tx.select({ id: invite.id }).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId))).limit(1)).length > 0;
export const instruments = {
  ...scoped(instrument),
  latestForProject: async (workspaceId: WorkspaceId, projectId: string): Promise<Instrument | null> => {
    if (!isUuid(projectId)) return null;
    const rows = await db.select().from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.projectId, projectId))).orderBy(desc(instrument.createdAt)).limit(1);
    return rows[0] ?? null;
  },
  // The instrument of the project on that set: the one that exists, or the one created from
  // data. Null when the project is not in the workspace.
  createOnSet: async (workspaceId: WorkspaceId, data: NewRow<typeof instrument>): Promise<Instrument | null> => {
    if (!isUuid(data.projectId) || !isUuid(data.itemSetId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select({ id: project.id }).from(project).where(and(eq(project.workspaceId, workspaceId), eq(project.id, data.projectId))).for("update");
      if (!locked) return null;
      const [existing] = await tx.select().from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.projectId, data.projectId), eq(instrument.itemSetId, data.itemSetId))).limit(1);
      if (existing) return existing;
      const [created] = await tx.insert(instrument).values({ ...data, workspaceId }).returning();
      return created;
    });
  },
  // A change decided under the lock: `patch(published)` returns what to write, or null to
  // refuse. Null when the instrument is not in the workspace; applied false when refused.
  updateLocked: async (workspaceId: WorkspaceId, instrumentId: string, patch: (published: boolean) => Patch<typeof instrument> | null): Promise<{ instrument: Instrument; published: boolean; applied: boolean } | null> => {
    if (!isUuid(instrumentId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select().from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.id, instrumentId))).for("update");
      if (!locked) return null;
      const published = await publishedIn(tx, workspaceId, instrumentId);
      const change = patch(published);
      if (change === null) return { instrument: locked, published, applied: false };
      const [updated] = await tx.update(instrument).set(change).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.id, instrumentId))).returning();
      return { instrument: updated ?? locked, published, applied: true };
    });
  },
  // The names, and every item of the instrument's set rewritten by the pairs (an old name
  // that survives and its new spelling, src/lib/perspectives.ts renamePairs, computed from
  // the names read under the lock, so two saves at once cannot pair against stale names):
  // a tag not in the pairs is dropped. Null when the instrument is not in the workspace;
  // refused once published (checked under the lock).
  setPerspectives: async (workspaceId: WorkspaceId, instrumentId: string, names: string[]): Promise<{ instrument: Instrument } | { refused: "published" } | null> => {
    if (!isUuid(instrumentId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select({ id: instrument.id, itemSetId: instrument.itemSetId, perspectives: instrument.perspectives }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.id, instrumentId))).for("update");
      if (!locked) return null;
      if (await publishedIn(tx, workspaceId, instrumentId)) return { refused: "published" as const };
      const pairs = renamePairs(locked.perspectives, names);
      const [updated] = await tx.update(instrument).set({ perspectives: names }).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.id, instrumentId))).returning();
      // sql.param with the column as the encoder: a bare array in the template would be
      // inlined as a list (drizzle-orm/sql/sql.js, buildQueryFromSourceParams).
      const from = sql.param(pairs.map((p) => p.from), item.perspectives);
      const to = sql.param(pairs.map((p) => p.to), item.perspectives);
      const kept = sql`ARRAY(SELECT m.new FROM unnest(${item.perspectives}) WITH ORDINALITY AS t(tag, i) JOIN unnest(${from}::text[], ${to}::text[]) AS m(old, new) ON m.old = t.tag ORDER BY t.i)`;
      await tx.update(item).set({ perspectives: kept }).where(and(eq(item.workspaceId, workspaceId), eq(item.itemSetId, locked.itemSetId), sql`${item.perspectives} <> ${kept}`));
      return updated ? { instrument: updated } : null;
    });
  },
  // One item's tags, each checked against the instrument's names under the same lock.
  // "set" when the item is not on the instrument's set, "names" when a tag is not one of
  // the instrument's names (as spelt), "published" once an invite exists (checked under the
  // lock), null when the instrument is not in the workspace.
  tagItem: async (workspaceId: WorkspaceId, instrumentId: string, itemId: string, tags: string[]): Promise<{ item: typeof item.$inferSelect } | { refused: "set" | "names" | "published" } | null> => {
    if (!isUuid(instrumentId) || !isUuid(itemId)) return null;
    return db.transaction(async (tx) => {
      const [locked] = await tx.select({ itemSetId: instrument.itemSetId, perspectives: instrument.perspectives }).from(instrument).where(and(eq(instrument.workspaceId, workspaceId), eq(instrument.id, instrumentId))).for("update");
      if (!locked) return null;
      if (await publishedIn(tx, workspaceId, instrumentId)) return { refused: "published" as const };
      if (tags.some((t) => !locked.perspectives.includes(t))) return { refused: "names" as const };
      const [updated] = await tx.update(item).set({ perspectives: tags }).where(and(eq(item.workspaceId, workspaceId), eq(item.id, itemId), eq(item.itemSetId, locked.itemSetId))).returning();
      return updated ? { item: updated } : { refused: "set" as const };
    });
  },
};
