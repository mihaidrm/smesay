// What the caller shows when a model call does not go through (stories/E4-1, acceptance 3
// and 4; docs/copy/errors.md, Shaping). No database import, so a client component can use it.
export const AI_COPY = {
  budget: "This workspace has used its AI budget for the month. The list is imported and can be published as it is. Come back next month.",
  paused: "AI is paused until next month. The list is imported and can be published as it is.",
  plan: "This workspace has used its AI runs for the month on its plan. The list is imported and can be published as it is. Change the plan, or come back next month.",
  failed: "The AI did not answer. Nothing changed. Try again; if it fails again, use the items as imported and come back later.",
  invalid: "The AI answered in a form the app could not use. Nothing changed. Try again; if it fails again, use the items as imported and come back later.",
  rateLimited: "Too many AI requests at once. Wait a minute and try again.",
  // E4-8: the developer menu's "Off" (src/lib/ai/mode.ts).
  off: "AI is switched off in the developer menu. Switch it to Stand-in or Real to run this.",
  sample: "The sample project cannot be changed by AI.",
  tryAgain: "Try again",
} as const;
