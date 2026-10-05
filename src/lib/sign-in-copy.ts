// The sign-in page's messages (docs/copy/errors.md, "Sign-in and workspace"; docs/copy/app.md)
// and the mapping from a refused request to one of them, so the library's own text never
// reaches the screen (audit finding of 2026-10-02).
import { SIGN_IN_LINK_MINUTES } from "@/lib/mail/templates/sign-in";

// The wait when the server sends none (src/lib/ratelimit.ts: the first wait is one minute).
export const WAIT_MINUTES = 1;
const minutes = (n: number) => `${n} ${n === 1 ? "minute" : "minutes"}`;

export const SIGN_IN_COPY = {
  or: "or",
  google: "Continue with Google",
  googleFailedTitle: "Sign-in with Google did not complete.",
  googleFailedLine: "Try again, or use the email link.",
  googleFailedButton: "Back to sign-in",
  badAddress: "Enter the email address you signed up with.",
  tooManyFor: (wait: number) => `Too many sign-in attempts. Wait ${minutes(wait)}, then try again.`,
  notSent: "The link was not sent. Try again in a minute.",
  sent: `Check your email. The link works once and stops working in ${SIGN_IN_LINK_MINUTES} minutes.`,
};

// better-call reports a body that fails validation as 400 (node_modules/better-call/dist/
// validator.mjs, fromError); the sign-in limit (src/lib/auth.ts, E11-1) and better-auth's own
// rate limiter answer 429, the first with the wait in minutes.
export function messageForStatus(status: number | undefined, waitMinutes?: unknown): string {
  if (status === 400 || status === 422) return SIGN_IN_COPY.badAddress;
  if (status === 429) return SIGN_IN_COPY.tooManyFor(typeof waitMinutes === "number" && Number.isInteger(waitMinutes) && waitMinutes > 0 ? waitMinutes : WAIT_MINUTES);
  return SIGN_IN_COPY.notSent;
}
