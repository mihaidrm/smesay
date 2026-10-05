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
  const split = input.rateBlind ? `You rated ${counts.rated}` : `You gave ${counts.changed} a different priority`;
  return renderEmail({
    origin: url,
    subject: `Your answers on ${projectName} were submitted`,
    preheader: `You submitted ${counts.items} ${counts.items === 1 ? "item" : "items"} on ${when}.`,
    before: [
      { text: input.respondentName ? `Hi ${input.respondentName},` : "Hi," },
      { text: `Your answers on ${projectName} for ${workspaceName} were submitted on ${when}.` },
      { text: `You answered ${counts.items} ${counts.items === 1 ? "item" : "items"}. ${split}, marked ${counts.notNeeded} not needed and ${counts.unclear} unclear, and suggested ${counts.missing} missing ${counts.missing === 1 ? "item" : "items"}. Your confidence was ${counts.confidence} of 5.` },
      { text: closesAt ? `You can change your answers until the link closes on ${formatUtc(closesAt)}. Open the same link and press Change my answers.` : "You can change your answers while the link is open. Open the same link and press Change my answers." },
    ],
    button: { label: "See your answers", url },
  });
}
