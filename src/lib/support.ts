// The landing page's question bubble, server side (stories/E12-5; decision 0049; copy in
// docs/copy/landing.md, Question bubble, and docs/copy/emails.md, email 5). A visitor's
// question is checked here and mailed to NEXT_PUBLIC_SUPPORT_EMAIL with Reply-To set to the
// visitor, so Mihai answers from his inbox. Nothing is stored and nothing is logged: no table
// (a table would need a workspace_id, CLAUDE.md), and the address and the question go only
// into the email. A hidden field a person never fills ("website") catches simple bots: when
// it is filled the visitor sees "Sent" and nothing is mailed. Limits, in this process as the
// passcode attempts are (src/lib/link-access.ts): 5 questions per visitor address an hour
// (acceptance 3), and 20 per connection an hour, so changing the typed address cannot fill
// the inbox (docs/review-list.md, 2026-10-05).
import type { Mail } from "@/lib/mail";
import { windowLimiter, type Verdict } from "@/lib/ratelimit";
import { QUESTION_MAX, SUPPORT_PER_ADDRESS } from "@/lib/support-copy";

export { QUESTION_MAX, SUPPORT_PER_ADDRESS };
export const SUPPORT_PER_CONNECTION = 20;
const HOUR = 60 * 60_000;
// The same address check the app uses for invitees and respondents (src/lib/invitees-rules.ts).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;

export const supportByAddress = windowLimiter({ max: SUPPORT_PER_ADDRESS, windowMs: HOUR });
export const supportByConnection = windowLimiter({ max: SUPPORT_PER_CONNECTION, windowMs: HOUR });

export type SupportProblem = "email" | "questionEmpty" | "questionLong";
export type SupportInput = { email: string; question: string; page: string; trap: boolean };

// The visitor's post: { email, question, page, website }. The page is the address the panel
// was on, kept to the site's own path so the email cannot carry another site's link.
export function readSupport(body: unknown): { input: SupportInput } | { problem: SupportProblem } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const question = typeof b.question === "string" ? b.question.trim() : "";
  const page = typeof b.page === "string" && /^\/[\w\-/]*$/.test(b.page) ? b.page.slice(0, 200) : "/landing-page";
  const trap = typeof b.website === "string" && b.website.trim() !== "";
  if (!email || email.length > EMAIL_MAX || !EMAIL.test(email)) return { problem: "email" };
  if (!question) return { problem: "questionEmpty" };
  if (question.length > QUESTION_MAX) return { problem: "questionLong" };
  return { input: { email, question, page, trap } };
}

// Both limits count the post; the address is compared in lower case.
export function takeSupport(email: string, connection: string, now: number): Verdict {
  const byConnection = supportByConnection.hit(connection, now);
  if (!byConnection.allowed) return byConnection;
  return supportByAddress.hit(email.toLowerCase(), now);
}

const utc = (d: Date) => `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC`;

// Email 5: plain text, the question as written, Reply-To the visitor.
export function supportEmail(to: string, input: SupportInput, origin: string, now: Date): Mail {
  return {
    to,
    subject: `Question from the landing page: ${input.email}`,
    replyTo: input.email,
    text: `${input.question}\n\nThe visitor sent this from ${origin}${input.page} on ${utc(now)}. Reply to this email to answer.\n`,
  };
}
