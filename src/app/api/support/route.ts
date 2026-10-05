// POST /api/support (stories/E12-5): the landing page's question bubble. JSON only, up to
// 16 KB (src/lib/request-json.ts). The checks, the limits and the email are src/lib/support.ts;
// this route reads the body and the connection, and sends. Answers: 200 { sent: true } (also
// for a filled hidden field, which mails nothing), 400 { problem } for a field the panel
// names, 429 { tooMany: true }, 404 when NEXT_PUBLIC_SUPPORT_EMAIL is unset (the bubble is
// not shown then), 503 when the mail could not go. Nothing is logged: the address and the
// question go only into the email (acceptance 4). The connection is the last address of
// x-forwarded-for (src/lib/ratelimit.ts addressOf, as every limit in the app reads it).
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { addressOf } from "@/lib/ratelimit";
import { readJson } from "@/lib/request-json";
import { readSupport, supportEmail, takeSupport } from "@/lib/support";

export const dynamic = "force-dynamic";

const headers = { "cache-control": "no-store" };

export async function POST(request: Request) {
  const to = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  if (!to) return NextResponse.json({ problem: "off" }, { status: 404, headers });
  const read = await readJson(request);
  if ("status" in read) return NextResponse.json({ problem: "body" }, { status: read.status, headers });
  const checked = readSupport(read.body);
  if ("problem" in checked) return NextResponse.json({ problem: checked.problem }, { status: 400, headers });
  const { input } = checked;
  if (input.trap) return NextResponse.json({ sent: true }, { headers });
  const now = new Date();
  const verdict = takeSupport(input.email, addressOf(request.headers), now.getTime());
  if (!verdict.allowed) return NextResponse.json({ tooMany: true }, { status: 429, headers: { ...headers, "retry-after": String(Math.ceil(verdict.retryAfterMs / 1000)) } });
  const origin = (process.env.BETTER_AUTH_URL ?? new URL(request.url).origin).replace(/\/+$/, "");
  try {
    await sendMail(supportEmail(to, input, origin, now));
  } catch {
    return NextResponse.json({ problem: "mail" }, { status: 503, headers });
  }
  return NextResponse.json({ sent: true }, { headers });
}
