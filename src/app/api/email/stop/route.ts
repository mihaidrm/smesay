// The one-click stop of RFC 8058 (stories/E16-1, acceptance 5): a mail client POSTs to the
// List-Unsubscribe address with the body "List-Unsubscribe=One-Click" and the kind stops at
// once; the token and the kind are in the query, as the header carries them. A token not on
// file is 404. A GET (a person who opened the header's address) goes to the page.
import { NextResponse } from "next/server";
import { stopEmails } from "@/lib/email-prefs";

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const stopped = await stopEmails(url.searchParams.get("t"), url.searchParams.get("k"));
  return new Response(stopped ? "Stopped." : "Not found", { status: stopped ? 200 : 404, headers: { "content-type": "text/plain; charset=utf-8" } });
}

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const page = new URL("/email/stop", url.origin);
  for (const key of ["t", "k"]) { const v = url.searchParams.get(key); if (v) page.searchParams.set(key, v); }
  return NextResponse.redirect(page, 303);
}
