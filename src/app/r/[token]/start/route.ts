// Start on About you (stories/E7-1, acceptance 1 and 2): POST /r/[token]/start with JSON
// { fields, perspectives }. The link must be open for this device (src/lib/respondent.ts
// openLinkFor: 404 unknown, 403 sample or passcode, 409 not open yet, 410 revoked or
// closed); the fields are checked against the PM's (422 with the sentence to show). A
// public link's first Start sets the device cookie on the link's path, httpOnly, SameSite
// Lax (developer.mozilla.org/docs/Web/HTTP/Cookies; NextResponse cookies:
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/next-response.md). Only
// JSON is taken, up to 16 KB (src/lib/request-json.ts: 415, 413, 400), so a plain
// cross-site form cannot post here. The answer carries no project data: { ok } or { error }.
// No rate limit yet: E11-1 adds the respondent routes' limit (docs/review-list.md).
import { NextResponse } from "next/server";
import { cookiePath, PASSCODE_COOKIE } from "@/lib/link-access";
import { cookieValue } from "@/lib/request-cookies";
import { readJson } from "@/lib/request-json";
import { DEVICE_COOKIE, DEVICE_COOKIE_SECONDS, startResponse } from "@/lib/respondent";
import { RESPONDENT_ERRORS } from "@/lib/respondent-rules";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const read = await readJson(request);
  if ("status" in read) return NextResponse.json({ error: RESPONDENT_ERRORS.badShape }, { status: read.status, headers: { "cache-control": "no-store" } });
  const result = await startResponse(token, { passcode: cookieValue(request, PASSCODE_COOKIE), device: cookieValue(request, DEVICE_COOKIE) }, read.body);
  if ("status" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "cache-control": "no-store" } });
  const response = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  if (result.device) response.cookies.set(DEVICE_COOKIE, result.device, { path: cookiePath(token), httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: DEVICE_COOKIE_SECONDS });
  return response;
}
