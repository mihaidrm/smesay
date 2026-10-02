// Helpers that take no session: the seed, the removal job (E11-2) and the tests. Lint keeps this
// module out of every other file (eslint-rules/db-access.mjs), and the index barrel does not
// export it, so a route cannot reach a workspace by a bare id.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workspace } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { NotFoundError, SignedOutError } from "@/lib/errors";
import { isUuid } from "./scoped";
import { workspaces, type NewWorkspace, type Workspace } from "./workspaces";

export const internal = {
  // The seed asks "is the sample there?"; deleted workspaces included, so a half-removed one
  // is seen too.
  getWorkspaceById: async (workspaceId: string): Promise<Workspace | null> =>
    isUuid(workspaceId) ? (await db.select().from(workspace).where(eq(workspace.id, workspaceId)).limit(1))[0] ?? null : null,
  // A workspace with no member yet: the seed's sample workspace (stories/E1-4, acceptance 4),
  // whose owner is attached by E2's first sign-in.
  createEmptyWorkspace: async (data: NewWorkspace & { id?: string }): Promise<Workspace> =>
    (await db.insert(workspace).values(data).returning())[0],
  // Removes the workspace and, through the cascades of schema v1, everything in it.
  hardDeleteWorkspace: async (workspaceId: string): Promise<boolean> =>
    isUuid(workspaceId) && (await db.delete(workspace).where(eq(workspace.id, workspaceId)).returning()).length > 0,
};

// The membership check behind requireWorkspace(headers, workspaceId) in src/lib/workspace.ts,
// for a user id the caller already trusts (the session, or a test). NotFoundError for a
// non-member, a missing or deleted workspace or a non-uuid id; SignedOutError for no user.
export async function requireWorkspaceForUser(userId: string | null, workspaceId: string): Promise<WorkspaceId> {
  if (!userId) throw new SignedOutError();
  const found = await workspaces.getForUser(userId, workspaceId);
  if (!found) throw new NotFoundError("This workspace does not exist, or you are not a member of it. Check the address, or go to your projects.");
  return found.id as WorkspaceId;
}
