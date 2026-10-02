// Project actions (stories/E3-1): create (within the plan, E2-6), save the context (2,000
// characters together, src/lib/project-context.ts), archive and unarchive (nothing is deleted,
// decision 0028), delete the sample (stories/E8-8, acceptance 3). The sample is read-only on
// the server too (E8-8, acceptance 2): saveContext refuses it with a message, setArchived with
// 403, since the browser never shows that button for it. The WorkspaceId comes from
// requireWorkspace() through the shell; every member may do these (src/lib/permissions.ts,
// projects.create is not owner-only). Messages: docs/copy/errors.md and app.md.
import { projects } from "@/db/queries";
import type { Project } from "@/db/queries/projects";
import type { WorkspaceId } from "@/db/types";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { PROJECTS_COPY } from "@/lib/projects-copy";
import { withinPlan } from "@/lib/plans";
import { contextError } from "@/lib/project-context";
import { workspaceNameSchema } from "@/lib/workspace-name";

export { PROJECTS_COPY };

export async function createProject(actor: { ws: WorkspaceId; userId: string }, rawName: unknown): Promise<{ error: string } | { project: Project }> {
  const name = workspaceNameSchema.safeParse(rawName);
  if (!name.success) return { error: PROJECTS_COPY.badName };
  if (!(await withinPlan(actor.ws, "projects"))) return { error: PROJECTS_COPY.planFull };
  const project = await projects.create(actor.ws, { name: name.data, createdBy: actor.userId });
  return { project };
}

export async function saveContext(ws: WorkspaceId, projectId: string, rawGoal: unknown, rawTerms: unknown): Promise<{ error: string } | { project: Project }> {
  const goal = String(rawGoal ?? "").trim();
  const terms = String(rawTerms ?? "").trim();
  const error = contextError(goal, terms);
  if (error) return { error };
  const current = await projects.get(ws, projectId);
  if (!current) throw new NotFoundError();
  if (current.isSample) return { error: PROJECTS_COPY.sample };
  const project = await projects.update(ws, projectId, { contextGoal: goal || null, contextTerms: terms || null, updatedAt: new Date() });
  if (!project) throw new NotFoundError();
  return { project };
}

export async function setArchived(ws: WorkspaceId, projectId: string, archived: boolean): Promise<Project> {
  const current = await projects.get(ws, projectId);
  if (!current) throw new NotFoundError();
  if (current.isSample) throw new ForbiddenError(PROJECTS_COPY.sample);
  const project = await projects.setArchived(ws, projectId, archived);
  if (!project) throw new NotFoundError();
  return project;
}

export async function deleteSample(ws: WorkspaceId, projectId: string): Promise<boolean> {
  return projects.deleteSample(ws, projectId);
}
