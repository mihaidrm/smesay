// Email 3 of docs/copy/emails.md (the reminder, stories/E6-3), rendered like the invite
// (invite-email.ts): a plain-text part and a one-column HTML part. The branch is "You have
// not started yet." when no answer exists, else "You answered [N] of [M] items." The close
// instant is written in UTC (src/lib/sharing.ts formatUtc).
import { formatUtc } from "@/lib/sharing";

const FOOTER = "SMEsay, by Alerty S.R.L. [REGISTERED ADDRESS, lawyer confirms in E11]";
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type ReminderEmailInput = { pmName: string; projectName: string; respondentName: string | null; answered: number; itemCount: number; url: string; closesAt: Date | null };

export function reminderEmail(input: ReminderEmailInput): { subject: string; text: string; html: string } {
  const { pmName, projectName, answered, itemCount, url, closesAt } = input;
  const privacyUrl = new URL("/legal/privacy", url).toString();
  const closeDay = closesAt ? formatUtc(closesAt).split(",")[0] : "";
  const subject = closesAt ? `Reminder: ${projectName} closes on ${closeDay}` : `Reminder: ${projectName}`;
  const preheader = `${answered} of ${itemCount} answered so far.`;
  const greeting = input.respondentName ? `Hi ${input.respondentName},` : "Hi,";
  const waiting = closesAt ? `${pmName} is still waiting for your answers on ${projectName}. The link closes on ${formatUtc(closesAt)}.` : `${pmName} is still waiting for your answers on ${projectName}.`;
  const branch = answered === 0 ? "You have not started yet." : `You answered ${answered} of ${itemCount} ${itemCount === 1 ? "item" : "items"}. Your answers are saved; pick up where you left off.`;
  const optOut = `If you cannot take part, reply to this email and say so, and ${pmName} will stop reminding you.`;
  const text = [greeting, "", waiting, "", branch, "", url, "", optOut, "", FOOTER, `Privacy policy: ${privacyUrl}`].join("\n");
  const safeUrl = escape(url);
  const html = `<!doctype html><html><body style="margin:0;background:#F7F6FB;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;color:#15131F">
<span style="display:none;max-height:0;overflow:hidden">${escape(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E6E3F0;border-radius:16px"><tr><td style="padding:32px">
<div style="font-weight:800;letter-spacing:-0.02em;margin-bottom:24px">S<span style="color:#5A3BE0">ME</span>say</div>
<p style="margin:0 0 16px">${escape(greeting)}</p>
<p style="margin:0 0 16px">${escape(waiting)}</p>
<p style="margin:0 0 24px">${escape(branch)}</p>
<a href="${safeUrl}" style="display:inline-block;background:#6D4CF5;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700">Carry on</a>
<p style="margin:24px 0 0;word-break:break-all;color:#5E5A72;font-size:14px;line-height:20px">${safeUrl}</p>
<p style="margin:24px 0 0">${escape(optOut)}</p>
</td></tr></table>
<p style="margin:24px 0 0;color:#5E5A72;font-size:13px;line-height:18px">${FOOTER}<br><a href="${escape(privacyUrl)}" style="color:#5A3BE0">Privacy policy</a></p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}
