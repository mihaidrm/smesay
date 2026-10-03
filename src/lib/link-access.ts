// What a respondent's link shows (stories/E6-1, acceptance 3 and 4; E7-1 fills the About
// you page in): the link by its token (links.byToken), its state by the dates, and the
// passcode cookie. The cookie is scoped to the link's path (/r/[token]) and holds an HMAC
// of the token and the stored hash under the app's secret, so it proves the passcode was
// typed on this device, says nothing about the passcode, and stops working when the PM
// changes or removes it (nodejs.org/api/crypto.html, crypto.createHmac). No session: the
// token is the credential (SECURITY.md). Rate limits on the attempts are E11-1.
import { createHmac, timingSafeEqual } from "node:crypto";
import { links } from "@/db/queries";
import type { Link } from "@/db/queries/links";
import { readAuthEnv } from "@/lib/auth";
import { verifyPasscode } from "@/lib/passcode";
import { linkState, type LinkState } from "@/lib/sharing";

export const PASSCODE_COOKIE = "smesay-passcode";
// A year: the passcode is typed once per device (stories/E6-1, acceptance 4).
export const PASSCODE_COOKIE_SECONDS = 365 * 24 * 60 * 60;

export type LinkView = { kind: "unknown" } | { kind: "revoked" | "notOpen" | "closed"; link: Link } | { kind: "passcode"; link: Link } | { kind: "open"; link: Link };

export function passcodeProof(link: Pick<Link, "invite">): string | null {
  if (!link.invite.passcodeHash) return null;
  return createHmac("sha256", readAuthEnv().secret).update(`${link.invite.token}:${link.invite.passcodeHash}`).digest("hex");
}

export function proofMatches(link: Pick<Link, "invite">, cookie: string | undefined): boolean {
  const expected = passcodeProof(link);
  if (!expected) return true;
  if (!cookie || cookie.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(expected));
}

export function cookiePath(token: string): string {
  return `/r/${token}`;
}

export async function viewLink(token: string, cookie: string | undefined, now = new Date()): Promise<LinkView> {
  const link = await links.byToken(token);
  if (!link) return { kind: "unknown" };
  const state: LinkState = linkState(link.invite, now);
  if (state === "revoked" || state === "notOpen" || state === "closed") return { kind: state, link };
  if (!proofMatches(link, cookie)) return { kind: "passcode", link };
  return { kind: "open", link };
}

// The passcode as typed: the proof to set as the cookie, or null when it is wrong or the
// link needs none.
export async function checkPasscode(token: string, typed: unknown): Promise<string | null> {
  const link = await links.byToken(token);
  if (!link || !link.invite.passcodeHash || typeof typed !== "string") return null;
  return verifyPasscode(typed.trim(), link.invite.passcodeHash) ? passcodeProof(link) : null;
}
