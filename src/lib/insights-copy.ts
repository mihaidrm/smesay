// The Actions tab's words (stories/E9-1; docs/copy/app.md, Results, Actions). No database
// import, so a client component can use it.
import type { InsightKind } from "@/db/types";

export const ACTIONS_COPY = {
  write: "Write actions",
  writeAgain: "Write again",
  writing: "Writing actions",
  empty: "No actions yet. Write them from the answers: each one names the answers behind it.",
  emptyNoAnswers: "Actions are written from the submitted answers. Write them once someone has submitted.",
  none: "The answers gave no action worth writing. Write again once more answers are in.",
  and: "and",
  on: "on",
  missingItem: "missing item",
  citedBy: "From",
  states: { open: "Open", done: "Done", dismissed: "Dismissed" },
  kinds: { rewrite: "Rewrite", conflict: "Groups disagree", followUp: "Follow up", coverage: "Coverage" } as Record<InsightKind, string>,
  tooLong: "There are too many answers to write actions from in one go. The answers are all on the other tabs; write actions again once the list is shorter.",
  // A model call that did not go through (src/lib/ai/client.ts Refusal; docs/copy/errors.md,
  // Dashboard and exports). The answers stay on the other tabs whatever happens here.
  refusals: {
    budget: "This workspace has used its AI budget for the month. The answers are all on the other tabs. Come back next month to write actions.",
    paused: "AI is paused until next month. The answers are all on the other tabs.",
    plan: "This workspace has used its AI runs for the month on its plan. The answers are all on the other tabs. Change the plan, or come back next month.",
    failed: "The AI did not answer. No action changed. Try again in a minute.",
    invalid: "The AI answered in a form the app could not use. No action changed. Try again.",
    rateLimited: "Too many AI requests at once. Wait a minute and try again.",
  } as Record<"budget" | "paused" | "plan" | "failed" | "invalid" | "rateLimited", string>,
  sample: "The sample's actions are invented, to show what this tab looks like.",
  sampleRefused: "The sample's actions are invented and cannot be written again. Write actions on your own project.",
};
