// The Build page's words (stories/E5-1; docs/copy/app.md, Build; the refusals in
// docs/copy/errors.md, Build and Share). No database import, so a client component can use
// it; src/lib/instruments.ts re-exports it for the server side.
import { FIELDS_COPY } from "@/lib/respondent-fields";

export const INTRO_MAX = 1000;
export const TITLE_MAX = 80;

export const BUILD_COPY = {
  title: "Build the instrument",
  line: (version: number) => `What respondents see, from version ${version} of the list. The preview on the right follows every save.`,
  noSet: "Import a list first. Build works on an imported version.",
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
  newer: (built: number, latest: number) => `Version ${latest} of the list was imported after this instrument was built on version ${built}. The instrument keeps version ${built} until you build on the new one; the intro, the fields, the scoring and the perspective names are copied over. Items are tagged again on Shape.`,
  buildOn: (version: number) => `Build on version ${version}`,
  alreadyLatest: "This instrument is already built on the latest version of the list.",
  replaced: "This draft was replaced by one built on a newer version of the list. Reload the page to edit the current one.",
  // The scoring card (stories/E5-2; the PM app board, Build).
  scoringCard: "Scoring",
  scoringLine: "How respondents rate each item. Changing the method empties nothing on a draft; a published instrument keeps its method.",
  methodLabel: "Method",
  showProposedTitle: "Show the proposed value to respondents",
  showProposedLine: "On: they agree or push back on your proposal. Off: they rate blind. Both feed the same dashboard.",
  labelsTitle: "Labels, optional",
  labelsLine: "Rename a value for your respondents. The dashboard and the exports use the same word. Up to 20 characters.",
  labelFor: "Label for",
  // Perspectives (stories/E5-4).
  perspectivesCard: "Perspectives",
  perspectivesLine: "Groups of respondents who see different items. An item with no perspective goes to everyone. Leave empty to show every item to everyone.",
  perspectivesLabel: "Perspectives, one per line",
  perspectivesTagged: (tagged: number, total: number) => `${tagged} of ${total} items carry a perspective. Tag items on Shape.`,
  perspectivesList: (names: string[]) => `${names.join(", ")}.`,
  perspectivesTaggedLink: "Go to Shape",
  perspectivesNone: "No perspectives yet. Every item goes to everyone.",
  // The layout (stories/E5-3; the PM app board, Build).
  layoutLabel: "Layout",
  layoutLine: "How the list is split into screens. Chapters are the default; a published instrument can still change its layout.",
  previewItemOf: (n: number, total: number, area: string) => `Item ${n} of ${total} in ${area}`,
  previewAllOnOne: (n: number) => `All ${n} on one page`,
  previewProgress: (answered: number, total: number) => `${answered} of ${total}`,
  on: "On",
  off: "Off",
  locked: "Published instruments keep their method. Build a new instrument to change it.",
  // The sample is read-only (stories/E8-8, acceptance 2).
  sample: "The sample project cannot be edited.",
  lastField: FIELDS_COPY.lastField,
} as const;

// The About you page's words (stories/E5-1, acceptance 3; the respondent board, note 12).
// The hint under Start is startHint() in src/lib/respondent-fields.ts (decision 0043).
export const ABOUT_YOU_COPY = {
  start: "Start",
  startWith: (chapter: string) => `Start with ${chapter}`,
  choose: "Choose one",
  optional: "optional",
  footer: (workspace: string) => `Your answers go to the project team at ${workspace}. They are saved as you go on this device, so you can close this page and come back.`,
  poweredBy: "Powered by",
  previewNote: "Preview: nothing you enter here is saved",
  // A personal link (stories/E6-2, acceptance 3): the fields the PM filled are not asked.
  answeringAs: (who: string) => `Answering as ${who}.`,
  answeringAsNote: "The person who invited you filled this in. Tell them if it is wrong.",
  // Perspectives (stories/E5-4): the question on About you, shown only when some exist.
  perspectivesQuestion: "Which of these describe you?",
  perspectivesHint: "Pick every one that fits. You see the items for your perspectives and the ones for everyone.",
} as const;

// The builder's preview panel (stories/E5-6; docs/copy/app.md, Preview).
export const PREVIEW_COPY = {
  title: "Preview",
  newTab: "(opens in a new tab)",
  loading: "Loading the preview",
  device: "Device",
  desktop: "Desktop",
  phone: "Phone",
  fullSize: "Open full size",
  frameTitle: "What respondents see",
  caption: {
    import: "Import sets the chapters and the cards.",
    shape: "Shape changes the wording on the cards.",
    build: "Build changes the rating row, the chapter row, About you and the Wrap up.",
    share: "Share sets the closing date in the header.",
  },
};
