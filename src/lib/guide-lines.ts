// Every line the guide card can say (stories/E15-1, acceptance 2), written as docs/copy/guide.md
// has it: id, pose, line and action. A unit test (src/lib/guide-lines.test.ts) reads the copy
// file and fails when the two differ in any way, so no line exists outside the file. No
// imports, so client components and the analytics catalogue may use it.
// The robot's poses (src/components/app/mascot.tsx MascotPose, the same list).
export type GuidePose = "hi" | "idea" | "reading" | "analysis" | "help";

type Line = { pose: GuidePose; line: string; action: string | null };

export const GUIDE_LINES = {
  "path.start": { pose: "hi", line: "Your first link is four steps away. Start with the list you were about to email round.", action: "Start a project (secondary: Try it on the sample first)" },
  "path.import": { pose: "idea", line: "Upload the spreadsheet or paste the list. The columns are mapped on the next card.", action: "Go to Import" },
  "path.shape": { pose: "idea", line: "Let the AI group the items into areas and write a readable version of each. Nothing changes until you accept.", action: "Go to Shape" },
  "path.build": { pose: "idea", line: "Write two lines so respondents know what the list is for, and check the fields they fill in.", action: "Go to Build" },
  "path.share": { pose: "idea", line: "Publish one link, or send personal invites. Respondents need no account.", action: "Go to Share" },
  "path.done": { pose: "hi", line: "Your link is live. Answers arrive on Results as they come in.", action: "See results" },
  "import.empty": { pose: "reading", line: "Upload an xlsx or csv, or paste the list. One item per row.", action: null },
  "import.mapping": { pose: "reading", line: "Tell us which column is the item and which is the proposed value. The rest is kept as custom fields.", action: null },
  "shape.notRun": { pose: "idea", line: "Shape with AI groups the items and writes a readable version of each. The originals are never changed.", action: null },
  "shape.pending": { pose: "idea", line: "Accept the reader versions you like. Respondents read the accepted version; you keep the original.", action: null },
  "build.intro": { pose: "idea", line: "Write one or two lines so respondents know what the list is for. They see this first.", action: null },
  "build.fields": { pose: "idea", line: "A dropdown Role lets Results split answers by group. Pick Dropdown and type the roles.", action: null },
  "share.draft": { pose: "idea", line: "Publish when the validation is ready. You can withdraw the link at any time; answers already given are kept.", action: null },
  "sample.strip": { pose: "analysis", line: "The numbers at the top count answers; the table shows each item with who agreed, who chose a different priority and who disagreed.", action: "Next" },
  "sample.registers": { pose: "analysis", line: "Every different priority and every disagree comes with a reason. This is what you read before the meeting.", action: "Next" },
  "sample.detail": { pose: "analysis", line: "This page shows every answer to one item. The AI's to-do list cites these rows.", action: "Start a project" },
  "rescue.mapping": { pose: "help", line: "The list is uploaded but not imported yet. Map the item column and press Import.", action: "Map the columns" },
  "rescue.shapeFailed": { pose: "help", line: "The last run did not finish. Try again, or move on: Build works without the AI's version.", action: "Try again" },
  "rescue.noResponse": { pose: "help", line: "Nobody has answered in three days. A personal invite with a name gets more replies than a shared link.", action: "Send invites" },
} as const satisfies Record<string, Line>;

export type TipId = keyof typeof GUIDE_LINES;
export const TIP_IDS = Object.keys(GUIDE_LINES) as TipId[];

// The rest of the guide's words (docs/copy/guide.md: the path card and the sidebar).
export const GUIDE_COPY = {
  pathTitle: "Your first validation",
  steps: { import: "Import the list", shape: "Shape it", build: "Build the validation", share: "Share one link" },
  then: "Then: read the results",
  showTips: "Show tips",
  dismiss: "Dismiss",
  sampleFirst: "Try it on the sample first",
  done: "done",
  next: "next",
  cardName: "Tip",
  notSaved: "That was not saved. Check the connection and try again.",
};
