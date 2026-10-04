// The first sign-in (stories/E2-3, acceptance 1 and 2): the workspace, its owner and its own
// copy of the sample project in one call, from src/app/app/actions.ts. Not in the index barrel,
// because the seed imports the barrel and this file imports the seed. The workspace and the
// membership are one transaction (workspaces.create); the sample rows follow through the scoped
// helpers, and if any of them fails the workspace is removed again, so a person never lands in
// a half-made workspace. The slug is the name's (src/lib/workspace-name.ts); a taken one fails
// with unique_violation, SQLSTATE 23505 (postgresql.org/docs/current/errcodes-appendix.html),
// which Drizzle wraps in its own error with the PostgresError as `cause`
// (node_modules/drizzle-orm/errors.js, DrizzleQueryError), and the next try adds a 4 character
// suffix; three tries, then the error is thrown.
import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { workspace, workspaceInvite, workspaceMember } from "@/db/schema";
import { internal } from "./internal";
import { unsafeWorkspaceId } from "./scoped";
import { workspaces, type Workspace } from "./workspaces";
import { SAMPLE_PROJECT_NAME, seedSampleInto } from "@/db/seed/sample-seed";

export function isUniqueViolation(error: unknown): boolean {
  for (let e = error, depth = 0; typeof e === "object" && e !== null && depth < 5; e = (e as { cause?: unknown }).cause, depth++) {
    if ((e as { code?: unknown }).code === "23505") return true;
  }
  return false;
}

export async function createWorkspaceWithSample({ name, slug }: { name: string; slug: string }, ownerUserId: string): Promise<Workspace> {
  let created: Workspace | null = null;
  for (let attempt = 0; created === null; attempt++) {
    const candidate = attempt === 0 ? slug : `${slug}-${randomBytes(2).toString("hex")}`;
    try {
      created = await workspaces.create({ name, slug: candidate }, ownerUserId);
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }
  try {
    await seedSampleInto(unsafeWorkspaceId(created.id), SAMPLE_PROJECT_NAME);
  } catch (error) {
    await internal.hardDeleteWorkspace(created.id);
    throw error;
  }
  return created;
}

// The invitee's side (stories/E2-4, acceptance 2): on a signed-in request, every open
// invitation for the person's address sent within the last validMinutes becomes a membership,
// in one transaction, and is marked accepted. Called by src/lib/current-workspace.ts before the
// memberships are listed; the email is the session's, never a request's, and the window is
// src/lib/invites.ts's, passed in so src/db imports nothing from src/lib. Addresses are stored
// in lower case (workspaceInvites.replace), so the index on email serves the lookup. Returns
// how many memberships were added. on conflict do nothing:
// orm.drizzle.team/docs/insert#on-conflict-do-nothing.
export async function acceptPendingInvites(userId: string, email: string, validMinutes: number): Promise<number> {
  const address = email.trim().toLowerCase();
  const since = new Date(Date.now() - validMinutes * 60 * 1000);
  return db.transaction(async (tx) => {
    // A deleted workspace's invitations are not accepted (stories/E11-2): it takes no new member.
    const open = (await tx.select({ invite: workspaceInvite }).from(workspaceInvite).innerJoin(workspace, eq(workspace.id, workspaceInvite.workspaceId))
      .where(and(eq(workspaceInvite.email, address), isNull(workspaceInvite.acceptedAt), gt(workspaceInvite.invitedAt, since), isNull(workspace.deletedAt)))).map((r) => r.invite);
    let added = 0;
    for (const invite of open) {
      const inserted = await tx.insert(workspaceMember).values({ workspaceId: invite.workspaceId, userId, role: invite.role }).onConflictDoNothing().returning();
      added += inserted.length;
      await tx.update(workspaceInvite).set({ acceptedAt: new Date() }).where(eq(workspaceInvite.id, invite.id));
    }
    return added;
  });
}
