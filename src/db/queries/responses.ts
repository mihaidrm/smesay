// Workspace-scoped helpers for the response table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { response } from "@/db/schema";
import { scoped } from "./scoped";

export type Response = typeof response.$inferSelect;
export const responses = scoped(response);
