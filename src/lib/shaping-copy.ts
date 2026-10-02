// The Shape page's words (stories/E4-2; docs/copy/app.md, Shape; the refusals in
// docs/copy/errors.md, Shaping). No database import, so a client component can use it;
// src/lib/shaping.ts re-exports it for the server side.
import { AI_COPY } from "@/lib/ai/copy";

export const SHAPE_COPY = {
  title: "Shape the list",
  intro: "The AI groups the items into areas, orders the areas with a reason each, and writes a readable version of every item. The originals are never changed.",
  shape: "Shape with AI",
  shaping: "Shaping...",
  runAgain: "Run again",
  runAgainHint: "Run again replaces the areas the AI chose. Items you moved stay where they are.",
  grouped: (items: number, areas: number) => `AI grouped ${items} ${items === 1 ? "item" : "items"} into ${areas} ${areas === 1 ? "area" : "areas"} and wrote a readable version of each.`,
  notShaped: "Not shaped yet",
  placedByAi: "Placed by AI",
  movedByYou: "Moved by you",
  moveLabel: (ref: string) => `Move ${ref} to`,
  move: "Move",
  noSet: "Import a list first. Shape works on the latest version.",
  noSetLink: "Go to Import",
  unknownArea: "That area does not exist. Pick one from the list.",
  notShapedYet: "Run Shape with AI first. Items can be moved once the areas exist.",
  tooManyAreas: (n: number) => `This list has ${n} areas in its area column. Shape works with up to 12. Merge some in the file and import it again.`,
  longArea: (n: number) => `An area name in the list is ${n} characters long. Shape works with names up to 60. Shorten it in the file and import it again.`,
  tooManyItems: (n: number) => `This list has ${n} items. Shape works on lists up to 400 items for now. Split the list, or come back when larger lists are supported.`,
  tooLong: (n: number) => `This list has ${n.toLocaleString("en-GB")} characters of item text, more than one AI call can take. Shorten the longest items, or split the list.`,
  tryAgain: AI_COPY.tryAgain,
  // Reader versions (stories/E4-3; docs/copy/app.md, Shape).
  counter: (accepted: number, total: number) => `${accepted} of ${total} reader ${total === 1 ? "version" : "versions"} accepted.`,
  pill: { suggested: "Suggested", accepted: "Reader version used", rejected: "Original kept" } as const,
  original: "Original:",
  sameAsOriginal: "The readable version is the same as the original, so there is nothing to accept.",
  accept: "Accept",
  reject: "Reject",
  undo: "Undo",
  edit: "Edit",
  save: "Save",
  cancel: "Cancel",
  editLabel: (ref: string) => `Readable version of ${ref}`,
  blankEdit: "Write the readable version, or reject the suggestion to keep the original.",
  longEdit: (n: number) => `The readable version is ${n.toLocaleString("en-GB")} characters. Keep it to 1,000 or fewer.`,
  acceptAll: "Accept all",
  rejectAll: "Reject all",
  acceptAllConfirm: (n: number) => `Accept all ${n} suggested reader ${n === 1 ? "version" : "versions"}?`,
  rejectAllConfirm: (n: number) => `Reject all ${n} suggested reader ${n === 1 ? "version" : "versions"} and keep the originals?`,
  noReader: "This item has no reader version. Run Shape with AI first.",
  // Flags (stories/E4-4; docs/copy/errors.md, Shaping).
  // The banners read "Ambiguity in [REF]. [What the item does not say]. Respondents may mark
  // it unclear." and "[REF] may duplicate [REF]." with the refs as links (flags.tsx).
  mayMarkUnclear: "Respondents may mark it unclear.",
  duplicateNote: "If they ask for the same thing, remove one in the file and import it again.",
  dismiss: "Dismiss",
  ambiguityNote: "Ambiguity:",
  duplicateItemNote: (other: string) => `May duplicate ${other}.`,
  noFlag: "This item has no flag to dismiss.",
} as const;
