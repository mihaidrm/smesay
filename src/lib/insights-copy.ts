// The Actions tab's words (stories/E9-1; docs/copy/app.md, Results, Actions). No database
// import, so a client component can use it.
import type { InsightKind } from "@/db/types";

export const ACTIONS_COPY = {
  write: "Write actions",
  writeAgain: "Write again",
  writing: "Writing actions",
  empty: "No actions yet. Write them from the answers: each one names the answers behind it.",
  emptyNoAnswers: "Actions are written from the submitted answers. Write them once someone has submitted.",
  none: "The answers gave no new action worth writing. Nothing changed. Try again once more answers are in.",
  and: "and",
  on: "on",
  missingItem: "missing item",
  citedBy: "From",
  states: { open: "Open", done: "Done", dismissed: "Dismissed" },
  // E9-2: the controls, the closed sections and their dates, the refusals.
  markDone: "Mark done",
  dismiss: "Dismiss",
  reopen: "Reopen",
  doneHeading: "Done",
  dismissedHeading: "Dismissed",
  closedOn: (state: "done" | "dismissed", when: string) => `${state === "done" ? "Done" : "Dismissed"} ${when}`,
  gone: "This action changed since the page loaded: someone marked it in another tab, or a new run replaced it. Reload the page to see the current actions.",
  badState: "That change is not one an action can take. Reload the page and use its buttons.",
  openHeading: "Open",
  noneOpen: "No open actions. Write again to look for new ones, or reopen one below.",
  sampleState: "The sample's actions are invented and cannot be marked. Mark the actions of your own project.",
  kinds: { rewrite: "Rewrite", conflict: "Groups disagree", followUp: "Follow up", coverage: "Coverage" } as Record<InsightKind, string>,
  tooLong: "There are too many answers to write actions from in one go. Every reason and question is on the Different priority and Disagree tab and the Questions and gaps tab; work from those.",
  // E4-8: the counts line before any press, the thinking lines while a run is pending, the
  // stand-in line and the no-run line under the actions.
  submittedCounts: (submitted: number, started: number) => `Actions are written from submitted answers. ${submitted} of ${started} ${started === 1 ? "response is" : "responses are"} submitted.`,
  thinking: (items: number, answers: number) => [
    `Reading ${items} ${items === 1 ? "item" : "items"} and ${answers} ${answers === 1 ? "answer" : "answers"}`,
    "Looking for where people disagree",
    "Writing the to-do list",
  ],
  standIn: "These actions came from the stand-in, not the AI.",
  noRun: "No AI run on this project yet.",
  // A model call that did not go through (src/lib/ai/client.ts Refusal; docs/copy/errors.md,
  // Dashboard and exports). The answers stay on the other tabs whatever happens here.
  refusals: {
    budget: "This workspace has used its AI budget for the month. The answers are all on the other tabs. Come back next month to write actions.",
    paused: "AI is paused until next month. The answers are all on the other tabs.",
    plan: "This workspace has used its AI runs for the month on its plan. The answers are all on the other tabs. Change the plan, or come back next month.",
    failed: "The AI did not answer. No action changed. Try again in a minute.",
    invalid: "The AI answered in a form the app could not use. No action changed. Try again.",
    rateLimited: "Too many AI requests at once. Wait a minute and try again.",
    off: "AI is switched off in the developer menu. Switch it to Stand-in or Real to run this.",
  } as Record<"budget" | "paused" | "plan" | "failed" | "invalid" | "rateLimited" | "off", string>,
  sample: "The sample's actions are invented, to show what this tab looks like.",
  // E9-3: the cost line under the actions and the estimate before a refused run.
  lastRun: (when: string, tokens: number, cost: string) => `Last run ${when}: ${tokens.toLocaleString("en-GB")} tokens, ${cost}.`,
  thisMonth: (cost: string) => `This workspace this month: ${cost}.`,
  estimate: (cost: string) => `This run would cost about ${cost}.`,
  sampleEmpty: "The sample has no actions to show.",
  sampleRefused: "The sample's actions are invented and cannot be written again. Write actions on your own project.",
};
