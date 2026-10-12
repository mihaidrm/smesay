// The words of the Emails to you card in Settings and of the stop page (stories/E16-1,
// acceptance 5), from docs/copy/app.md and docs/copy/errors.md.
import type { EmailKind } from "@/db/types";

export const EMAIL_KIND_NAMES: Record<EmailKind, string> = {
  validations: "the emails about your validations",
  digest: "the daily digest",
  guide: "the getting-started emails",
};

export const EMAIL_COPY = {
  settings: {
    title: "Emails to you",
    line: "These switches are yours, in every workspace. Each of these emails also has a link that stops it.",
    kinds: {
      validations: { label: "About your validations", detail: "One email when a validation's link closes, and one when everyone you invited has submitted." },
      digest: { label: "Daily digest", detail: "At most one email a day, only after a day with a new submission on an open validation." },
      guide: { label: "Getting started", detail: "Up to four emails in your first two weeks, until you publish a validation." },
    } satisfies Record<EmailKind, { label: string; detail: string }>,
    notSaved: "The switch was not saved. Try again.",
  },
  stop: {
    title: (kind: EmailKind) => `Stop ${EMAIL_KIND_NAMES[kind]}?`,
    line: (kind: EmailKind) => `SMEsay stops sending you ${EMAIL_KIND_NAMES[kind]}. The other emails are not changed; their switches are in Settings.`,
    button: "Stop these emails",
    done: (kind: EmailKind) => `Done. You will not get ${EMAIL_KIND_NAMES[kind]} from SMEsay any more. The switch is in Settings if you change your mind.`,
    toApp: "Go to SMEsay",
  },
} as const;
