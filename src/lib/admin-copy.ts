// The admin page's words (stories/E13-2; docs/copy/app.md, Admin). Mihai's page only.
import type { AdminAction, AuditChanges, AuditOutcome, FunnelStep, PlanKey } from "@/db/types";

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

// The changes of a row as one line: key: value pairs by key in alphabetical order (jsonb keeps
// its own key order, not the order written: postgresql.org/docs/current/datatype-json.html).
export const auditChanges = (changes: AuditChanges): string =>
  Object.entries(changes).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}: ${v === null ? "none" : String(v)}`).join(", ");

// An instrument's state on the admin workspace page (stories/E14-2, acceptance 2): a draft until
// published; then its public link in force decides: revoked, closed (the close date passed) or
// published.
export type InstrumentState = "draft" | "published" | "closed" | "revoked";
export function instrumentState(publishedAt: Date | null, link: { closesAt: Date | null; revokedAt: Date | null } | null, now = new Date()): InstrumentState {
  if (!publishedAt) return "draft";
  if (link?.revokedAt) return "revoked";
  if (link?.closesAt && link.closesAt <= now) return "closed";
  return "published";
}

export const formatBytes = (n: number): string => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

const WORKSPACE_PLAN_NAMES: Record<PlanKey, string> = { free: "Free", pro: "Pro", team: "Team", enterprise: "Enterprise" };

// The Workspaces list and a workspace's admin page (stories/E14-2).
export const WORKSPACE_ADMIN_COPY = {
  crumb: "SMEsay admin",
  listTitle: "Workspaces",
  listIntro: "Every workspace, deleted ones too, by last activity. The figures leave the sample projects out.",
  search: "Name, slug or a member's email",
  searchButton: "Search",
  clear: "Clear",
  columns: { name: "Name", plan: "Plan", created: "Created", owners: "Owners", members: "Members", projects: "Projects", published: "Published", responses: "Responses this month", cost: "AI cost this month", last: "Last activity" },
  deletedOn: (date: string) => `Deleted ${date}`,
  none: "No workspaces yet.",
  noMatch: (q: string) => `No workspace matches "${q}".`,
  loading: "Loading the workspaces",
  back: "All workspaces",
  sections: { settings: "Settings", budget: "AI budget", members: "Members", invites: "Invitations waiting", projects: "Projects", uploads: "Uploads", events: "Last 20 product events", notes: "Support notes", deleted: "Marked deleted" },
  settings: { slug: "Slug", accent: "Accent", logo: "Logo", logoSet: "set", logoNone: "none", accentNone: "default", plan: "Plan", created: "Created" },
  deletedLine: (when: string, by: string | null) => `Deleted ${when}${by ? ` by ${by}` : ""}. The removal job deletes it within 24 hours of that; until then it can be restored.`,
  budgetLine: (spent: string, budget: number) => `${spent} spent this month of EUR ${budget}. Seen and set only here (decision 0036).`,
  budgetLabel: "Monthly AI budget in euro",
  planLabel: "Plan",
  // The plans' names as src/lib/plans.ts PLANS has them (a test keeps the two equal); written
  // here because the confirm form is a client component and plans.ts reads the database.
  plans: WORKSPACE_PLAN_NAMES,
  memberColumns: { name: "Name", email: "Email", role: "Role", joined: "Joined" },
  roles: { owner: "Owner", member: "Member" },
  inviteColumns: { email: "Email", invited: "Invited", expires: "Link expires" },
  expired: (when: string) => `${when} (expired)`,
  noInvites: "No invitations waiting.",
  noMembers: "No members. Members of a deleted workspace can leave it before it is removed.",
  projectColumns: { name: "Project", status: "Status", items: "Items", version: "Latest version", archived: "Archived" },
  noProjects: "No projects.",
  instrumentColumns: { title: "Instrument", state: "State", link: "Links", created: "Created", published: "Published", opens: "Opens", closes: "Closes", version: "Built on" },
  states: { draft: "Draft", published: "Published", closed: "Closed", revoked: "Revoked" } satisfies Record<InstrumentState, string>,
  links: (pub: boolean, personal: number) => [pub ? "public" : null, personal ? `${personal} personal` : null].filter(Boolean).join(", ") || "none",
  version: (v: number) => `version ${v}`,
  uploadColumns: { file: "File", kind: "Kind", size: "Size", date: "Uploaded" },
  noUploads: "No uploads.",
  noEvents: "No product events yet.",
  noNotes: "No notes yet.",
  deletedAdmin: "deleted",
  items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
  noteLabel: "A note for this workspace, seen only here",
  yes: "yes",
  no: "no",
  never: "not set",
  // The action buttons, each with its confirm line (acceptance 3).
  changePlan: "Change the plan",
  confirmPlan: (name: string) => `Change the plan of ${name} to [VALUE]? The workspace's limits change at once.`,
  setBudget: "Set the budget",
  confirmBudget: (name: string) => `Set the AI budget of ${name} to EUR [VALUE] a month?`,
  resend: "Send again",
  confirmResend: (email: string) => `Send the invitation to ${email} again? They get a new sign-in link; an earlier one still works until it expires.`,
  revoke: "Revoke the link",
  confirmRevoke: (title: string) => `Revoke the public link of ${title}? Respondents see that it is no longer active; answers given so far stay.`,
  restore: "Restore the workspace",
  confirmRestore: (name: string) => `Restore ${name}? Members who have not left it get it back. Files the removal job already deleted do not come back.`,
  addNote: "Add the note",
  confirmNote: "Add this note? It cannot be edited or removed.",
  confirm: "Confirm",
  cancel: "Cancel",
  // Results and refusals (docs/copy/errors.md, Admin).
  planDone: (plan: PlanKey) => `Plan changed to ${WORKSPACE_PLAN_NAMES[plan]}.`,
  budgetDone: (eur: number) => `AI budget set to EUR ${eur} a month.`,
  resent: (email: string) => `Invitation sent again to ${email}.`,
  revoked: "Link revoked.",
  restored: "Workspace restored.",
  noted: "Note added.",
  missing: "This workspace no longer exists. Go back to the list.",
  gone: "This changed in the meantime. Reload the page and try again.",
  failed: "That did not work, and it has been logged. Try again in a minute.",
  badPlan: "Pick a plan from the list.",
  samePlan: "The workspace is already on this plan.",
  deletedNoChange: "This workspace is marked deleted. Restore it first.",
  // Shown in place of an action the product would refuse for this instrument.
  noRevoke: { sample: "sample", archived: "project archived", replaced: "replaced by a newer instrument", deleted: "" },
  badBudget: "Enter a whole number of euro from 0 to 10000.",
  sameBudget: "The budget is already this amount.",
  notDeleted: "This workspace is not marked deleted, or the removal job has already removed it.",
  emptyNote: "Write the note first.",
  longNote: "Notes are up to 2,000 characters. Shorten it and add it again.",
};

// The People list and a person's admin page (stories/E14-3).
export const PEOPLE_ADMIN_COPY = {
  crumb: "SMEsay admin",
  listTitle: "People",
  listIntro: "Everyone with an account, by last sign-in. Respondents have no account and are not here.",
  search: "Email or name",
  searchButton: "Search",
  clear: "Clear",
  columns: { email: "Email", name: "Name", verified: "Email verified", methods: "Signs in with", workspaces: "Workspaces", created: "Created", last: "Last sign-in", sessions: "Open sessions" },
  methods: { link: "Sign-in link", google: "Google", microsoft: "Microsoft" } satisfies Record<"link" | "google" | "microsoft", string>,
  roles: { owner: "owner", member: "member" },
  none: "No accounts yet.",
  noMatch: (q: string) => `Nobody matches "${q}".`,
  loading: "Loading the people",
  back: "All people",
  yes: "yes",
  no: "no",
  never: "never",
  sections: { account: "Account", workspaces: "Workspaces", sessions: "Sessions", invites: "Invitations waiting", events: "Last 20 product events", danger: "Delete the account" },
  sessionColumns: { started: "Started", expires: "Expires", browser: "Browser", state: "State" },
  sessionOpen: "open",
  sessionExpired: "expired",
  noSessions: "No sessions.",
  noWorkspaces: "Not a member of any workspace.",
  noInvites: "No invitations waiting.",
  inviteLine: (workspace: string, when: string, open: boolean) => `${workspace}, invited ${when}${open ? "" : " (the link has expired)"}`,
  noEvents: "No product events yet.",
  deleteLine: "Only at the person's own request. Their memberships go; what they made in workspaces stays without their name.",
  // The action buttons, each with its confirm line (acceptance 3).
  sendLink: "Send a sign-in link",
  confirmSendLink: (email: string) => `Send a sign-in link to ${email}? It works once and expires in 15 minutes.`,
  signOut: "Sign out everywhere",
  confirmSignOut: (email: string) => `Sign ${email} out on every device?`,
  remove: "Remove",
  confirmRemove: (email: string, workspace: string) => `Remove ${email} from ${workspace}?`,
  deleteAccount: "Delete the account",
  confirmDelete: (email: string) => `Delete the account of ${email}? This cannot be undone.`,
  // Results and refusals (docs/copy/errors.md, Admin).
  linkSent: (email: string) => `Sign-in link sent to ${email}.`,
  signedOut: (n: number) => (n === 1 ? "1 session ended." : `${n} sessions ended.`),
  removed: (workspace: string) => `Removed from ${workspace}.`,
  deleted: "Account deleted.",
  missing: "This account no longer exists. Go back to the list.",
  notSent: "The sign-in link was not sent. Try again in a minute.",
  failed: "That did not work, and it has been logged. Try again in a minute.",
  notMember: "This person is not a member of that workspace.",
  self: "You cannot delete your own account from here.",
  soleOwner: (names: string[]) => `This person is the only owner of ${names.join(", ")}. Make someone else an owner there first, or delete the workspace.`,
};
