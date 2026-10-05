// Email 1 of docs/copy/emails.md (the sign-in link, stories/E2-1; template stories/E12-3) on the
// shared frame (layout.ts). The minutes are SIGN_IN_LINK_MINUTES, which better-auth's magic link
// expiry reads too (src/lib/auth.ts), so the email and the link cannot drift.
import { renderEmail, type Email } from "./layout";

export const SIGN_IN_LINK_MINUTES = 15;

export function signInEmail(url: string): Email {
  const minutes = SIGN_IN_LINK_MINUTES;
  return renderEmail({
    origin: url,
    subject: "Your sign-in link for SMEsay",
    preheader: `Works once, for ${minutes} minutes.`,
    before: [{ text: "Hi," }, { text: `Here is your link to sign in to SMEsay. It works once and stops working in ${minutes} minutes.` }],
    button: { label: "Sign in", url },
    after: [{ text: "If you did not ask for this link, ignore this email. Nobody can sign in without it." }],
  });
}
