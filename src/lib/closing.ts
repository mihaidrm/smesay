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
  confidenceOff: "The confidence question is always asked. It cannot be switched off. Reload the page and try again.",
} as const;

// The Build card's words (docs/copy/app.md, Build) and the Wrap up's (docs/copy/app.md,
// Respondent Wrap up; E7-5 draws the real screen).
export const CLOSING_COPY = {
  card: "Closing",
  line: "This card sets how the journey ends. Respondents review what they said, add what is missing, say how sure they are and sign off.",
  questionLabel: "Closing question, optional",
  questionHint: `Respondents answer one open question at the end, up to ${CLOSING_QUESTION_MAX} characters. Leave it empty to ask none.`,
  missingTitle: "Ask for missing items",
  missingLine: "On: respondents can name an item the list lacks, with an area and a proposed value.",
  confidenceTitle: "Ask how confident they are",
  confidenceLine: "Respondents always answer it, on a slider from Guessing to Certain. The dashboard shows the spread as 1 to 5.",
  always: "Always on",
  signOffLabel: "Sign-off text",
  signOffHint: `Respondents tick this before they submit. It can be up to ${SIGN_OFF_MAX} characters.`,
  questionLocked: "Published validations keep their closing question. Build a new validation to change it.",
} as const;

export const WRAP_UP_COPY = {
  title: "Wrap up",
  tally: { agreed: "Agreed", higher: "Higher priority", lower: "Lower priority", notNeeded: "Not needed", unclear: "Unclear", rated: "Rated" },
  toFinish: (n: number) => `${n} still to finish.`,
  // With the chapter's position from 1 when the chapters are separate screens (decision 0055).
  goTo: (chapter: string, n: number | null) => (n === null ? `Go to ${chapter}` : `Go to section ${n}: ${chapter}`),
  nothingToReview: "You agreed with every proposed value. Nothing to review here.",
  noItems: "No items to review.",
  previewSubmit: "Submit is off in the preview.",
  missingTitle: "Is anything missing from the list? Optional.",
  missingText: "What is missing?",
  missingArea: "Where does it belong?",
  missingValue: "How important is it?",
  choose: "Choose one",
  confidenceTitle: "How confident are you in these answers?",
  confidencePrompt: "Drag to say how sure you are",
  guessing: "Guessing",
  certain: "Certain",
  stillNeeded: (parts: string[]) => `Still needed: ${parts.join(", ")}.`,
  allIn: "Everything is in. Submit when you are ready.",
  needItems: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
  needConfidence: "how confident you are",
  needSignOff: "the confirmation",
  submit: "Submit",
} as const;

// The five words of the confidence slider (design note 107), 1 to 5. The stored value stays
// the integer (INTERFACES.md; the dashboard, the PDF and the CSV keep the numbers); the word
// is what the respondent reads under the slider and what the receipt email names.
export const CONFIDENCE_WORDS = ["Guessing", "Not very sure", "Fairly sure", "Confident", "Certain"] as const;
export const CONFIDENCE_MIN = 1;
export const CONFIDENCE_MAX = 5;
// Where the slider rests before the respondent picks: the middle, dimmed, until a change.
export const CONFIDENCE_UNSET = 3;

export function confidenceWord(n: number): string {
  if (!Number.isInteger(n) || n < CONFIDENCE_MIN || n > CONFIDENCE_MAX) throw new RangeError(`Confidence is ${CONFIDENCE_MIN} to ${CONFIDENCE_MAX}, not ${n}.`);
  return CONFIDENCE_WORDS[n - 1];
}

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
  // A form part that is not text (a file) reads as empty, never as "[object File]".
  const question = typeof rawQuestion === "string" ? rawQuestion.trim() : "";
  const signOff = typeof rawSignOff === "string" ? rawSignOff.trim() : "";
  if (question.length > CLOSING_QUESTION_MAX) return { error: CLOSING_ERRORS.longQuestion };
  if (signOff.length < 1 || signOff.length > SIGN_OFF_MAX) return { error: CLOSING_ERRORS.badSignOff };
  if (question.includes(EM_DASH) || signOff.includes(EM_DASH)) return { error: CLOSING_ERRORS.emDash };
  const closing: ClosingSpec = { confidence: true, missingForm: on(rawMissingForm), signOffText: signOff };
  if (question) closing.closingQuestion = question;
  return { closing };
}
