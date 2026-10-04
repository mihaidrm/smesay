// The exports' words (stories/E10-1; docs/copy/app.md, Results, Export). No database import.
import type { CsvFile, ExportFile } from "@/db/types";

export const EXPORT_COPY = {
  watermark: "Sample data, invented",
  filtered: (filters: string) => `Filtered: ${filters}`,
  withUnsubmitted: "Includes answers not submitted yet",
  sources: { public: "Public link", personal: "Personal invite" },
  statuses: { invited: "Invited", inProgress: "In progress", submitted: "Submitted" },
  columns: {
    respondent: "Respondent", reference: "Reference", area: "Area", item: "Item", original: "Original text",
    proposedValue: "Proposed value", proposedLabel: "Proposed label", answer: "Answer", theirValue: "Their value", theirLabel: "Their label",
    reasonOrQuestion: "Reason or question", comment: "Comment", submittedAt: "Submitted at", sinceSubmit: "Since submitting", source: "Source", perspectives: "Perspectives",
    notAnswered: "Not answered", agreement: "Agreement %", status: "Status", answered: "Answered", visible: "Items seen",
    minutes: "Minutes to submit", reminders: "Reminders", withComment: "Answers with a reason or comment",
    suggested: "Suggested item", suggestedArea: "Suggested area", suggestedValue: "Suggested value", suggestedLabel: "Suggested label",
  },
  // The Export tab (E10-1, acceptance 1).
  tab: {
    line: "Each file holds what this page shows: the same filter and the same switch. The answer counts, the item counts, the people and the missing items on this page add up from the files' rows.",
    files: {
      answers: { title: "Answers", line: "One row per answer: the respondent and their fields, the item, the answer, their value, the reason or question and the comment." },
      items: { title: "Items with totals", line: "One row per item: the counts of each answer, not answered, and the agreement." },
      people: { title: "People", line: "One row per person: the Responses tab's columns and the minutes to submit." },
      missing: { title: "Missing items", line: "One row per missing item suggested, with who suggested it." },
    } satisfies Record<CsvFile, { title: string; line: string }>,
    // E10-2: the whole project as one JSON file.
    project: { title: "Whole project", line: "One JSON file with every version of the list, the instruments, the invites without their links, every response with its answers, the missing items and the actions. Import it into another workspace from the project list.", download: "Download JSON", failed: "The JSON export did not finish. Try again; if it fails again, reload the page and export again." },
    download: "Download CSV",
    downloading: "Preparing the file",
    // docs/copy/errors.md, Dashboard and exports: Export failed.
    failed: "The CSV export did not finish. Try again; if it fails again, reload the page and export again.",
    sample: "The sample's files start with the line \"Sample data, invented\".",
  },
  // E10-2: the import page.
  importPage: {
    title: "Import a project",
    line: "Choose the .json file made with Whole project on a project's Export tab. The project comes in with its lists, instruments, responses and actions. Its public link comes in revoked: press Publish again on the Share page for a new one. Personal invites keep their state, with links nobody has yet: Remind sends a link to the people who have not started; for anyone else, revoke their invite and press New link.",
    field: "Project file (.json)",
    submit: "Import project",
    link: "Import a project",
  },
  // E10-2: the import's refusals (docs/copy/errors.md, Projects).
  importErrors: {
    noFile: "Choose the .json file made with Whole project on a project's Export tab.",
    tooLarge: "This file is over 5 MB, the most an import reads, so this project cannot move by file. Its answers export as CSV on the project's Export tab.",
    notJson: "This file is not a project export: it is not JSON. Choose the .json file SMEsay made with Whole project.",
    notProject: "This file is not a project export from SMEsay. Choose the .json file made with Whole project on a project's Export tab.",
    newer: (version: number, ours: number) => `This file was made by a newer SMEsay (format version ${version}; this one reads up to ${ours}). Export it again from the same SMEsay.`,
    damaged: (where: string) => `This file is damaged or was edited: ${where} does not read as SMEsay wrote it. Export the project again and import the new file.`,
    sample: "This file is the sample project's. Every workspace has the sample already, so it is not imported.",
    responsesFull: (n: number, room: number) => `This file has ${n} responses submitted this month, and the workspace's plan takes ${room} more this month. Import it once the month turns.`,
  },
  fileName: (project: string, file: ExportFile, date: string) => `${project.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || "project"}-${file}-${date}.${file === "project" ? "json" : "csv"}`,
};
