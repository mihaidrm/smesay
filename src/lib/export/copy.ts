// The exports' words (stories/E10-1; docs/copy/app.md, Results, Export). No database import.
import type { ExportFile } from "@/db/types";

export const EXPORT_COPY = {
  watermark: "Sample data, invented",
  filtered: (filters: string) => `Filtered: ${filters}`,
  withUnsubmitted: "Includes answers not submitted yet",
  submittedOnly: "Submitted answers only",
  sources: { public: "Public link", personal: "Personal invite" },
  statuses: { invited: "Invited", inProgress: "In progress", submitted: "Submitted" },
  columns: {
    respondent: "Respondent", reference: "Reference", area: "Area", item: "Item", original: "Original text",
    proposedValue: "Proposed value", proposedLabel: "Proposed label", answer: "Answer", theirValue: "Their value", theirLabel: "Their label",
    reasonOrQuestion: "Reason or question", comment: "Comment", submittedAt: "Submitted at", source: "Source", perspectives: "Perspectives",
    notAnswered: "Not answered", agreement: "Agreement %", status: "Status", answered: "Answered", visible: "Items seen",
    minutes: "Minutes to submit", reminders: "Reminders", withComment: "Answers with a reason or comment",
    suggested: "Suggested item", suggestedArea: "Suggested area", suggestedValue: "Suggested value", suggestedLabel: "Suggested label",
  },
  // The Export tab (E10-1, acceptance 1).
  tab: {
    line: "Each file holds what this page shows: the same filter and the same switch. Every number on the page adds up from its rows.",
    files: {
      answers: { title: "Answers", line: "One row per answer: the respondent and their fields, the item, the answer, their value, the reason or question and the comment." },
      items: { title: "Items with totals", line: "One row per item: the counts of each answer, not answered, and the agreement." },
      people: { title: "People", line: "One row per person: the Responses tab's columns and the minutes to submit." },
      missing: { title: "Missing items", line: "One row per missing item suggested, with who suggested it." },
    } as Record<ExportFile, { title: string; line: string }>,
    download: "Download CSV",
    sample: "The sample's files start with the line \"Sample data, invented\".",
  },
  fileName: (project: string, file: ExportFile, date: string) => `${project.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || "project"}-${file}-${date}.csv`,
};
