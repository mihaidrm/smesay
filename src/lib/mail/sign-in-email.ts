// Email 1 of docs/copy/emails.md (the sign-in link), rendered as the plain-text part and a
// one-column HTML part on the design system's email rules (docs/design-system.md: 600 px wide,
// the system font stack, one violet button, the link as plain text under it, the footer with the
// privacy policy link). The mark as a 22 px inline image needs a hosted PNG and checks in real
// clients, so it is a text wordmark until E12-3 turns the four emails into shared templates.
export const SIGN_IN_LINK_MINUTES = 15;

const FOOTER = "SMEsay, by Alerty S.R.L. [REGISTERED ADDRESS, lawyer confirms in E11]";

// The privacy policy link is absolute (a relative href does not resolve in a mail client) and
// points at /legal/privacy, the page E11-3 builds; until then it is the 404 page.
export function signInEmail(url: string): { subject: string; text: string; html: string } {
  const minutes = SIGN_IN_LINK_MINUTES;
  const privacyUrl = new URL("/legal/privacy", url).toString();
  const subject = "Your sign-in link for SMEsay";
  const text = [
    "Hi,", "",
    `Here is your link to sign in to SMEsay. It works once and stops working in ${minutes} minutes.`, "",
    url, "",
    "If you did not ask for this link, ignore this email. Nobody can sign in without it.", "",
    FOOTER,
    `Privacy policy: ${privacyUrl}`,
  ].join("\n");
  const safeUrl = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const html = `<!doctype html><html><body style="margin:0;background:#F7F6FB;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;color:#15131F">
<span style="display:none;max-height:0;overflow:hidden">Works once, for ${minutes} minutes.</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E6E3F0;border-radius:16px"><tr><td style="padding:32px">
<div style="font-weight:800;letter-spacing:-0.02em;margin-bottom:24px">S<span style="color:#5A3BE0">ME</span>say</div>
<p style="margin:0 0 16px">Hi,</p>
<p style="margin:0 0 24px">Here is your link to sign in to SMEsay. It works once and stops working in ${minutes} minutes.</p>
<a href="${safeUrl}" style="display:inline-block;background:#6D4CF5;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700">Sign in</a>
<p style="margin:24px 0 0;word-break:break-all;color:#5E5A72;font-size:14px;line-height:20px">${safeUrl}</p>
<p style="margin:24px 0 0">If you did not ask for this link, ignore this email. Nobody can sign in without it.</p>
</td></tr></table>
<p style="margin:24px 0 0;color:#5E5A72;font-size:13px;line-height:18px">${FOOTER}<br><a href="${privacyUrl}" style="color:#5A3BE0">Privacy policy</a></p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}
