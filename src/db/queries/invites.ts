// Workspace-scoped helpers for the invite table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages. anyForInstrument (stories/E5-2): whether the instrument has a link or an
// invite, which makes it published and locks its method; one row at most is read, never the
// tokens or emails of the rest.
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { invite } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { isUuid, scoped } from "./scoped";

export type Invite = typeof invite.$inferSelect;
export const invites = {
  ...scoped(invite),
  anyForInstrument: async (workspaceId: WorkspaceId, instrumentId: string): Promise<boolean> => {
    if (!isUuid(instrumentId)) return false;
    const rows = await db.select({ id: invite.id }).from(invite).where(and(eq(invite.workspaceId, workspaceId), eq(invite.instrumentId, instrumentId))).limit(1);
    return rows.length > 0;
  },
};
