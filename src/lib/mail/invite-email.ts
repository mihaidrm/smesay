// Email 2 of docs/copy/emails.md (the personal invite, stories/E6-2), rendered like the
// sign-in email (sign-in-email.ts): a plain-text part and a one-column HTML part on the
// design system's email rules. The PM's intro from Build is cut to three lines. The close
// instant is written in UTC (src/lib/sharing.ts formatUtc), the zone named. The minutes
// estimate is minutesFor() in src/lib/invitees-rules.ts, shared with the reminder (E6-3).
import { formatUtc } from "@/lib/sharing";

const FOOTER = "SMEsay, by Alerty S.R.L. [REGISTERED ADDRESS, lawyer confirms in E11]";
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type InviteEmailInput = { pmName: string; workspaceName: string; projectName: string; respondentName: string | null; itemCount: number; minutes: number; intro: string | null; url: string; closesAt: Date | null };

export function inviteEmail(input: InviteEmailInput): { subject: string; text: string; html: string } {
  const { pmName, workspaceName, projectName, itemCount, minutes, url, closesAt } = input;
  const intro = (input.intro ?? "").split("\n").filter((l) => l.trim()).slice(0, 3).join("\n");
  const privacyUrl = new URL("/legal/privacy", url).toString();
  const subject = `${pmName} asks for your view on ${projectName}`;
  const preheader = `${itemCount} ${itemCount === 1 ? "item" : "items"}, about ${minutes} minutes, on your phone or laptop.`;
  const greeting = input.respondentName ? `Hi ${input.respondentName},` : "Hi,";
  const list = `a list of ${itemCount} ${itemCount === 1 ? "requirement" : "requirements"}`;
  const closes = closesAt ? `It closes on ${formatUtc(closesAt)}.` : "";
  const text = [
    greeting, "",
    `${pmName} at ${workspaceName} is checking ${list} for ${projectName} and wants your view.`, "",
    ...(intro ? [intro, ""] : []),
    `For each item you say whether you agree with the proposed priority, or what it should be and why. It takes about ${minutes} minutes. You can stop and come back; your answers are saved as you go. No account is needed.`, "",
    url, "",
    `This link is yours. Do not forward it; answers sent through it are recorded under your name. ${closes}`.trim(), "",
    FOOTER,
    `Privacy policy: ${privacyUrl}`,
  ].join("\n");
  const safeUrl = escape(url);
  const html = `<!doctype html><html><body style="margin:0;background:#F7F6FB;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;color:#15131F">
<span style="display:none;max-height:0;overflow:hidden">${escape(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E6E3F0;border-radius:16px"><tr><td style="padding:32px">
<div style="font-weight:800;letter-spacing:-0.02em;margin-bottom:24px">S<span style="color:#5A3BE0">ME</span>say</div>
<p style="margin:0 0 16px">${escape(greeting)}</p>
<p style="margin:0 0 16px">${escape(pmName)} at ${escape(workspaceName)} is checking ${escape(list)} for ${escape(projectName)} and wants your view.</p>
${intro ? `<p style="margin:0 0 16px;white-space:pre-line">${escape(intro)}</p>` : ""}
<p style="margin:0 0 24px">For each item you say whether you agree with the proposed priority, or what it should be and why. It takes about ${minutes} minutes. You can stop and come back; your answers are saved as you go. No account is needed.</p>
<a href="${safeUrl}" style="display:inline-block;background:#6D4CF5;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700">Open your link</a>
<p style="margin:24px 0 0;word-break:break-all;color:#5E5A72;font-size:14px;line-height:20px">${safeUrl}</p>
<p style="margin:24px 0 0">This link is yours. Do not forward it; answers sent through it are recorded under your name. ${escape(closes)}</p>
</td></tr></table>
<p style="margin:24px 0 0;color:#5E5A72;font-size:13px;line-height:18px">${FOOTER}<br><a href="${escape(privacyUrl)}" style="color:#5A3BE0">Privacy policy</a></p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}
