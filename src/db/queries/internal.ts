// Helpers that take no session: the seed, the removal job (E11-2), the product's AI cap
// (src/lib/ai/client.ts, the one product file lint lets in) and the tests. Lint keeps this
// module out of every other file (eslint-rules/db-access.mjs), and the index barrel does not
// export it, so a route cannot reach a workspace by a bare id.
import { and, eq, gte, inArray, isNotNull, sum } from "drizzle-orm";
import { db } from "@/db";
import { aiRun, project, response, user, workspace } from "@/db/schema";
import type { WorkspaceId } from "@/db/types";
import { NotFoundError, SignedOutError } from "@/lib/errors";
import { isUuid } from "./scoped";
import { monthStart } from "./usage";
import { workspaces, type DeletedWorkspace, type NewWorkspace, type Workspace } from "./workspaces";

export const internal = {
  // The seed asks "is the sample there?"; deleted workspaces included, so a half-removed one
  // is seen too.
  getWorkspaceById: async (workspaceId: string): Promise<Workspace | null> =>
    isUuid(workspaceId) ? (await db.select().from(workspace).where(eq(workspace.id, workspaceId)).limit(1))[0] ?? null : null,
  // A workspace with no member yet: the seed's sample workspace (stories/E1-4, acceptance 4),
  // whose owner is attached by E2's first sign-in.
  createEmptyWorkspace: async (data: NewWorkspace & { id?: string }): Promise<Workspace> =>
    (await db.insert(workspace).values(data).returning())[0],
  // The removal job (stories/E11-2, acceptance 3): every workspace marked deleted, with the email
  // of the owner who deleted it.
  deletedWorkspaces: async (): Promise<DeletedWorkspace[]> =>
    (await db.select({ id: workspace.id, name: workspace.name, deletedAt: workspace.deletedAt, deletedByEmail: user.email })
      .from(workspace).leftJoin(user, eq(user.id, workspace.deletedBy)).where(isNotNull(workspace.deletedAt)))
      .map((r) => ({ id: r.id, name: r.name, deletedAt: r.deletedAt!, deletedByEmail: r.deletedByEmail })),
  // Deletes a deleted workspace's rows in decision 0028's order, in one transaction: its
  // responses (their answers and missing items go with them), then its projects (sets, items,
  // instruments, invites, actions, runs, uploads, export rows), then the workspace (members,
  // invitations, mappings). Counts per step. A workspace not marked deleted is left alone.
  purgeWorkspace: async (workspaceId: string): Promise<{ responses: number; projects: number; workspaces: number }> => {
    if (!isUuid(workspaceId)) return { responses: 0, projects: 0, workspaces: 0 };
    return db.transaction(async (tx) => {
      const marked = await tx.select({ id: workspace.id }).from(workspace).where(and(eq(workspace.id, workspaceId), isNotNull(workspace.deletedAt))).for("update");
      if (marked.length === 0) return { responses: 0, projects: 0, workspaces: 0 };
      const responses = (await tx.delete(response).where(eq(response.workspaceId, workspaceId)).returning({ id: response.id })).length;
      const projects = (await tx.delete(project).where(eq(project.workspaceId, workspaceId)).returning({ id: project.id })).length;
      const workspaces = (await tx.delete(workspace).where(eq(workspace.id, workspaceId)).returning({ id: workspace.id })).length;
      return { responses, projects, workspaces };
    });
  },
  // Removes the workspace and, through the cascades of schema v1, everything in it.
  hardDeleteWorkspace: async (workspaceId: string): Promise<boolean> =>
    isUuid(workspaceId) && (await db.delete(workspace).where(eq(workspace.id, workspaceId)).returning()).length > 0,
  // The product's own AI spend this month, across every workspace (decision 0036): the one
  // number the product cap reads. A sum, never a row, and nothing else reads across
  // workspaces. The sample projects' rows do not count, as in usage().
  productAiCostCentsThisMonth: async (now = new Date()): Promise<number> => {
    const ownProjects = db.select({ id: project.id }).from(project).where(eq(project.isSample, false));
    const [row] = await db.select({ cents: sum(aiRun.costEurCents) }).from(aiRun).where(and(gte(aiRun.createdAt, monthStart(now)), inArray(aiRun.projectId, ownProjects)));
    return Number(row.cents ?? 0);
  },
  // The workspace's AI budget (decision 0036): set from the admin area (E14-2) and the tests,
  // never through the session-scoped update, so no workspace member can change it.
  setAiBudgetEur: async (workspaceId: string, aiBudgetEur: number): Promise<Workspace | null> =>
    isUuid(workspaceId) && Number.isInteger(aiBudgetEur) && aiBudgetEur >= 0
      ? (await db.update(workspace).set({ aiBudgetEur }).where(eq(workspace.id, workspaceId)).returning())[0] ?? null
      : null,
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
