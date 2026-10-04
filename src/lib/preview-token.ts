// The preview token of the builder's preview panel (stories/E5-6, acceptance 3 and 4): the
// respondent app opens on /r/[token] for a project's draft when the token is a preview token,
// "p." then the payload and its HMAC-SHA256 under the session secret, both base64url
// (nodejs.org/api/crypto.html, createHmac and timingSafeEqual). It names the project, the
// workspace and the PM it was made for, and lasts one to two hours (made for the current hour,
// valid through the next: src/lib/preview.ts previewSrc); the page also checks that the
// session is that PM's in that workspace (previewAccess). A real link's token is 32 hex characters
// (src/lib/sharing.ts newToken), never "p.", so the two cannot be confused, and every write
// route answers 403 to a preview token: nothing a preview does is stored.
import { createHmac, timingSafeEqual } from "node:crypto";
import { isPreviewToken, PREVIEW_PREFIX } from "@/lib/preview-prefix";

export { isPreviewToken, PREVIEW_PREFIX };

export const PREVIEW_TTL_MS = 60 * 60 * 1000;

export type PreviewClaim = { project: string; ws: string; user: string; exp: number };

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest();


export function previewToken(claim: Omit<PreviewClaim, "exp">, secret: string, now = Date.now()): string {
  const payload = b64(JSON.stringify({ ...claim, exp: now + PREVIEW_TTL_MS }));
  return `${PREVIEW_PREFIX}${payload}.${b64(sign(payload, secret))}`;
}

// Whether the signed-in PM may see the preview a claim names: the claim's PM, in the claim's
// workspace as their current one. Another PM's token is the expired page; the same PM in
// another workspace is told to switch workspace (CLAUDE.md, errors say what to do).
export type PreviewAccess = "ok" | "expired" | "otherWorkspace";
export function previewAccess(claim: PreviewClaim | null, session: { user: string; ws: string | null } | null): PreviewAccess {
  if (!claim || !session || session.user !== claim.user) return "expired";
  return session.ws === claim.ws ? "ok" : "otherWorkspace";
}

// The claim when the token is whole, signed with this secret and not expired; null otherwise.
export function readPreviewToken(token: string, secret: string, now = Date.now()): PreviewClaim | null {
  if (!isPreviewToken(token)) return null;
  const [payload, sig, ...rest] = token.slice(PREVIEW_PREFIX.length).split(".");
  if (!payload || !sig || rest.length > 0) return null;
  const given = Buffer.from(sig, "base64url");
  const expected = sign(payload, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const claim = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<PreviewClaim>;
    if (typeof claim.project !== "string" || typeof claim.ws !== "string" || typeof claim.user !== "string" || typeof claim.exp !== "number") return null;
    return claim.exp > now ? (claim as PreviewClaim) : null;
  } catch {
    return null;
  }
}
