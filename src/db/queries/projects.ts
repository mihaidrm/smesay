// Workspace-scoped helpers for the project table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { project } from "@/db/schema";
import { scoped } from "./scoped";

export type Project = typeof project.$inferSelect;
export const projects = scoped(project);
