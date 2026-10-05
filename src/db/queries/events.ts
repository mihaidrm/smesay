// The event table (stories/E13-1): written only through track() (src/lib/analytics.ts). The
// workspace id is a WorkspaceId from the session, or null for the events kept without one
// (src/lib/analytics-catalogue.ts NO_WORKSPACE_EVENTS).
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { event } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";

export type EventRow = typeof event.$inferSelect;

export const events = {
  record: async (workspaceId: WorkspaceId | null, row: { userId: string | null; name: string; properties: Record<string, string | number> }): Promise<void> => {
    await db.insert(event).values({ workspaceId, userId: row.userId, name: row.name, properties: row.properties });
  },
  // For the tests of the steps that write a respondent event (lint keeps it out of the app).
  countForInstrument: async (workspaceId: WorkspaceId, name: string, instrumentId: string): Promise<number> =>
    (await db.select({ n: count() }).from(event).where(and(eq(event.workspaceId, workspaceId), eq(event.name, name), sql`${event.properties}->>'instrument' = ${instrumentId}`)))[0].n,
  // The newest event of a name whose property `key` is `value` (the rescue tip after a refused
  // shaping run, stories/E15-4).
  lastWith: async (workspaceId: WorkspaceId, name: string, key: string, value: string): Promise<{ createdAt: Date; properties: Record<string, string | number> } | null> =>
    (await db.select({ createdAt: event.createdAt, properties: event.properties }).from(event).where(and(eq(event.workspaceId, workspaceId), eq(event.name, name), sql`${event.properties}->>${key} = ${value}`)).orderBy(desc(event.createdAt)).limit(1))[0] ?? null,
  countInWorkspace: async (workspaceId: WorkspaceId, name: string): Promise<number> =>
    (await db.select({ n: count() }).from(event).where(and(eq(event.workspaceId, workspaceId), eq(event.name, name))))[0].n,
};
