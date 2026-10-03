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
// and address (PASSCODE_ATTEMPTS). An unknown token costs one indexed read and no count.
// E11-1 moves the limits to the shared store and covers every respondent route.
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
// key with the count in the current window. A count is taken only for a link that exists
// and is at its passcode step, after the database read, so unknown tokens never enter a
// Map (each costs one indexed read). A post counts when it starts, so parallel posts count,
// and a right passcode gives its own entry's count back (never another post's); an entry
// back at zero is removed, so only links with wrong attempts in the window, or posts in
// flight, hold one. Each Map is capped at MAP_CAP entries: expired entries go first, and
// when none is expired the post is refused ("limited"), never another link's count
// dropped. The address is cut to 64 characters.
type Window = { count: number; until: number };
const perLink = new Map<string, Window>();
const perAddress = new Map<string, Window>();
const TOKEN_SHAPE = /^[0-9a-f]{32,128}$/i;
// The entry the post counted on, or null when it is over the limit or the Map is full.
function take(map: Map<string, Window>, key: string, limit: number, now: number): Window | null {
  const entry = map.get(key);
  if (entry && entry.until > now) { entry.count += 1; return entry.count <= limit ? entry : null; }
  map.delete(key);
  if (map.size >= MAP_CAP) for (const [k, v] of map) if (v.until <= now) map.delete(k);
  if (map.size >= MAP_CAP) return null;
  const fresh = { count: 1, until: now + PASSCODE_WINDOW_MINUTES * 60_000 };
  map.set(key, fresh);
  return fresh;
}
// Drops expired entries; true when the Map has room afterwards.
function sweep(map: Map<string, Window>, now: number): boolean {
  for (const [k, v] of map) if (v.until <= now) map.delete(k);
  return map.size < MAP_CAP;
}
function release(map: Map<string, Window>, key: string, entry: Window): void {
  if (map.get(key) !== entry) return;
  entry.count -= 1;
  if (entry.count <= 0) map.delete(key);
}
export function attemptsHeld(): number {
  return perLink.size + perAddress.size;
}
export function clearAttempts(): void {
  perLink.clear();
  perAddress.clear();
}

// The passcode as typed on an open link: "ok" with the proof to set as the cookie, "wrong",
// or "limited" when the attempts are spent; "none" when the link is unknown, not open or
// needs no passcode. The counts are taken after the read, for a real link at its passcode
// step only; the address count is taken only when the link's passed. Both are given back
// on a correct passcode.
export async function checkPasscode(token: string, typed: unknown, address: string, now = new Date()): Promise<{ kind: "ok"; proof: string } | { kind: "wrong" | "limited" | "busy" | "none" }> {
  if (!TOKEN_SHAPE.test(token) || typeof typed !== "string") return { kind: "none" };
  const link = await links.byToken(token);
  if (!link || !link.invite.passcodeHash) return { kind: "none" };
  if (viewOf(link, undefined, now).kind !== "passcode") return { kind: "none" };
  const at = now.getTime();
  const linkKey = link.invite.token;
  const addressKey = `${linkKey}:${address.slice(0, 64)}`;
  // "busy": the Map is full of live entries, so the post is refused without a count
  // against this link (docs/review-list.md records what it takes to fill a Map).
  if (perLink.size >= MAP_CAP && !perLink.has(linkKey) && !sweep(perLink, at)) return { kind: "busy" };
  if (perAddress.size >= MAP_CAP && !perAddress.has(addressKey) && !sweep(perAddress, at)) return { kind: "busy" };
  const linkEntry = take(perLink, linkKey, PASSCODE_LINK_ATTEMPTS, at);
  if (!linkEntry) return { kind: "limited" };
  const addressEntry = take(perAddress, addressKey, PASSCODE_ATTEMPTS, at);
  if (!addressEntry) { release(perLink, linkKey, linkEntry); return { kind: "limited" }; }
  if (await verifyPasscode(typed.trim(), link.invite.passcodeHash)) {
    release(perLink, linkKey, linkEntry);
    release(perAddress, addressKey, addressEntry);
    return { kind: "ok", proof: passcodeProof(link)! };
  }
  return { kind: "wrong" };
}
