// Workspace-scoped helpers for the missingItem table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { missingItem } from "@/db/schema";
import { scoped } from "./scoped";

export type MissingItem = typeof missingItem.$inferSelect;
export const missingItems = scoped(missingItem);
