// The feedback page's words (stories/E17-1; docs/copy/app.md, Feedback; docs/copy/errors.md,
// Feedback). Nothing here says "AI" (decision 0046).
import type { FeedbackKind, FeedbackStatus } from "@/db/types";

export const FEEDBACK_COPY = {
  nav: "Feedback",
  title: "Feedback",
  intro: "Something wrong, an idea, a question: tell us here. We read every report.",
  kindLabel: "What is it about?",
  kinds: { wrong: "Something is wrong", idea: "An idea", question: "A question", other: "Something else" } satisfies Record<FeedbackKind, string>,
  textLabel: "What would you like to tell us?",
  textHint: "Up to 2,000 characters.",
  about: (page: string) => `About: ${page}`,
  send: "Send",
  sending: "Sending",
  sent: (email: string) => `Sent. Thank you. If we reply, it goes to ${email}.`,
  errors: {
    kind: "Pick what the report is about.",
    empty: "Write what you would like to tell us.",
    long: "Keep the report under 2,000 characters.",
    capped: "This workspace has sent 20 reports in the last hour. Try again later, or write to us by email.",
    failed: "The report was not saved. Try again in a minute.",
  },
  listTitle: "Reports from this workspace",
  listEmpty: "No report yet.",
  listLine: (email: string | null, when: string) => `${email ?? "Someone who left"}, ${when}`,
  status: { open: "Open", solved: "Solved" } satisfies Record<FeedbackStatus, string>,
  noPage: "no page",
};
