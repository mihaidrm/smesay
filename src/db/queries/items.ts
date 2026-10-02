// Workspace-scoped helpers for the item table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { item } from "@/db/schema";
import { scoped } from "./scoped";

export type Item = typeof item.$inferSelect;
export const items = scoped(item);
