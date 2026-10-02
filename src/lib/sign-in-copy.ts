// The sign-in page's messages (docs/copy/errors.md, "Sign-in and workspace"; docs/copy/app.md)
// and the mapping from a refused request to one of them, so the library's own text never
// reaches the screen (audit finding of 2026-10-02).
import { SIGN_IN_LINK_MINUTES } from "@/lib/mail/sign-in-email";

// The plugin's own limit is 5 requests per 60 second window until E11-1 sets the auth limits.
export const WAIT_MINUTES = 1;

export const SIGN_IN_COPY = {
  or: "or",
  google: "Continue with Google",
  googleFailedTitle: "Sign-in with Google did not complete.",
  googleFailedLine: "Try again, or use the email link.",
  googleFailedButton: "Back to sign-in",
  badAddress: "Enter the email address you signed up with.",
  tooMany: `Too many sign-in attempts. Wait ${WAIT_MINUTES} ${WAIT_MINUTES === 1 ? "minute" : "minutes"}, then try again.`,
  notSent: "The link was not sent. Try again in a minute.",
  sent: `Check your email. The link works once and stops working in ${SIGN_IN_LINK_MINUTES} minutes.`,
};

// better-call reports a body that fails validation as 400 (node_modules/better-call/dist/
// validator.mjs, fromError); better-auth's rate limiter answers 429.
export function messageForStatus(status: number | undefined): string {
  if (status === 400 || status === 422) return SIGN_IN_COPY.badAddress;
  if (status === 429) return SIGN_IN_COPY.tooMany;
  return SIGN_IN_COPY.notSent;
}
