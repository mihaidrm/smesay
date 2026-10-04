// The personal invites' rules with no database import (stories/E6-2), so the Share form
// can show them: the lines the PM pastes (one person per line: email, then an optional
// name and role after commas), the cap per send, and the minutes estimate the invite and
// reminder emails and the landing copy share (20 seconds per item, rounded up to the next
// five minutes).
export const INVITEES_MAX_PER_SEND = 100;
// Per workspace in 24 hours, counted on the rows created (SECURITY.md, rate limits).
export const INVITEES_PER_DAY = 500;
export const INVITEE_TEXT_MAX = 80;
export const SECONDS_PER_ITEM = 20;

export const INVITEES_COPY = {
  card: "Personal invites",
  line: "One link per person, sent by email from you. Each answers under their name and can carry on from any device.",
  field: "People, one per line",
  hint: "Addresses apart by commas, spaces or new lines. A name and a role may follow an address after commas: ana@company.example, Ana Pop, Finance",
  send: "Send",
  needLink: "Publish the public link first. Personal links take its open and close dates.",
  sent: (n: number) => `${n} ${n === 1 ? "invite" : "invites"} sent.`,
  linkClosed: "The public link is closed. Move its close date to send invites.",
  linkRevoked: "The public link is revoked. Publish again to send invites.",
  linkReplaced: "A newer version of the list was published while you were sending. Nothing was sent. Reload the page, paste the people again and send: the invites go with the newer version's link.",
  headers: { person: "Person", status: "Status", reminders: "Reminders", actions: "Actions" },
  status: { invited: "Invited", inProgress: "In progress", submitted: "Submitted", notSent: "Not sent", revoked: "Revoked" },
  revoke: "Revoke",
  newLink: "New link",
  revokedLine: (when: string) => `Revoked ${when}. The link shows the inactive page.`,
  newLinkSent: (email: string) => `New link sent to ${email}.`,
  notSentHint: "Paste the address again to send it. A send in progress holds the address for 15 minutes.",
  noneSent: "None sent",
  remindersLine: (n: number, date: string) => `${n} sent, last ${date}`,
  empty: "Nobody invited yet.",
  sample: "The sample project cannot be edited.",
} as const;

export const INVITEES_ERRORS = {
  empty: "Enter at least one email address, one person per line.",
  badAddress: (text: string) => `${text} is not an email address. Check it and try again.`,
  tooMany: `Up to ${INVITEES_MAX_PER_SEND} people per send. Split the list and send again.`,
  longName: `Keep each name and role to ${INVITEE_TEXT_MAX} characters.`,
  already: (email: string) => `${email} already has a personal link. Press Remind to send it again.`,
  tooManyToday: (left: number) => left === 0 ? `This workspace sent ${INVITEES_PER_DAY} invites in the last 24 hours. Try again later.` : `This workspace can send ${left} more ${left === 1 ? "invite" : "invites"} right now (${INVITEES_PER_DAY} in any 24 hours). Shorten the list, or try again later.`,
  inFlight: (email: string) => `A send to ${email} started in the last 15 minutes and may still be going. If the row still says Not sent after that, paste the address again.`,
  notSent: (email: string, reason: string) => `The invite to ${email} was not sent: ${reason}. Check the address and try again.`,
  badShape: "The list did not reach the server as text. Reload the page and try again.",
  alreadyRevoked: (email: string) => `${email} is already revoked. Press New link to send a fresh one.`,
  notRevoked: (email: string) => `${email} is not revoked, so it has its link. Reload the page to see the row as it is.`,
  newLinkNotSent: (email: string, reason: string) => `The new link for ${email} was made but not sent: ${reason}. Paste the address again to send it.`,
} as const;

export type Invitee = { email: string; name: string | null; role: string | null };

// The line the box takes for a person, for the addresses that were not sent.
export const inviteeLine = (p: Invitee): string => [p.email, p.name, p.role].filter(Boolean).join(", ");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Addresses separated by commas, semicolons, spaces or new lines (stories/E6-2, acceptance
// 1), each with an optional name and role after commas: "ana@company.example, Ana Pop,
// Finance". The text is cut at new lines, commas and semicolons; a piece made of addresses
// (one, or several apart by spaces) starts a person each; any other piece is the name, then
// the role, of the person before it; a third piece, or one before any address, is refused as
// not an address. A repeated address keeps its first entry.
export function parseInvitees(raw: unknown): { error: string } | { invitees: Invitee[] } {
  if (typeof raw !== "string") return { error: INVITEES_ERRORS.badShape };
  const pieces = raw.split(/[\r\n,;]+/).map((p) => p.trim()).filter(Boolean);
  if (pieces.length === 0) return { error: INVITEES_ERRORS.empty };
  const seen = new Set<string>();
  const invitees: Invitee[] = [];
  let current: Invitee | null = null;
  for (const piece of pieces) {
    const words = piece.split(/\s+/);
    if (words.every((w) => EMAIL.test(w))) {
      for (const word of words) {
        const email = word.toLowerCase();
        if (email.length > 254) return { error: INVITEES_ERRORS.badAddress(word) };
        // A repeated address keeps its first entry; the name and role after the repeat
        // land on this entry, which is dropped.
        current = { email, name: null, role: null };
        if (seen.has(email)) continue;
        seen.add(email);
        invitees.push(current);
        if (invitees.length > INVITEES_MAX_PER_SEND) return { error: INVITEES_ERRORS.tooMany };
      }
      continue;
    }
    if (!current || current.role !== null) return { error: INVITEES_ERRORS.badAddress(piece) };
    if (piece.length > INVITEE_TEXT_MAX) return { error: INVITEES_ERRORS.longName };
    if (current.name === null) current.name = piece; else current.role = piece;
  }
  return { invitees };
}

export function minutesFor(itemCount: number): number {
  const minutes = Math.ceil((itemCount * SECONDS_PER_ITEM) / 60);
  return Math.max(5, Math.ceil(minutes / 5) * 5);
}
