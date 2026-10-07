// The quickstart's words (stories/E12-2; docs/copy/quickstart.md, the page copy as written).
// "About ten minutes" stays until Mihai's timed run replaces or removes it (acceptance 3).
// Reworked 2026-10-07 (design note 102): one sentence of intro, two lines per step (what you
// do, then what you get, at most 14 words each), three bullets under Then.
export const QUICKSTART_COPY = {
  title: "Your first validation in four steps",
  intro: "Upload the list you were about to email round and in about ten minutes it is a link your experts can answer on their phones.",
  steps: [
    { title: "Import the list", you: "Upload an xlsx or csv, or paste the list, and mark the requirement column.", get: "Your items are in the app, and the file stays as it is." },
    { title: "Shape it", you: "Accept or reject the AI's areas and its readable version of each item.", get: "Nothing changes until you press Accept, and the original wording is always kept." },
    { title: "Build the validation", you: "Pick how people rate, what they fill in, and whether your proposed value shows.", get: "The preview on the right shows what they will see, phone or desktop." },
    { title: "Share one link", you: "Publish a public link or send personal invites, and set when it closes.", get: "Respondents need no account, and you can close or withdraw the link any time." },
  ],
  then: {
    title: "Then: read the results",
    lines: [
      "Answers arrive live: who agreed, who chose a different priority, who said not needed and why, and what is missing.",
      "The AI writes a short to-do list and names the answers behind each line.",
      "Export the answers as CSV, the project as JSON, or a PDF summary.",
    ],
  },
  start: "Start a project",
  sample: "Open the sample project",
  help: "Help",
};
