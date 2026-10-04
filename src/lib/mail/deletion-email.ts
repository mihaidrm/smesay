// Email 6 of docs/copy/emails.md (stories/E11-2, acceptance 3): the one email the removal job
// sends the owner who deleted a workspace, once everything in it is gone. Plain text and a
// one-column HTML part on the rules of src/lib/mail/sign-in-email.ts; no button, nothing to do.
import { formatUtc } from "@/lib/sharing-format";

const FOOTER = "SMEsay, by Alerty S.R.L. [REGISTERED ADDRESS, lawyer confirms in E11]";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function deletionEmail(workspace: string, deletedAt: Date): { subject: string; text: string; html: string } {
  const subject = `${workspace} was deleted`;
  const line = `Everything in ${workspace} was deleted on ${formatUtc(deletedAt)}.`;
  const after = "Its projects, responses, files and members are removed. Nothing in it can be brought back.";
  const text = ["Hi,", "", line, "", after, "", FOOTER].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#F7F6FB;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;color:#15131F">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E6E3F0;border-radius:16px"><tr><td style="padding:32px">
<div style="font-weight:800;letter-spacing:-0.02em;margin-bottom:24px">S<span style="color:#5A3BE0">ME</span>say</div>
<p style="margin:0 0 16px">Hi,</p>
<p style="margin:0 0 16px">${esc(line)}</p>
<p style="margin:0">${esc(after)}</p>
</td></tr></table>
<p style="margin:24px 0 0;color:#5E5A72;font-size:13px;line-height:18px">${FOOTER}</p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}
