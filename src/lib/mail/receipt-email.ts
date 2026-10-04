// Email 4 of docs/copy/emails.md (the submission receipt, stories/E7-5, acceptance 5),
// rendered like the reminder (reminder-email.ts): a plain-text part and a one-column HTML
// part. Counts only, with the link, never the answers (decision 0031). The instants are
// written in UTC (src/lib/sharing.ts formatUtc).
import { formatUtc } from "@/lib/sharing";

const FOOTER = "SMEsay, by Alerty S.R.L. [REGISTERED ADDRESS, lawyer confirms in E11]";
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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

export function receiptEmail(input: ReceiptEmailInput): { subject: string; text: string; html: string } {
  const { projectName, workspaceName, submittedAt, closesAt, counts, url } = input;
  const privacyUrl = new URL("/legal/privacy", url).toString();
  const when = formatUtc(submittedAt);
  const subject = `Your answers on ${projectName} were submitted`;
  const preheader = `${counts.items} ${counts.items === 1 ? "item" : "items"}, submitted ${when}.`;
  const greeting = input.respondentName ? `Hi ${input.respondentName},` : "Hi,";
  const lead = `Your answers on ${projectName} for ${workspaceName} were submitted on ${when}.`;
  const split = input.rateBlind ? `${counts.rated} rated` : `${counts.changed} with a different priority`;
  const summary = `${counts.items} ${counts.items === 1 ? "item" : "items"} answered. ${split}, ${counts.notNeeded} not needed, ${counts.unclear} marked unclear, ${counts.missing} missing ${counts.missing === 1 ? "item" : "items"} suggested. Confidence ${counts.confidence} of 5.`;
  const change = closesAt ? `You can change your answers until the link closes on ${formatUtc(closesAt)}. Open the same link and press Change my answers.` : "You can change your answers while the link is open. Open the same link and press Change my answers.";
  const text = [greeting, "", lead, "", summary, "", change, "", url, "", FOOTER, `Privacy policy: ${privacyUrl}`].join("\n");
  const safeUrl = escape(url);
  const html = `<!doctype html><html><body style="margin:0;background:#F7F6FB;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;color:#15131F">
<span style="display:none;max-height:0;overflow:hidden">${escape(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E6E3F0;border-radius:16px"><tr><td style="padding:32px">
<div style="font-weight:800;letter-spacing:-0.02em;margin-bottom:24px">S<span style="color:#5A3BE0">ME</span>say</div>
<p style="margin:0 0 16px">${escape(greeting)}</p>
<p style="margin:0 0 16px">${escape(lead)}</p>
<p style="margin:0 0 16px">${escape(summary)}</p>
<p style="margin:0 0 24px">${escape(change)}</p>
<a href="${safeUrl}" style="display:inline-block;background:#6D4CF5;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700">See your answers</a>
<p style="margin:24px 0 0;word-break:break-all;color:#5E5A72;font-size:14px;line-height:20px">${safeUrl}</p>
</td></tr></table>
<p style="margin:24px 0 0;color:#5E5A72;font-size:13px;line-height:18px">${FOOTER}<br><a href="${escape(privacyUrl)}" style="color:#5A3BE0">Privacy policy</a></p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}
