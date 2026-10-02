// What the caller shows when a model call does not go through (stories/E4-1, acceptance 3
// and 4; docs/copy/errors.md, Banner, Shape). No database import, so a client component can
// use it.
export const AI_COPY = {
  budget: "This workspace has used its AI budget for the month. The list is imported and can be published as it is. Ask the workspace owner to raise the budget.",
  failed: "The AI did not answer. Nothing changed. Try again; if it fails again, use the items as imported and come back later.",
  rateLimited: "Too many AI requests at once. Wait a minute and try again.",
  sample: "The sample project cannot be changed by AI.",
  tryAgain: "Try again",
} as const;
