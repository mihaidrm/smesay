// Workspace-scoped helpers for the aiRun table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { aiRun } from "@/db/schema";
import { scoped } from "./scoped";

export type AiRun = typeof aiRun.$inferSelect;
export const aiRuns = scoped(aiRun);
