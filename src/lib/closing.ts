// The closing rule (stories/E5-5): what the Wrap up carries, as the Build card posts it and
// the server checks it (INTERFACES.md, ClosingSpec). The confidence question is always
// asked (decision 0003), so a spec with it off is refused; the missing-item form is on or
// off; the sign-off text is 1 to 300 characters, the default sentence when the row holds
// ""; the closing question is optional, 1 to 200 characters. The PM's words are theirs: the
// only copy rule applied here is no em dash (WRITING.md), the one the scan would fail on.
// No database import: the Build card, the preview and the respondent app (E7-5) share it.
import type { ClosingSpec } from "@/db/types";

export const CLOSING_QUESTION_MAX = 200;
export const SIGN_OFF_MAX = 300;
export const DEFAULT_SIGN_OFF = "I confirm these are my answers and they can be shared with the project team.";
const EM_DASH = String.fromCharCode(8212);

export const CLOSING_ERRORS = {
  longQuestion: `The closing question is over ${CLOSING_QUESTION_MAX} characters. Shorten it; respondents answer it on a phone.`,
  badSignOff: `Write the sign-off in 1 to ${SIGN_OFF_MAX} characters. Respondents tick it before they submit.`,
  emDash: "Replace the em dash with a comma, a colon or a full stop. Respondents read this as written.",
  confidenceOff: "The confidence question is always asked. It cannot be switched off.",
} as const;

// The Build card's words (docs/copy/app.md, Build) and the Wrap up's (docs/copy/app.md,
// Respondent Wrap up; E7-5 draws the real screen).
export const CLOSING_COPY = {
  card: "Closing",
  line: "How the journey ends. Respondents review what they said, add what is missing, say how sure they are and sign off.",
  questionLabel: "Closing question, optional",
  questionHint: `One open question at the end, up to ${CLOSING_QUESTION_MAX} characters. Leave empty to ask none.`,
  missingTitle: "Ask for missing items",
  missingLine: "On: respondents can name an item the list lacks, with an area and a proposed value.",
  confidenceTitle: "Ask how confident they are",
  confidenceLine: "Always asked, 1 to 5. The dashboard shows the spread.",
  always: "Always on",
  signOffLabel: "Sign-off text",
  signOffHint: `What respondents tick before they submit, up to ${SIGN_OFF_MAX} characters.`,
  questionLocked: "Published instruments keep their closing question. Build a new instrument to change it.",
  previewScreen: "Wrap up",
} as const;

export const WRAP_UP_COPY = {
  title: "Wrap up",
  tally: { agreed: "Agreed", higher: "Higher priority", lower: "Lower priority", notNeeded: "Not needed", unclear: "Unclear", rated: "Rated" },
  toFinish: (n: number) => `${n} still to finish.`,
  goTo: (chapter: string) => `Go to ${chapter}`,
  nothingToReview: "You agreed with every proposed value. Nothing to review here.",
  missingTitle: "Is anything missing from the list? Optional.",
  missingText: "What is missing",
  missingArea: "Where it belongs",
  missingValue: "How important it is",
  choose: "Choose one",
  confidenceTitle: "How confident are you in these answers?",
  guessing: "Guessing",
  certain: "Certain",
  stillNeeded: (parts: string[]) => `Still needed: ${parts.join(", ")}.`,
  allIn: "Everything is in. Submit when you are ready.",
  needItems: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
  needConfidence: "how confident you are",
  needSignOff: "the confirmation",
  submit: "Submit",
} as const;

export const DEFAULT_CLOSING: ClosingSpec = { confidence: true, missingForm: true, signOffText: "" };

export function signOffFor(closing: ClosingSpec): string {
  return closing.signOffText || DEFAULT_SIGN_OFF;
}

const on = (raw: unknown) => raw === true || raw === "true" || raw === "on" || raw === "1";

// The spec as the card posts it: the question (empty means none), the switch, the sign-off
// and the confidence flag, which must be on. The sign-off is stored as written, the
// default sentence included, so a later change of the default does not reword a published
// instrument.
export function parseClosing(rawQuestion: unknown, rawMissingForm: unknown, rawSignOff: unknown, rawConfidence: unknown): { error: string } | { closing: ClosingSpec } {
  if (!on(rawConfidence)) return { error: CLOSING_ERRORS.confidenceOff };
  const question = String(rawQuestion ?? "").trim();
  const signOff = String(rawSignOff ?? "").trim();
  if (question.length > CLOSING_QUESTION_MAX) return { error: CLOSING_ERRORS.longQuestion };
  if (signOff.length < 1 || signOff.length > SIGN_OFF_MAX) return { error: CLOSING_ERRORS.badSignOff };
  if (question.includes(EM_DASH) || signOff.includes(EM_DASH)) return { error: CLOSING_ERRORS.emDash };
  const closing: ClosingSpec = { confidence: true, missingForm: on(rawMissingForm), signOffText: signOff };
  if (question) closing.closingQuestion = question;
  return { closing };
}
