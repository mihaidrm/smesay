// The admin page's words (stories/E13-2; docs/copy/app.md, Admin). Mihai's page only.
import type { AdminAction, AuditChanges, AuditOutcome, FunnelStep } from "@/db/types";

export const ADMIN_COPY = {
  title: "Overview",
  crumb: "SMEsay admin",
  intro: "Every workspace, its usage, and the steps from sign-up to submission. The sample projects are left out.",
  totals: { workspaces: "workspaces", projects: "projects", published: "instruments published", submitted: "responses submitted" },
  metric: (value: number, threshold: number | null) => (threshold === null ? `${value}. No threshold set yet: paid plans stay off.` : value >= threshold ? `${value} of ${threshold}: the threshold is reached, paid plans can switch on.` : `${value} of ${threshold} to switch paid plans on.`),
  funnelTitle: "Funnel per week",
  funnelNote: "Each step's count, and under it the share of the step before in the same week; a step can count more than the one before (one publish, many invites). Weeks start on Monday, UTC.",
  week: "Week of",
  steps: {
    signed_up: "Sign-ups", workspace_created: "Workspaces", project_created: "Projects", import_committed: "Imports",
    instrument_published: "Published", invite_sent: "Invites", link_opened: "Links opened", response_started: "Started",
    response_submitted: "Submitted", export_downloaded: "Exports",
  } satisfies Record<FunnelStep, string>,
  workspacesTitle: "Workspaces",
  columns: { name: "Name", created: "Created", source: "Came from", members: "Members", projects: "Projects", published: "Published", responses: "Responses this month", cost: "AI cost this month", last: "Last activity" },
  noWorkspaces: "No workspaces yet.",
  // A workspace with no recorded source: none in the link, or made before sources were kept
  // (stories/E13-3).
  noSource: "none recorded",
  loading: "Loading the overview",
};

// The share of the step before, as a percentage; nothing when the step before is 0.
export const share = (n: number, before: number): string => (before === 0 ? "" : `${Math.round((n / before) * 100)}%`);

// The admin shell (stories/E14-1, acceptance 2).
export const ADMIN_SHELL_COPY = {
  area: "Admin",
  nav: "Admin pages",
  overview: "Overview",
  workspaces: "Workspaces",
  people: "People",
  audit: "Audit log",
  back: "Back to the app",
};

// The audit log (stories/E14-1, acceptance 4).
export const AUDIT_COPY = {
  crumb: "SMEsay admin",
  title: "Audit log",
  intro: "Every action an admin took, newest first. Each row is written before its action runs, then marked with what became of it.",
  workspace: "Workspace",
  admin: "Admin",
  all: "All",
  apply: "Show",
  clear: "Clear the filters",
  columns: { time: "Time (UTC)", admin: "Admin", action: "Action", outcome: "Outcome", target: "Workspace or person", changes: "What changed" },
  outcomes: { done: "Done", refused: "Refused", failed: "Failed", none: "Not recorded" } satisfies Record<AuditOutcome | "none", string>,
  actions: {
    plan_changed: "Changed the plan", ai_budget_set: "Set the AI budget", invite_resent: "Sent an invitation again", link_revoked: "Revoked a link",
    workspace_restored: "Restored the workspace", note_added: "Added a support note", magic_link_sent: "Sent a sign-in link", signed_out_everywhere: "Signed the person out everywhere",
    member_removed: "Removed a member", account_deleted: "Deleted the account", view_started: "Started viewing as the owner", view_stopped: "Stopped viewing",
  } satisfies Record<AdminAction, string>,
  deleted: "deleted",
  markedDeleted: (name: string) => `${name} (deleted, removal pending)`,
  // A workspace or admin removed since, in the filter: the start of its id.
  gone: (id: string) => `deleted (${id.slice(0, 8)})`,
  none: "No admin actions yet.",
  noneFiltered: "No admin actions match these filters.",
  pageOf: (page: number, pages: number, total: number) => `Page ${page} of ${pages}, ${total} ${total === 1 ? "action" : "actions"}`,
  newer: "Newer",
  older: "Older",
  loading: "Loading the audit log",
};

// The changes of a row as one line: key: value pairs, in the order written.
export const auditChanges = (changes: AuditChanges): string =>
  Object.entries(changes).map(([k, v]) => `${k}: ${v === null ? "none" : String(v)}`).join(", ");
