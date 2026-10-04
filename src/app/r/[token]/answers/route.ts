// One answer (stories/E7-2; E7-3 sends it within a second of the change): PUT
// /r/[token]/answers with JSON { itemId, picked, reason, comment, base, page, seq, after,
// response }.
// 200 { saved, kind, complete, version, writer, writerSeq }; a write the stored answer has
// moved past is 409 { error: "stale", answer, complete, version, writer, writerSeq } with the
// stored answer (E7-3, src/lib/answer-queue.ts). The link must be open
// for this device (404, 403, 409 not open yet, 410 revoked or closed, so a write after a
// revocation is refused with nothing written, E6-4), the device's response started (409),
// the item in its list (422). The answer carries the stored kind and whether it is
// complete, never project data. JSON only, up to 16 KB, as /r/[token]/start
// (src/lib/request-json.ts). No rate limit yet: E11-1 (docs/review-list.md).
import { NextResponse } from "next/server";
import { PASSCODE_COOKIE } from "@/lib/link-access";
import { cookieValue } from "@/lib/request-cookies";
import { readJson } from "@/lib/request-json";
import { DEVICE_COOKIE, saveAnswer } from "@/lib/respondent";
import { RESPONDENT_ERRORS } from "@/lib/respondent-rules";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const headers = { "cache-control": "no-store" };
  const read = await readJson(request);
  if ("status" in read) return NextResponse.json({ error: RESPONDENT_ERRORS.badAnswer }, { status: read.status, headers });
  const result = await saveAnswer(token, { passcode: cookieValue(request, PASSCODE_COOKIE), device: cookieValue(request, DEVICE_COOKIE) }, read.body);
  if ("status" in result) return NextResponse.json({ error: result.error }, { status: result.status, headers });
  if ("stale" in result) return NextResponse.json({ error: "stale", answer: result.stale.answer, complete: result.stale.complete, version: result.stale.version, writer: result.stale.writer, writerSeq: result.stale.writerSeq }, { status: 409, headers });
  return NextResponse.json({ saved: true, kind: result.answer.kind, complete: result.complete, version: result.version, writer: result.writer, writerSeq: result.writerSeq }, { headers });
}
