// What a respondent's link shows (stories/E6-1, acceptance 3 and 4; E7-1 fills the About
// you page in): the link by its token (links.byToken), its state by the dates (an archived
// project's link reads as closed on the day it was archived, docs/review-list.md), and the
// passcode cookie. The cookie is scoped to the link's path (/r/[token]) and holds an HMAC of
// the token and the stored hash under a key derived from the app's secret for this one use,
// so it proves the passcode was typed on this device, says nothing about the passcode, and
// stops working when the PM changes or removes it (nodejs.org/api/crypto.html,
// crypto.createHmac). No session: the token is the credential (SECURITY.md). Wrong attempts
// are limited in this process, counted when the post starts so parallel posts count too and
// given back on a correct passcode: per link (PASSCODE_LINK_ATTEMPTS wrong in the window,
// whatever the address, since the address header can be chosen by the client) and per link
// and address (PASSCODE_ATTEMPTS); the per-link check runs before the database read, so a
// flood costs a Map lookup each once a link is at its cap. E11-1 moves the limits to the
// shared store and covers every respondent route.
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
// Per link the count includes posts in flight, so it must hold a wave of respondents
// opening a mailed link at once.
export const PASSCODE_LINK_ATTEMPTS = 60;
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
  // Closed by its own date or by the project's archiving, dated the earlier of the two.
  const archivedAt = link.project.archivedAt;
  if (state === "closed" || archivedAt) {
    const closedAt = state === "closed" ? (link.invite.closesAt ?? now) : null;
      const earliest = [closedAt, archivedAt].filter((d): d is Date => d !== null).sort((x, y) => x.getTime() - y.getTime())[0] ?? now;
    return { kind: "closed", link, closedAt: earliest };
  }
  if (state === "revoked" || state === "notOpen") return { kind: state, link };
  if (!proofMatches(link, cookie)) return { kind: "passcode", link };
  return { kind: "open", link };
}

export async function viewLink(token: string, cookie: string | undefined, now = new Date()): Promise<LinkView> {
  const link = await links.byToken(token);
  if (!link) return { kind: "unknown" };
  return viewOf(link, cookie, now);
}

// Attempts in this process, two Maps: per link and per link and address, each an entry per
// key with the count in the current window, each capped at MAP_CAP entries (expired ones go
// first, then the oldest; a refreshed key moves to the end). A post counts when it starts,
// so parallel posts count, and a correct passcode, an unknown token or a link that is not
// open give the count back; an entry back at zero is removed, so only links with wrong
// attempts in the window hold an entry and a flood of unknown tokens leaves nothing behind.
// The token's shape is checked before any Map is touched, and the address is cut to 64
// characters, so a key is never longer than about 200 characters.
type Window = { count: number; until: number };
const perLink = new Map<string, Window>();
const perAddress = new Map<string, Window>();
const TOKEN_SHAPE = /^[0-9a-f]{32,128}$/i;
function take(map: Map<string, Window>, key: string, limit: number, now: number): boolean {
  const entry = map.get(key);
  if (entry && entry.until > now) { entry.count += 1; return entry.count <= limit; }
  map.delete(key);
  if (map.size >= MAP_CAP) {
    for (const [k, v] of map) if (v.until <= now) map.delete(k);
    while (map.size >= MAP_CAP) { const oldest = map.keys().next().value; if (oldest === undefined) break; map.delete(oldest); }
  }
  map.set(key, { count: 1, until: now + PASSCODE_WINDOW_MINUTES * 60_000 });
  return true;
}
function release(map: Map<string, Window>, key: string, now: number): void {
  const entry = map.get(key);
  if (!entry) return;
  if (entry.until <= now || entry.count <= 1) { map.delete(key); return; }
  entry.count -= 1;
}
export function attemptsHeld(): number {
  return perLink.size + perAddress.size;
}
export function clearAttempts(): void {
  perLink.clear();
  perAddress.clear();
}

// The passcode as typed on an open link: "ok" with the proof to set as the cookie, "wrong",
// or "limited" when the attempts are spent; "none" when the link is not open or needs no
// passcode. The per-link count is taken before anything else, the database read included,
// so a flood of posts costs one Map lookup each once the link is at its cap; the address
// count is taken only when the link's passed. Both are given back on a correct passcode.
export async function checkPasscode(token: string, typed: unknown, address: string, now = new Date()): Promise<{ kind: "ok"; proof: string } | { kind: "wrong" | "limited" | "none" }> {
  if (!TOKEN_SHAPE.test(token)) return { kind: "none" };
  const at = now.getTime();
  const linkKey = token.toLowerCase();
  const addressKey = `${linkKey}:${address.slice(0, 64)}`;
  if (!take(perLink, linkKey, PASSCODE_LINK_ATTEMPTS, at)) return { kind: "limited" };
  if (!take(perAddress, addressKey, PASSCODE_ATTEMPTS, at)) { release(perLink, linkKey, at); return { kind: "limited" }; }
  const giveBack = () => { release(perLink, linkKey, at); release(perAddress, addressKey, at); };
  const link = await links.byToken(token);
  if (!link || !link.invite.passcodeHash || typeof typed !== "string") { giveBack(); return { kind: "none" }; }
  const view = viewOf(link, undefined, now);
  if (view.kind !== "passcode") { giveBack(); return { kind: "none" }; }
  if (await verifyPasscode(typed.trim(), link.invite.passcodeHash)) { giveBack(); return { kind: "ok", proof: passcodeProof(link)! }; }
  return { kind: "wrong" };
}
