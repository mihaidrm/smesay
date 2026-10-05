// POST /api/support (stories/E12-5): the landing page's question bubble. JSON only, up to
// 16 KB (src/lib/request-json.ts). The checks, the limits and the email are src/lib/support.ts;
// this route counts the connection, reads the body and sends. Answers: 200 { sent: true } (also
// for a filled hidden field, which mails nothing), 400 { problem } for a field the panel names,
// 413 or 415 { problem: "body" }, 429 { tooMany: "connection" | "address" } with Retry-After,
// 404 { problem: "off" } when NEXT_PUBLIC_SUPPORT_EMAIL is empty (the bubble is not shown then),
// 503 { problem: "mail" } when the mail could not go, with both counts given back. Next.js puts
// NEXT_PUBLIC_SUPPORT_EMAIL into the server code too when `next build` runs
// (node_modules/next/dist/docs/01-app/02-guides/environment-variables.md, "Bundling
// Environment Variables for the Browser"), so the page and this route always agree, and a new
// address needs a new build. Nothing is logged: the address and the question go only into the
// email (acceptance 4). The connection is the last X-Forwarded-For address (addressOf), as every
// limit in the app reads it.
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { addressOf } from "@/lib/ratelimit";
import { readJson } from "@/lib/request-json";
import { giveBack, readSupport, supportEmail, takeAddress, takeConnection } from "@/lib/support";

export const dynamic = "force-dynamic";

const headers = { "cache-control": "no-store" };
const tooMany = (who: "connection" | "address", retryAfterMs: number) => NextResponse.json({ tooMany: who }, { status: 429, headers: { ...headers, "retry-after": String(Math.ceil(retryAfterMs / 1000)) } });

export async function POST(request: Request) {
  const to = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  if (!to) return NextResponse.json({ problem: "off" }, { status: 404, headers });
  const connection = addressOf(request.headers);
  const now = new Date();
  const byConnection = takeConnection(connection, now.getTime());
  if (!byConnection.allowed) return tooMany("connection", byConnection.retryAfterMs);
  const read = await readJson(request);
  if ("status" in read) return NextResponse.json({ problem: "body" }, { status: read.status, headers });
  const checked = readSupport(read.body);
  if ("problem" in checked) return NextResponse.json({ problem: checked.problem }, { status: 400, headers });
  const { input } = checked;
  if (input.trap) return NextResponse.json({ sent: true }, { headers });
  const byAddress = takeAddress(input.email, now.getTime());
  if (!byAddress.allowed) return tooMany("address", byAddress.retryAfterMs);
  const origin = (process.env.BETTER_AUTH_URL ?? new URL(request.url).origin).replace(/\/+$/, "");
  try {
    await sendMail(supportEmail(to, input, origin, now));
  } catch {
    giveBack(input.email, connection);
    return NextResponse.json({ problem: "mail" }, { status: 503, headers });
  }
  return NextResponse.json({ sent: true }, { headers });
}
