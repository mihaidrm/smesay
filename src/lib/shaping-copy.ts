// The Shape page's words (stories/E4-2; docs/copy/app.md, Shape). No database import, so a
// client component can use it; src/lib/shaping.ts re-exports it for the server side.
import { AI_COPY } from "@/lib/ai/copy";

export const SHAPE_COPY = {
  title: "Shape the list",
  intro: "The AI groups the items into areas, orders the areas with a reason each, and writes a readable version of every item. The originals are never changed.",
  shape: "Shape with AI",
  shaping: "Shaping...",
  runAgain: "Run again",
  runAgainHint: "Run again replaces the areas the AI chose. Items you moved stay where they are.",
  grouped: (items: number, areas: number) => `AI grouped ${items} ${items === 1 ? "item" : "items"} into ${areas} ${areas === 1 ? "area" : "areas"}.`,
  notShaped: "Not shaped yet",
  placedByAi: "Placed by AI",
  movedByYou: "Moved by you",
  moveTo: "Move to",
  move: "Move",
  noSet: "Import a list first. Shape works on the latest version.",
  noSetLink: "Go to Import",
  unknownArea: "That area does not exist. Pick one from the list.",
  tryAgain: AI_COPY.tryAgain,
} as const;
