// The Wrap up's answers as the respondent writes them (stories/E7-5; saved within a second,
// as the cards are, CLAUDE.md respondent side): PUT /r/[token]/wrap with JSON { response,
// confidence (1 to 5 or null), closingAnswer, missing: { text, area, value } | null }. 200
// { saved: true }; refusals { error } with the link's statuses (404, 403, 409 not open yet,
// 410), 409 when this device has no response or not the one named, 422 with the sentence
// (a confidence off the scale, text too long, a missing item outside the list's areas or the
// scale). JSON only, up to 16 KB (src/lib/request-json.ts). The checks and the write are
// saveWrap (src/lib/respondent.ts). No rate limit yet: E11-1 (docs/review-list.md).
import { NextResponse } from "next/server";
import { PASSCODE_COOKIE } from "@/lib/link-access";
import { cookieValue } from "@/lib/request-cookies";
import { readJson } from "@/lib/request-json";
import { DEVICE_COOKIE, saveWrap } from "@/lib/respondent";
import { RESPONDENT_ERRORS } from "@/lib/respondent-rules";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const headers = { "cache-control": "no-store" };
  const read = await readJson(request);
  if ("status" in read) return NextResponse.json({ error: RESPONDENT_ERRORS.badShape }, { status: read.status, headers });
  const result = await saveWrap(token, { passcode: cookieValue(request, PASSCODE_COOKIE), device: cookieValue(request, DEVICE_COOKIE) }, read.body);
  if ("status" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers });
  return NextResponse.json({ saved: true }, { headers });
}
