// The one permission check (stories/E2-4, acceptance 3): can(role, action). Owners can do
// everything; a member can run projects but cannot change the workspace itself, its members or
// its billing. Every owner-only server action calls requireRole() in src/lib/members.ts, which
// reads the actor's membership and calls this.
import type { MemberRole } from "@/db/types";

export const ACTIONS = [
  "projects.create", "projects.import", "projects.shape", "projects.build", "projects.share", "results.read", "results.export",
  "workspace.rename", "workspace.delete", "workspace.accent", "workspace.logo", "workspace.budget",
  "members.invite", "members.remove", "members.role", "billing.change",
] as const;
export type Action = (typeof ACTIONS)[number];

export const OWNER_ONLY: ReadonlySet<Action> = new Set<Action>([
  "workspace.rename", "workspace.delete", "workspace.accent", "workspace.logo", "workspace.budget",
  "members.invite", "members.remove", "members.role", "billing.change",
]);

export function can(role: MemberRole, action: Action): boolean {
  return role === "owner" || !OWNER_ONLY.has(action);
}
