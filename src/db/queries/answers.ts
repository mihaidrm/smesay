// Workspace-scoped helpers for the answer table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { answer } from "@/db/schema";
import { scoped } from "./scoped";

export type Answer = typeof answer.$inferSelect;
export const answers = scoped(answer);
