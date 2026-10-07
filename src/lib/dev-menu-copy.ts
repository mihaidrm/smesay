// The developer menu's words (stories/E4-8; docs/copy/app.md, Signed-in shell). No database
// import, so the client component and the project header both use it.
import type { AiMode } from "@/lib/ai/mode-rules";

export const DEV_MENU_COPY = {
  title: "Developer",
  aiCalls: "AI calls",
  modes: { standin: "Stand-in (free)", real: "Real (spends credits)", off: "Off" } as Record<AiMode, string>,
  usage: (runs: number, eur: string) => `${runs} AI ${runs === 1 ? "run" : "runs"}, ${eur}`,
  notSaved: "The choice was not saved. Try again.",
  // The pill in the project header when the mode is not "real".
  pill: { standin: "AI: stand-in", off: "AI: off" } as Record<Exclude<AiMode, "real">, string>,
} as const;
