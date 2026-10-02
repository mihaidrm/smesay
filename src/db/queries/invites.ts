// Workspace-scoped helpers for the invite table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { invite } from "@/db/schema";
import { scoped } from "./scoped";

export type Invite = typeof invite.$inferSelect;
export const invites = scoped(invite);
