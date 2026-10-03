// The reminder rules with no database import (stories/E6-3), so the Share card's client
// parts can use them: at most one reminder per person every REMIND_AFTER_HOURS, none to a
// person who submitted or whose invite was never sent, never automatic (docs/copy/emails.md,
// email 3). Words: docs/copy/app.md (Share, Personal invites) and docs/copy/errors.md.
import { formatUtc } from "@/lib/sharing-format";

export const REMIND_AFTER_HOURS = 72;

export const REMINDERS_COPY = {
  remind: "Remind",
  remindAll: "Remind everyone who has not submitted",
  rule: "Reminders go only when you press the button, at most one per person every three days, never after they submit.",
  sent: (n: number) => `${n} ${n === 1 ? "reminder" : "reminders"} sent.`,
  noneDue: "Nobody is due a reminder.",
  tooSoon: (days: number, next: string) => `Reminded ${days} ${days === 1 ? "day" : "days"} ago. The next reminder can go on ${next}.`,
  notSent: (email: string, reason: string) => `The reminder to ${email} was not sent: ${reason}. Try again later.`,
  notDue: (email: string) => `${email} cannot be reminded: the invite was not sent, was revoked, or the person has submitted. Reload the page to see the row as it is.`,
  raced: (email: string) => `${email} was not reminded: another request changed the row just now. Reload the page to see the row as it is.`,
  tooSoonFor: (email: string, line: string) => `${email}: ${line}`,
} as const;

export type RemindCheck = { ok: true } | { ok: false; why: "submitted" | "notSent" | "revoked" | "tooSoon"; days: number; next: Date | null };

// Whether a person can be reminded now, from the row the list shows.
export function canRemind(row: { sentAt: Date | null; revokedAt: Date | null; lastReminderAt: Date | null; responseStatus: "none" | "inProgress" | "submitted" }, now = new Date()): RemindCheck {
  if (row.responseStatus === "submitted") return { ok: false, why: "submitted", days: 0, next: null };
  if (row.sentAt === null) return { ok: false, why: "notSent", days: 0, next: null };
  if (row.revokedAt) return { ok: false, why: "revoked", days: 0, next: null };
  if (row.lastReminderAt) {
    const next = new Date(row.lastReminderAt.getTime() + REMIND_AFTER_HOURS * 60 * 60 * 1000);
    if (next > now) return { ok: false, why: "tooSoon", days: Math.floor((now.getTime() - row.lastReminderAt.getTime()) / (24 * 60 * 60 * 1000)), next };
  }
  return { ok: true };
}

export const tooSoonLine = (check: Extract<RemindCheck, { ok: false }>): string => REMINDERS_COPY.tooSoon(check.days, check.next ? formatUtc(check.next) : "");
