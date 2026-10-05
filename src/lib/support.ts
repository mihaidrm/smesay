// The landing page's question bubble, server side (stories/E12-5; decision 0049; copy in
// docs/copy/landing.md, Question bubble, and docs/copy/emails.md, email 5). A visitor's
// question is checked here and mailed to NEXT_PUBLIC_SUPPORT_EMAIL with Reply-To set to the
// visitor, so Mihai answers from his inbox. Nothing is stored and nothing is logged: no table
// (a table would need a workspace_id, CLAUDE.md), and the address and the question go only
// into the email. A hidden field a person never fills ("website") catches simple bots: when
// it is filled the visitor sees "Sent" and nothing is mailed. Limits, in this process as the
// passcode attempts are (src/lib/link-access.ts): 5 questions per visitor address an hour
// (acceptance 3), and 20 posts per connection an hour, so changing the typed address cannot
// fill the inbox (docs/review-list.md, 2026-10-05). An entry stays in memory until its key is
// counted again after the hour, the server restarts or the store fills (src/lib/ratelimit.ts).
import type { Mail } from "@/lib/mail";
import { LOCAL, windowLimiter, type Verdict } from "@/lib/ratelimit";
import { isSupportAddress, QUESTION_MAX, SUPPORT_PER_ADDRESS } from "@/lib/support-copy";

export { QUESTION_MAX, SUPPORT_PER_ADDRESS };
export const SUPPORT_PER_CONNECTION = 20;
const HOUR = 60 * 60_000;
export const supportByAddress = windowLimiter({ max: SUPPORT_PER_ADDRESS, windowMs: HOUR });
export const supportByConnection = windowLimiter({ max: SUPPORT_PER_CONNECTION, windowMs: HOUR });

export type SupportProblem = "email" | "questionEmpty" | "questionLong";
export type SupportInput = { email: string; question: string; page: string; trap: boolean };

// The visitor's post: { email, question, page, website }. A filled hidden field ("website")
// wins over everything else, so a bot always gets the same "Sent" (acceptance 3). The page is
// the address the panel was on, kept to the site's own path so the email cannot carry another
// site's link.
export function readSupport(body: unknown): { input: SupportInput } | { problem: SupportProblem } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const question = typeof b.question === "string" ? b.question.trim() : "";
  const page = typeof b.page === "string" && /^\/[\w\-/]*$/.test(b.page) ? b.page.slice(0, 200) : "/landing-page";
  const trap = typeof b.website === "string" && b.website.trim() !== "";
  if (trap) return { input: { email, question, page, trap } };
  if (!isSupportAddress(email)) return { problem: "email" };
  if (!question) return { problem: "questionEmpty" };
  if (question.length > QUESTION_MAX) return { problem: "questionLong" };
  return { input: { email, question, page, trap } };
}

// One post from a connection, counted before the body is read, so invalid posts count too.
// A request with no address (LOCAL, nothing in front of the app) is not limited by connection,
// as SECURITY.md has it for every limit by address.
export function takeConnection(connection: string, now: number): Verdict {
  return connection === LOCAL ? { allowed: true } : supportByConnection.hit(connection, now);
}

// One question for a visitor address, compared in lower case.
export function takeAddress(email: string, now: number): Verdict {
  return supportByAddress.hit(email.toLowerCase(), now);
}

// A question whose mail did not go gives both counts back, so a visitor who follows "press
// Send again" is not refused for questions that never arrived.
export function giveBack(email: string, connection: string): void {
  supportByAddress.undo(email.toLowerCase());
  if (connection !== LOCAL) supportByConnection.undo(connection);
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
