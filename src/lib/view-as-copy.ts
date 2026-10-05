// The words of an admin's view of a workspace (stories/E14-4; docs/copy/app.md, View as; the
// refusal in docs/copy/errors.md). No imports, so client components may use it.
export const VIEW_AS_COPY = {
  banner: (workspace: string, until: string) => `You are viewing ${workspace} as its owner sees it. Changes are off. The view ends at ${until} UTC.`,
  stop: "Stop viewing",
  start: "View as the owner",
  startLine: "This opens the workspace's pages as its owner sees them, read-only, for 60 minutes. Respondent names and answers are visible there; starting and stopping are recorded in the audit log.",
  confirmStart: (workspace: string) => `View ${workspace} as its owner sees it? Respondent names and answers will be visible to you.`,
  refused: (workspace: string) => `You are viewing as ${workspace}. Changes are off.`,
  refusedLine: "Stop viewing to go back to your own workspace, or keep looking: every page of this workspace is open to you, read-only.",
  back: "Back to the projects",
  notDeleted: "This workspace is marked deleted. Restore it first.",
  // Build during a view, for a project with a list and no instrument yet (the owner's first
  // open of Build makes one; a view does not).
  buildNotOpened: "The owner has not opened Build for this project yet, so it has no instrument to show.",
};
