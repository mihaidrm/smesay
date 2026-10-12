// The Plan card's words after launch (stories/E2-7, decision 0068; docs/copy/app.md,
// Settings). No credit number anywhere a member sees (decision 0036).
import type { Entitlement } from "@/lib/plans";

export const PLAN_CARD_COPY = {
  building: { pill: "While we build it with the first users", note: "Paid plans come later. Nothing you build now is lost or locked." },
  trial: { pill: (ends: string) => `Ends on ${ends}`, note: "One validation and 20 respondents for 7 days, with the AI. Then the free plan." },
  free: { note: "One project and 25 responses a month. The AI comes with a paid plan." },
  paid: (e: Entitlement) => (e.limits.responsesPerMonth === null ? "No limits." : `${e.limits.responsesPerMonth.toLocaleString("en-GB")} responses a month, with the AI.`),
} as const;
