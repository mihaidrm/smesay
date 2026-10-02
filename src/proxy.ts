// Runs before every /app request (stories/E2-1, acceptance 5): a request without a session
// cookie goes to the sign-in page with the full path it wanted in `next`. This is the quick
// check Next's authentication guide calls optimistic (node_modules/next/dist/docs/01-app/
// 02-guides/authentication.md, "Optimistic checks with Proxy"); every page under /app still
// verifies the session against the database through requireSession() (src/lib/session.ts),
// because a layout alone does not guard its pages (same guide, "Layouts and auth checks").
// File convention: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// proxy.md. getSessionCookie reads the cookie by name, with or without the __Secure- prefix:
// node_modules/better-auth/dist/cookies/index.mjs.
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  const wanted = request.nextUrl.pathname + request.nextUrl.search;
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", wanted);
  return NextResponse.redirect(signIn);
}

export const config = { matcher: "/app/:path*" };
