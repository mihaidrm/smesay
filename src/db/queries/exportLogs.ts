// Workspace-scoped helpers for the export_log table (stories/E10-1, acceptance 5): one row per
// download, written by the export route. Every call takes the workspace id first; see
// scoped.ts for the rule.
import { exportLog } from "@/db/schema";
import { scoped } from "./scoped";

export type ExportLog = typeof exportLog.$inferSelect;
export const exportLogs = scoped(exportLog);
