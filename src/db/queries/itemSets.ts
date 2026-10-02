// Workspace-scoped helpers for the itemSet table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { itemSet } from "@/db/schema";
import { scoped } from "./scoped";

export type ItemSet = typeof itemSet.$inferSelect;
export const itemSets = scoped(itemSet);
