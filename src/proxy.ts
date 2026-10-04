// Runs before /app, the respondent routes (/r) and the public logo route (/brand).
//
// /app (stories/E2-1, acceptance 5): a request without a session cookie goes to the sign-in page
// with the full path it wanted in `next`. This is the quick check Next's authentication guide
// calls optimistic (node_modules/next/dist/docs/01-app/02-guides/authentication.md, "Optimistic
// checks with Proxy"); every page under /app still verifies the session against the database
// through requireSession() (src/lib/session.ts), because a layout alone does not guard its pages
// (same guide, "Layouts and auth checks"). getSessionCookie reads the cookie by name, with or
// without the __Secure- prefix: node_modules/better-auth/dist/cookies/index.mjs.
//
// /r and /brand (stories/E11-1, acceptances 1 and 5): 100 requests a minute per address
// (src/lib/ratelimit.ts). Over it, 429 with Retry-After (developer.mozilla.org/docs/Web/HTTP/
// Reference/Headers/Retry-After): a page in plain HTML for a page request, JSON for the
// respondent app's own calls, which keep the answer queued and retry (src/lib/answer-queue.ts
// reads any other status as "retry"). Proxy runs on the Node.js runtime by default (proxy.md,
// "Runtime"), in the app's process, so the counts in memory are the app's. A request without
// X-Forwarded-For is not counted (src/lib/ratelimit.ts, LOCAL).
// File convention: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// proxy.md.
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { addressOf, LOCAL, minutesOf, respondentLimit } from "@/lib/ratelimit";
import { RATE_LIMIT_COPY, limitedPage } from "@/lib/ratelimit-copy";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/r/") || path.startsWith("/brand/")) {
    const address = addressOf(request.headers);
    if (address === LOCAL) return NextResponse.next();
    const verdict = respondentLimit.hit(address, Date.now());
    if (verdict.allowed) return NextResponse.next();
    const headers = { "retry-after": String(Math.ceil(verdict.retryAfterMs / 1000)), "cache-control": "no-store" };
    const page = request.method === "GET" && (request.headers.get("accept") ?? "").includes("text/html");
    if (page) return new NextResponse(limitedPage(), { status: 429, headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
    return NextResponse.json({ error: "rateLimited", message: RATE_LIMIT_COPY.respondent, waitMinutes: minutesOf(verdict.retryAfterMs) }, { status: 429, headers });
  }
  if (getSessionCookie(request)) return NextResponse.next();
  const wanted = path + request.nextUrl.search;
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", wanted);
  return NextResponse.redirect(signIn);
}

export const config = { matcher: ["/app/:path*", "/r/:path*", "/brand/:path*"] };
