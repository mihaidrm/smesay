// Submit (stories/E7-5): POST /r/[token]/submit with JSON { response, confidence,
// signedOff, signOffText, closingAnswer, missing, base, page, seq, after } (the Wrap up's
// version fields as PUT /r/[token]/wrap takes them). The checks and the write are
// submitResponse (src/lib/respondent.ts): the link open for this device (404, 403, 409 not
// open yet, 410), the response started and the one named (409), the Wrap up changed in
// another window or on another device since the page's values (409 { error: "stale", wrap,
// version, writer, writerSeq, changedSince, submittedAt }), every item complete and the rest
// of the Wrap up (422 with the sentence), the plan's monthly responses (403). JSON only, up to 16 KB
// (src/lib/request-json.ts). The answer is { submittedAt (ISO, UTC; the stored time, at least
// a millisecond after the response's Submit before, E7-6), name (the first name for the
// thanks, or null), version (the Wrap up's) } or { error }. The
// receipt (a personal invite's first Submit) is sent after the reply, with after()
// (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md). Its link
// starts from the app's own address, BETTER_AUTH_URL without a trailing slash, read here
// directly so the respondent side imports nothing of the PM app's sign-in (stories/E7-1,
// technical notes). No rate limit yet: E11-1 (docs/review-list.md).
import { after, NextResponse } from "next/server";
import { PASSCODE_COOKIE } from "@/lib/link-access";
import { cookieValue } from "@/lib/request-cookies";
import { readJson } from "@/lib/request-json";
import { DEVICE_COOKIE, submitResponse } from "@/lib/respondent";
import { RESPONDENT_ERRORS } from "@/lib/respondent-rules";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const headers = { "cache-control": "no-store" };
  const read = await readJson(request);
  if ("status" in read) return NextResponse.json({ error: RESPONDENT_ERRORS.badShape }, { status: read.status, headers });
  const baseUrl = process.env.BETTER_AUTH_URL;
  if (!baseUrl) throw new Error("BETTER_AUTH_URL is not set. Copy .env.example to .env.local and fill it in (docs/setup.md).");
  const result = await submitResponse(token, { passcode: cookieValue(request, PASSCODE_COOKIE), device: cookieValue(request, DEVICE_COOKIE) }, read.body, baseUrl.replace(/\/+$/, ""));
  if ("status" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers });
  if ("stale" in result) return NextResponse.json({ error: "stale", ...result.stale }, { status: 409, headers });
  if (result.receipt) after(result.receipt);
  return NextResponse.json({ submittedAt: result.submittedAt.toISOString(), name: result.name, version: result.version }, { headers });
}
