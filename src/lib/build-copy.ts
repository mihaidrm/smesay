// The Build page's words (stories/E5-1; docs/copy/app.md, Build; the refusals in
// docs/copy/errors.md, Build and Share). No database import, so a client component can use
// it; src/lib/instruments.ts re-exports it for the server side.
import { FIELDS_COPY } from "@/lib/respondent-fields";

export const INTRO_MAX = 1000;
export const TITLE_MAX = 80;

export const BUILD_COPY = {
  title: "Build the instrument",
  line: (version: number) => `What respondents see, from version ${version} of the list. The preview on the right follows every save.`,
  noSet: "Import a list first. Build works on the latest version.",
  noSetLink: "Go to Import",
  introCard: "Intro",
  titleLabel: "Title",
  introLabel: "Intro",
  introHint: FIELDS_COPY.introHint,
  introCount: (n: number) => `${n.toLocaleString("en-GB")} of ${INTRO_MAX.toLocaleString("en-GB")} characters`,
  badTitle: `Give the instrument a title, up to ${TITLE_MAX} characters. Respondents see it in the header.`,
  longIntro: `The intro is over ${INTRO_MAX.toLocaleString("en-GB")} characters. Shorten it; respondents read it on a phone.`,
  fieldsCard: "Respondent fields",
  fieldsLine: "What respondents fill in before they rate. Required fields must be filled before Start.",
  labelLabel: "Label",
  typeLabel: "Type",
  requiredLabel: "Required",
  optionsLabel: "Options, one per line",
  addField: "Add a field",
  remove: "Remove",
  save: "Save",
  saved: "Saved.",
  // The owed line from E3-6 (acceptance 3): a newer set than the one the instrument is built on.
  newer: (built: number, latest: number) => `Version ${latest} of the list was imported after this instrument was built on version ${built}. The instrument keeps version ${built} until you build on the new one; the intro and the fields are copied over.`,
  buildOn: (version: number) => `Build on version ${version}`,
  alreadyLatest: "This instrument is already built on the latest version of the list.",
  preview: "Preview",
  previewCaption: "Highlighted: what this step changes. The fields respondents fill in.",
  previewDevice: "Phone",
  // The sample is read-only (stories/E8-8, acceptance 2).
  sample: "The sample project cannot be edited.",
  lastField: FIELDS_COPY.lastField,
} as const;

// The About you page's words (stories/E5-1, acceptance 3; the respondent board, note 12).
// The hint under Start names name and role as the board wrote it, whatever the fields are
// called; design note 38 lists that as a question for Mihai.
export const ABOUT_YOU_COPY = {
  startHint: FIELDS_COPY.startHint,
  start: "Start",
  startWith: (chapter: string) => `Start with ${chapter}`,
  choose: "Choose one",
  optional: "optional",
  footer: (workspace: string) => `Your answers go to the project team at ${workspace}. They are saved as you go on this device, so you can close this page and come back.`,
  poweredBy: "Powered by",
  previewNote: "Preview: nothing you enter here is saved",
} as const;
