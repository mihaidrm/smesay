// What a respondent's link shows (stories/E6-1, acceptance 3 and 4; E7-1 fills the About
// you page in): the link by its token (links.byToken), its state by the dates (an archived
// project's link reads as closed on the day it was archived, docs/review-list.md), and the
// passcode cookie. The cookie is scoped to the link's path (/r/[token]) and holds an HMAC of
// the token and the stored hash under a key derived from the app's secret for this one use,
// so it proves the passcode was typed on this device, says nothing about the passcode, and
// stops working when the PM changes or removes it (nodejs.org/api/crypto.html,
// crypto.createHmac). No session: the token is the credential (SECURITY.md). Wrong attempts
// are limited per link and address in this process (PASSCODE_ATTEMPTS in
// PASSCODE_WINDOW_MINUTES); E11-1 moves the limit to the shared store and covers every
// respondent route.
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
export const PASSCODE_WINDOW_MINUTES = 15;

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
  if (link.project.archivedAt) return { kind: "closed", link, closedAt: link.project.archivedAt };
  const state: LinkState = linkState(link.invite, now);
  if (state === "closed") return { kind: "closed", link, closedAt: link.invite.closesAt ?? now };
  if (state === "revoked" || state === "notOpen") return { kind: state, link };
  if (!proofMatches(link, cookie)) return { kind: "passcode", link };
  return { kind: "open", link };
}

export async function viewLink(token: string, cookie: string | undefined, now = new Date()): Promise<LinkView> {
  const link = await links.byToken(token);
  if (!link) return { kind: "unknown" };
  return viewOf(link, cookie, now);
}

// Wrong attempts per link and address, in this process (a Map; cleared as windows pass).
const attempts = new Map<string, { count: number; until: number }>();
export function attemptsLeft(key: string, now = Date.now()): number {
  const entry = attempts.get(key);
  if (!entry || entry.until <= now) return PASSCODE_ATTEMPTS;
  return Math.max(0, PASSCODE_ATTEMPTS - entry.count);
}
export function recordAttempt(key: string, now = Date.now()): void {
  const entry = attempts.get(key);
  if (!entry || entry.until <= now) attempts.set(key, { count: 1, until: now + PASSCODE_WINDOW_MINUTES * 60_000 });
  else entry.count += 1;
  if (attempts.size > 10_000) for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
}
export function clearAttempts(key: string): void {
  attempts.delete(key);
}

// The passcode as typed on an open link: "ok" with the proof to set as the cookie, "wrong",
// or "limited" when the attempts are spent; "none" when the link is not open or needs no
// passcode.
export async function checkPasscode(token: string, typed: unknown, address: string, now = new Date()): Promise<{ kind: "ok"; proof: string } | { kind: "wrong" | "limited" | "none" }> {
  const link = await links.byToken(token);
  if (!link || !link.invite.passcodeHash || typeof typed !== "string") return { kind: "none" };
  const view = viewOf(link, undefined, now);
  if (view.kind !== "passcode") return { kind: "none" };
  const key = `${token}:${address}`;
  if (attemptsLeft(key, now.getTime()) === 0) return { kind: "limited" };
  if (await verifyPasscode(typed.trim(), link.invite.passcodeHash)) { clearAttempts(key); return { kind: "ok", proof: passcodeProof(link)! }; }
  recordAttempt(key, now.getTime());
  return { kind: "wrong" };
}
