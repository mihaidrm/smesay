// Workspace-scoped helpers for the aiRun table (stories/E1-3). Every call takes the workspace id
// first; see scoped.ts for the rule. The month's run count and cost are in usage.ts (E2-6), the
// one place that counts.
import { aiRun } from "@/db/schema";
import { scoped } from "./scoped";

export type AiRun = typeof aiRun.$inferSelect;
export const aiRuns = scoped(aiRun);
