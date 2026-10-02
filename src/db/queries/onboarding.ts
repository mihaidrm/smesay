// The first sign-in (stories/E2-3, acceptance 1 and 2): the workspace, its owner and its own
// copy of the sample project in one call. Not in the index barrel, because the seed imports the
// barrel and this file imports the seed; src/lib/onboarding.ts imports it by name. The
// workspace and the membership are one transaction (workspaces.create); the sample rows follow
// through the scoped helpers, and if any of them fails the workspace is removed again, so a
// person never lands in a half-made workspace.
import { internal } from "./internal";
import { unsafeWorkspaceId } from "./scoped";
import { workspaces, type NewWorkspace, type Workspace } from "./workspaces";
import { SAMPLE_PROJECT_NAME, seedSampleInto } from "@/db/seed/sample-seed";

export async function createWorkspaceWithSample(data: NewWorkspace, ownerUserId: string): Promise<Workspace> {
  const created = await workspaces.create(data, ownerUserId);
  try {
    await seedSampleInto(unsafeWorkspaceId(created.id), SAMPLE_PROJECT_NAME);
  } catch (error) {
    await internal.hardDeleteWorkspace(created.id);
    throw error;
  }
  return created;
}
