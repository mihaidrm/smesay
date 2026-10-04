// The words of Settings, Data (stories/E11-2; docs/copy/app.md, Settings, and docs/copy/
// errors.md, Everything else). No database import.
import { formatUtc } from "@/lib/sharing-format";

export const WORKSPACE_DATA_COPY = {
  heading: "Data",
  exportTitle: "Export everything",
  exportLine: "One zip file with every project's JSON file, the workspace's settings, the members and the logo.",
  exportButton: "Download zip",
  exportFailed: "The zip export did not finish. Try again; if it fails again, reload the page and export again.",
  deleteTitle: "Delete this workspace",
  deleteLine: "Every project, response and file in this workspace is removed within 24 hours, and every member loses access at once. This cannot be undone. Export everything first if you want a copy.",
  deleteField: (name: string) => `Type the workspace's name, ${name}, to confirm`,
  deleteButton: "Delete workspace",
  wrongName: "The name does not match. Type the workspace's name exactly as it is shown, then press Delete workspace.",
  ownerOnly: "Only an owner can export or delete the workspace. Ask an owner.",
  deletedTitle: "Workspace deleted",
  deleted: (when: Date, ownerEmail: string | null) => `This workspace was deleted on ${formatUtc(when)}. Its data is removed within 24 hours.${ownerEmail ? ` Contact ${ownerEmail} if you did not expect this.` : ""}`,
  deletedButton: "Go to your workspaces",
  // Inside the zip.
  membersHeader: ["Name", "Email", "Role", "Joined"],
  roles: { owner: "Owner", member: "Member" } as Record<string, string>,
};
