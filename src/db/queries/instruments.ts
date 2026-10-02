// Workspace-scoped helpers for the instrument table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. Specific queries for later epics are added here, never in
// routes or pages.
import { instrument } from "@/db/schema";
import { scoped } from "./scoped";

export type Instrument = typeof instrument.$inferSelect;
export const instruments = scoped(instrument);
