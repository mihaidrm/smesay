// Workspace-scoped helpers for the insight table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { insight } from "@/db/schema";
import { scoped } from "./scoped";

export type Insight = typeof insight.$inferSelect;
export const insights = scoped(insight);
