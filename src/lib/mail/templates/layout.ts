// The frame every transactional email shares (stories/E12-3, acceptance 1; docs/design-system.md,
// Email; docs/copy/emails.md): 600 px on the lavender ground, one column, the mark at 22 px
// beside the wordmark, one violet button with the link as plain text under it, then the footer
// with the company name, the registered address and the privacy policy link. The system font
// stack. Each email also has a plain-text part built from the same lines, so the two cannot say
// different things.
//
// The mark is a PNG served from the app (public/assets/brand/mark-44.png, from
// scripts/mark-png.mjs), because Gmail rasterises SVG and PNG works in Gmail, Outlook.com and
// Apple Mail (caniemail.com/features/image-png/). Its address, like the privacy link, is
// absolute on the origin of the email's own link: a relative address does not resolve in a mail
// client. With no origin (the removal job without BETTER_AUTH_URL) the email has the wordmark
// alone and no privacy link, rather than not being sent. Plain template strings, no library
// (the story's technical note; design note 79).
//
// The registered address is COMPANY_ADDRESS (the value is in .env.example since 2026-10-08, the
// seat on the certificate of registration, the same as docs/legal/privacy.md). Unset, the footer
// leaves the line out rather than send a bracket to a person.

export const COMPANY = "SMEsay, by Alerty S.R.L.";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// A paragraph; preLine keeps the line breaks the PM typed (the invite's intro).
export type Para = { text: string; preLine?: boolean };
export type EmailParts = {
  origin: string | null;
  subject: string;
  preheader?: string;
  before: Para[];
  // The button and the link under it; no button for an email with nothing to do (deletion).
  button?: { label: string; url: string };
  after?: Para[];
};
export type Email = { subject: string; text: string; html: string };

export function companyAddress(): string | null {
  const value = process.env.COMPANY_ADDRESS?.trim();
  return value ? value : null;
}

export function renderEmail(parts: EmailParts): Email {
  const { origin, subject, preheader, before, button, after = [] } = parts;
  const privacyUrl = origin ? new URL("/legal/privacy", origin).toString() : null;
  const markUrl = origin ? new URL("/assets/brand/mark-44.png", origin).toString() : null;
  const address = companyAddress();
  const footer = [COMPANY, ...(address ? [address] : [])];

  const text = [
    ...before.flatMap((p) => [p.text, ""]),
    ...(button ? [button.url, ""] : []),
    ...after.flatMap((p) => [p.text, ""]),
    ...footer,
    ...(privacyUrl ? [`Privacy policy: ${privacyUrl}`] : []),
  ].join("\n");

  const para = (p: Para, margin: string) => `<p style="margin:${margin}${p.preLine ? ";white-space:pre-line" : ""}">${escape(p.text)}</p>`;
  const beforeHtml = before.map((p, i) => para(p, i === before.length - 1 ? (button ? "0 0 24px" : after.length ? "0 0 16px" : "0") : "0 0 16px")).join("\n");
  const buttonHtml = button ? `<a href="${escape(button.url)}" style="display:inline-block;background:#6D4CF5;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700">${escape(button.label)}</a>
<p style="margin:24px 0 0;word-break:break-all;color:#5E5A72;font-size:14px;line-height:20px">${escape(button.url)}</p>` : "";
  const afterHtml = after.map((p) => para(p, "24px 0 0")).join("\n");
  const footerHtml = footer.map(escape).join("<br>") + (privacyUrl ? `<br><a href="${escape(privacyUrl)}" style="color:#5A3BE0">Privacy policy</a>` : "");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(subject)}</title></head><body style="margin:0;background:#F7F6FB;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;color:#15131F">
${preheader ? `<span style="display:none;max-height:0;overflow:hidden">${escape(preheader)}</span>` : ""}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E6E3F0;border-radius:16px"><tr><td style="padding:32px">
<table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:24px"><tr>${markUrl ? `<td style="padding-right:8px;vertical-align:middle"><img src="${escape(markUrl)}" width="22" height="22" alt="" style="display:block;border:0"></td>` : ""}<td style="vertical-align:middle;font-weight:800;letter-spacing:-0.02em">S<span style="color:#5A3BE0">ME</span>say</td></tr></table>
${beforeHtml}
${buttonHtml}
${afterHtml}
</td></tr></table>
<p style="margin:24px 0 0;color:#5E5A72;font-size:13px;line-height:18px">${footerHtml}</p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}
