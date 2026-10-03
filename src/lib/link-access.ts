// What a respondent's link shows (stories/E6-1, acceptance 3 and 4; E7-1 fills the About
// you page in): the link by its token (links.byToken), its state by the dates (an archived
// project's link reads as closed on the day it was archived, docs/review-list.md), and the
// passcode cookie. The cookie is scoped to the link's path (/r/[token]) and holds an HMAC of
// the token and the stored hash under a key derived from the app's secret for this one use,
// so it proves the passcode was typed on this device, says nothing about the passcode, and
// stops working when the PM changes or removes it (nodejs.org/api/crypto.html,
// crypto.createHmac). No session: the token is the credential (SECURITY.md). Wrong attempts
// are limited in this process, counted before the check so parallel posts count too: per
// link (PASSCODE_LINK_ATTEMPTS in the window, whatever the address, since the address
// header can be chosen by the client) and per link and address (PASSCODE_ATTEMPTS); the
// per-link cap also bounds the scrypt work one link can cause. E11-1 moves the limits to
// the shared store and covers every respondent route.
import { createHmac, timingSafeEqual } from "node:crypto";
import { links } from "@/db/queries";
import type { Link } from "@/db/queries/links";
import { readAuthEnv } from "@/lib/auth";
import { verifyPasscode } from "@/lib/passcode";
import { linkState, type LinkState } from "@/lib/sharing";

export const PASSCODE_COOKIE = "smesay-passcode";
// A year: the passcode is typed once per device (stories/E6-1, acceptance 4).
export const PASSCODE_COOKIE_SECONDS = 365 * 24 * 60 * 60;
export const PASSCODE_ATTEMPTS = 5;
export const PASSCODE_LINK_ATTEMPTS = 30;
export const PASSCODE_WINDOW_MINUTES = 15;
const MAP_CAP = 10_000;

export type LinkView = { kind: "unknown" } | { kind: "revoked" | "notOpen"; link: Link } | { kind: "closed"; link: Link; closedAt: Date } | { kind: "passcode"; link: Link } | { kind: "open"; link: Link };

const proofKey = () => createHmac("sha256", readAuthEnv().secret).update("smesay-passcode-proof").digest();

export function passcodeProof(link: Pick<Link, "invite">): string | null {
  if (!link.invite.passcodeHash) return null;
  return createHmac("sha256", proofKey()).update(`${link.invite.token}:${link.invite.passcodeHash}`).digest("hex");
}

export function proofMatches(link: Pick<Link, "invite">, cookie: string | undefined): boolean {
  const expected = passcodeProof(link);
  if (!expected) return true;
  if (!cookie) return false;
  const a = Buffer.from(cookie, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function cookiePath(token: string): string {
  return `/r/${token}`;
}

export function viewOf(link: Link, cookie: string | undefined, now = new Date()): LinkView {
  const state: LinkState = linkState(link.invite, now);
  // Closed by its own date first (the earlier instant), then by the project's archiving.
  if (state === "closed") return { kind: "closed", link, closedAt: link.invite.closesAt ?? now };
  if (link.project.archivedAt) return { kind: "closed", link, closedAt: link.project.archivedAt };
  if (state === "revoked" || state === "notOpen") return { kind: state, link };
  if (!proofMatches(link, cookie)) return { kind: "passcode", link };
  return { kind: "open", link };
}

export async function viewLink(token: string, cookie: string | undefined, now = new Date()): Promise<LinkView> {
  const link = await links.byToken(token);
  if (!link) return { kind: "unknown" };
  return viewOf(link, cookie, now);
}

// Attempts in this process: a Map from key to the count in the current window, capped at
// MAP_CAP entries (expired ones go first, then the oldest).
const attempts = new Map<string, { count: number; until: number }>();
// Counts one attempt and says whether it is within the limit.
export function takeAttempt(key: string, limit: number, now = Date.now()): boolean {
  const entry = attempts.get(key);
  if (!entry || entry.until <= now) {
    if (attempts.size >= MAP_CAP) {
      for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
      while (attempts.size >= MAP_CAP) { const oldest = attempts.keys().next().value; if (oldest === undefined) break; attempts.delete(oldest); }
    }
    attempts.set(key, { count: 1, until: now + PASSCODE_WINDOW_MINUTES * 60_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
export function clearAttempts(key: string): void {
  attempts.delete(key);
}
export function attemptsHeld(): number {
  return attempts.size;
}

// The passcode as typed on an open link: "ok" with the proof to set as the cookie, "wrong",
// or "limited" when the attempts are spent; "none" when the link is not open or needs no
// passcode. The attempt is counted before the check, so parallel posts cannot all pass.
export async function checkPasscode(token: string, typed: unknown, address: string, now = new Date()): Promise<{ kind: "ok"; proof: string } | { kind: "wrong" | "limited" | "none" }> {
  const link = await links.byToken(token);
  if (!link || !link.invite.passcodeHash || typeof typed !== "string") return { kind: "none" };
  const view = viewOf(link, undefined, now);
  if (view.kind !== "passcode") return { kind: "none" };
  const perLink = takeAttempt(`link:${token}`, PASSCODE_LINK_ATTEMPTS, now.getTime());
  const perAddress = takeAttempt(`addr:${token}:${address}`, PASSCODE_ATTEMPTS, now.getTime());
  if (!perLink || !perAddress) return { kind: "limited" };
  if (await verifyPasscode(typed.trim(), link.invite.passcodeHash)) { clearAttempts(`addr:${token}:${address}`); return { kind: "ok", proof: passcodeProof(link)! }; }
  return { kind: "wrong" };
}
