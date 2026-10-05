// Email 4 of docs/copy/emails.md (the submission receipt, stories/E7-5, acceptance 5; template
// stories/E12-3) on the shared frame (layout.ts). Counts only, with the link, never the answers
// (decision 0031). The instants are written in UTC (src/lib/sharing-format.ts formatUtc).
import { formatUtc } from "@/lib/sharing-format";
import { renderEmail, type Email } from "./layout";

export type ReceiptEmailInput = {
  respondentName: string | null;
  projectName: string;
  workspaceName: string;
  submittedAt: Date;
  closesAt: Date | null;
  // rated: items answered with no proposal to compare (a rate-blind instrument shows none).
  counts: { items: number; changed: number; rated: number; notNeeded: number; unclear: number; missing: number; confidence: number };
  rateBlind: boolean;
  url: string;
};

export function receiptEmail(input: ReceiptEmailInput): Email {
  const { projectName, workspaceName, submittedAt, closesAt, counts, url } = input;
  const when = formatUtc(submittedAt);
  const split = input.rateBlind ? `${counts.rated} rated` : `${counts.changed} with a different priority`;
  return renderEmail({
    origin: url,
    subject: `Your answers on ${projectName} were submitted`,
    preheader: `${counts.items} ${counts.items === 1 ? "item" : "items"}, submitted ${when}.`,
    before: [
      { text: input.respondentName ? `Hi ${input.respondentName},` : "Hi," },
      { text: `Your answers on ${projectName} for ${workspaceName} were submitted on ${when}.` },
      { text: `${counts.items} ${counts.items === 1 ? "item" : "items"} answered. ${split}, ${counts.notNeeded} not needed, ${counts.unclear} marked unclear, ${counts.missing} missing ${counts.missing === 1 ? "item" : "items"} suggested. Confidence ${counts.confidence} of 5.` },
      { text: closesAt ? `You can change your answers until the link closes on ${formatUtc(closesAt)}. Open the same link and press Change my answers.` : "You can change your answers while the link is open. Open the same link and press Change my answers." },
    ],
    button: { label: "See your answers", url },
  });
}
