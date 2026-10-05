// The Share page's words (stories/E6-1; docs/copy/app.md, Share; the refusals in
// docs/copy/errors.md) and the respondent link pages' (errors.md, Respondent link states).
// No database import, so the client form can use it; src/lib/sharing.ts re-exports it.
import { PASSCODE_MAX, PASSCODE_MIN } from "@/lib/passcode-rules";

export const SHARE_COPY = {
  title: "Share the list",
  line: "Anyone can open this link between the dates.",
  noInstrument: "Build the instrument first. Share sends what Build made.",
  noInstrumentLink: "Go to Build",
  card: "Public link",
  states: { draft: "Draft", published: "Published", revoked: "Revoked" } as const,
  notes: {
    draft: "Not published yet. Nobody can open the link.",
    published: "Anyone with the link can respond until the close date.",
    revoked: "The link now shows a page saying it was withdrawn. Answers already given are kept.",
  } as const,
  notOpenNote: (when: string) => `The link opens on ${when}. Until then it shows the opening date.`,
  newerDraft: (built: number, live: number) => `Version ${built} is built but not published; the link above is on version ${live}. Publishing version ${built} makes a new link, and the link above closes then.`,
  newerDraftCard: (version: number) => `Draft on version ${version}`,
  archived: "This project is archived. Unarchive it to share the list.",
  linkLabel: "Link",
  copy: "Copy link",
  copied: "Copied.",
  opensLabel: "Opens",
  opensHint: "Leave empty to open as soon as you publish.",
  closesLabel: "Closes",
  zone: (zone: string) => `Times are in ${zone}, your browser's time zone.`,
  passcodeLabel: "Passcode, optional",
  passcodeHint: `At least ${PASSCODE_MIN} characters. Respondents type it once per device.`,
  passcodeSet: "A passcode is set. Type a new one to change it.",
  removePasscode: "Remove the passcode",
  publish: "Publish",
  publishAgain: "Publish again",
  revoke: "Revoke link",
  revokeHint: "Nobody can open the link after this. Answers already given are kept. Publish again makes a new link.",
  save: "Save",
  saved: "Saved.",
  closedNow: "The link is closed. Respondents see the closed page.",
  version: (version: number) => `Built on version ${version} of the list.`,
} as const;

export const LINK_ERRORS = {
  closeBeforeOpen: "The close date is before the open date. Pick a later close date.",
  noClose: "Pick a close date. The link closes then.",
  closeInPast: "The close date is in the past. Pick a date in the future.",
  badDate: "The dates did not reach the server as dates. Reload the page and try again.",
  shortPasscode: `Use at least ${PASSCODE_MIN} characters. Respondents type it once per device.`,
  longPasscode: `Use at most ${PASSCODE_MAX} characters for the passcode.`,
  notPublished: "This instrument is not published yet. Press Publish first.",
  alreadyPublished: "This instrument is already published. Reload the page to see its link.",
  alreadyRevoked: "This link is already revoked. Press Publish again for a new one.",
  revokedSave: "This link is revoked. Press Publish again for a new one; its dates are set then.",
  changed: "This link changed since the page opened. Reload the page to see where it stands.",
} as const;

// The builder's preview page (stories/E5-6; docs/copy/app.md, Preview).
export const PREVIEW_PAGE_COPY = {
  expiredTitle: "This preview has expired.",
  expiredLine: "Open the project again in SMEsay to see its preview.",
  otherWorkspaceTitle: "This preview is for another workspace.",
  otherWorkspaceLine: "Switch to the workspace the project is in, then open the project again.",
  noList: "Import a list to see what respondents get.",
};

export const LINK_PAGE_COPY = {
  unknownTitle: "This link does not match any project.",
  unknownLine: "Check that you copied the whole link, or ask the person who sent it for a new one.",
  notOpenTitle: (when: string) => `This link opens on ${when}.`,
  notOpenLine: "Come back then; there is nothing to do now.",
  closedTitle: "Link closed.",
  closedLine: (workspace: string, project: string, when: string) => `The project team at ${workspace} stopped collecting answers for ${project} on ${when}. Nothing you sent is lost.`,
  revokedTitle: "Link inactive.",
  revokedLine: (workspace: string) => `The project team at ${workspace} withdrew this link. If you were asked to answer, ask them for a new one. Nothing was saved from this visit.`,
  passcodeTitle: "This link needs a passcode.",
  passcodeLine: "The person who sent you the link has it. You type it once on this device.",
  passcodeLabel: "Passcode",
  passcodeButton: "Continue",
  wrongPasscode: "That passcode is not right. Ask the person who sent you the link.",
  tooManyAttempts: (minutes: number) => `Too many passcode attempts. Wait ${minutes} minutes and try again.`,
  linkChanged: "This link changed since the page opened. Reload the page to see where it stands.",
  busy: "Too many people are entering passcodes right now. Wait a few minutes and try again.",
  closes: (when: string) => `Closes ${when}`,
  errorTitle: "This page could not be loaded.",
  errorLine: "Our server could not open this link. Try again in a moment.",
  tryAgain: "Try again",
} as const;
