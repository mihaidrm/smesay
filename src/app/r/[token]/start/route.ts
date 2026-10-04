// Start on About you (stories/E7-1, acceptance 1 and 2): POST /r/[token]/start with JSON
// { fields, perspectives }. The link must be open for this device (src/lib/respondent.ts
// openLinkFor: 404 unknown, 403 sample or passcode, 409 not open yet, 410 revoked or
// closed); the fields are checked against the PM's (422 with the sentence to show). A
// public link's first Start sets the device cookie on the link's path, httpOnly, SameSite
// Lax (developer.mozilla.org/docs/Web/HTTP/Cookies; NextResponse cookies:
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/next-response.md). Only
// JSON is taken, up to 16 KB (src/lib/request-json.ts: 415, 413, 400), so a plain
// cross-site form cannot post here. The answer carries no project data: { ok, response,
// submittedAt, changedSince } (the response's id, which ties this device's queue of unsent
// answers to it, E7-3; when it was last submitted or null, and whether a submitted response
// has changes not submitted again, E7-6) or { error }.
// Rate limited per address in src/proxy.ts (E11-1).
import { NextResponse } from "next/server";
import { isPreviewToken } from "@/lib/preview-token";
import { cookiePath, PASSCODE_COOKIE } from "@/lib/link-access";
import { cookieValue } from "@/lib/request-cookies";
import { readJson } from "@/lib/request-json";
import { DEVICE_COOKIE, DEVICE_COOKIE_SECONDS, startResponse } from "@/lib/respondent";
import { changedSinceSubmit, RESPONDENT_ERRORS } from "@/lib/respondent-rules";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // A preview (stories/E5-6, acceptance 4) never writes.
  if (isPreviewToken(token)) return NextResponse.json({ error: RESPONDENT_ERRORS.preview }, { status: 403, headers: { "cache-control": "no-store" } });
  const read = await readJson(request);
  if ("status" in read) return NextResponse.json({ error: RESPONDENT_ERRORS.badShape }, { status: read.status, headers: { "cache-control": "no-store" } });
  const result = await startResponse(token, { passcode: cookieValue(request, PASSCODE_COOKIE), device: cookieValue(request, DEVICE_COOKIE) }, read.body);
  if ("status" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers: { "cache-control": "no-store" } });
  // changedSince (E7-6): a submitted response with changes not submitted again, a Start that
  // changed the details or the picks included.
  const response = NextResponse.json({ ok: true, response: result.response.id, submittedAt: result.response.submittedAt?.toISOString() ?? null, changedSince: changedSinceSubmit(result.response) }, { headers: { "cache-control": "no-store" } });
  if (result.device) response.cookies.set(DEVICE_COOKIE, result.device, { path: cookiePath(token), httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: DEVICE_COOKIE_SECONDS });
  return response;
}
