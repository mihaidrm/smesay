// Runs before every request but Next's static files and the public assets.
//
// Every response it lets through or makes carries the content security policy with a nonce
// made for this request (stories/E11-5, acceptance 2; src/lib/security-headers.ts): the nonce
// goes on the request's headers too, where Next reads it while rendering and puts it on its own
// scripts (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md, "Adding a
// nonce with Proxy"). 16 random bytes, as every token (CLAUDE.md).
//
// /app (stories/E2-1, acceptance 5): a request without a session cookie goes to the sign-in page
// with the full path it wanted in `next`. This is the quick check Next's authentication guide
// calls optimistic (node_modules/next/dist/docs/01-app/02-guides/authentication.md, "Optimistic
// checks with Proxy"); every page under /app still verifies the session against the database
// through requireSession() (src/lib/session.ts), because a layout alone does not guard its pages
// (same guide, "Layouts and auth checks"). getSessionCookie reads the cookie by name, with or
// without the __Secure- prefix: node_modules/better-auth/dist/cookies/index.mjs.
//
// /r, /brand and /sample (stories/E11-1, acceptances 1 and 5; E12-4): 100 requests a minute per address
// (src/lib/ratelimit.ts). Over it, 429 with Retry-After (developer.mozilla.org/docs/Web/HTTP/
// Reference/Headers/Retry-After): a page in plain HTML for a page request, JSON for the
// respondent app's own calls, which keep the answer queued and retry (src/lib/answer-queue.ts
// reads any other status as "retry"). Proxy runs on the Node.js runtime by default (proxy.md,
// "Runtime"). That it shares the process's memory across requests is unverified: proxy.md says
// not to rely on shared modules or globals; under `next start` the e2e tests show the counts
// hold (docs/review-list.md). A request without X-Forwarded-For is not counted
// (src/lib/ratelimit.ts, LOCAL).
// File convention: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// proxy.md.
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { addressOf, LOCAL, minutesOf, respondentLimit } from "@/lib/ratelimit";
import { RATE_LIMIT_COPY, limitedPage } from "@/lib/ratelimit-copy";
import { contentSecurityPolicy } from "@/lib/security-headers";
import { PLAUSIBLE_ORIGIN, plausibleConfig } from "@/lib/plausible";
import { ERROR_PAGE_COPY, maintenanceMinutes, maintenancePage } from "@/lib/error-pages-copy";

const CSP = "content-security-policy";
const nonceOf = (csp: string) => csp.match(/'nonce-([^']+)'/)?.[1] ?? "";

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const csp = contentSecurityPolicy({ nonce, dev: process.env.NODE_ENV === "development", https: request.nextUrl.protocol === "https:", analytics: plausibleConfig() && !isRespondentPath(request.nextUrl.pathname) ? PLAUSIBLE_ORIGIN : null });
  const response = process.env.MAINTENANCE === "1" ? maintenance(request) : route(request, csp);
  response.headers.set(CSP, csp);
  return response;
}

// MAINTENANCE=1 (stories/E11-6, acceptance 1): every request gets 503 with Retry-After
// (developer.mozilla.org/docs/Web/HTTP/Reference/Status/503): a page for a page request, JSON for
// the respondent app's calls, whose answer queue keeps the answers and retries (src/lib/
// answer-queue.ts reads any other status as "retry"). MAINTENANCE_MINUTES sets the minutes shown.
function maintenance(request: NextRequest): NextResponse {
  const minutes = maintenanceMinutes(process.env.MAINTENANCE_MINUTES);
  const headers = { "retry-after": String(minutes * 60), "cache-control": "no-store" };
  if (request.method === "GET" && (request.headers.get("accept") ?? "").includes("text/html")) return new NextResponse(maintenancePage(minutes), { status: 503, headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
  return NextResponse.json({ error: ERROR_PAGE_COPY.maintenanceLine(minutes), code: "maintenance" }, { status: 503, headers });
}

// The request goes on with the policy on its headers, for Next to read the nonce.
function next(request: NextRequest, csp: string): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(CSP, csp);
  headers.set("x-nonce", nonceOf(csp));
  return NextResponse.next({ request: { headers } });
}

// The respondent pages and the visitors' sample never load Plausible (stories/E13-3), so their
// policy does not allow sending to it either.
const isRespondentPath = (path: string) => path.startsWith("/r/") || path === "/sample" || path.startsWith("/brand/");

function route(request: NextRequest, csp: string): NextResponse {
  const path = request.nextUrl.pathname;
  // The visitors' sample is limited as a respondent route (stories/E12-4, acceptance 3).
  if (path.startsWith("/r/") || path.startsWith("/brand/") || path === "/sample") {
    const address = addressOf(request.headers);
    // A server action (the passcode form, the only one on /r) has its own limit
    // (src/lib/link-access.ts), and a 429 here would reach Next's client as an unexpected reply.
    // Next takes a server action only as a POST with the next-action header to a page
    // (node_modules/next/dist/server/lib/server-action-request-meta.js); the link's page is
    // /r/[token] and nothing under it, so only that shape is let through.
    const serverAction = request.method === "POST" && request.headers.has("next-action") && /^\/r\/[^/]+\/?$/.test(path);
    if (address === LOCAL || serverAction) return next(request, csp);
    const verdict = respondentLimit.hit(address, Date.now());
    if (verdict.allowed) return next(request, csp);
    const headers = { "retry-after": String(Math.ceil(verdict.retryAfterMs / 1000)), "cache-control": "no-store" };
    const page = request.method === "GET" && (request.headers.get("accept") ?? "").includes("text/html");
    if (page) return new NextResponse(limitedPage(), { status: 429, headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
    // error is the sentence, as every respondent route's error is (the app shows it as it is).
    return NextResponse.json({ error: RATE_LIMIT_COPY.respondent, code: "rateLimited", waitMinutes: minutesOf(verdict.retryAfterMs) }, { status: 429, headers });
  }
  if (!/^\/app(\/|$)/.test(path) || getSessionCookie(request)) return next(request, csp);
  // A server action under /app without a session cookie goes on to the action, which answers
  // "signed out" so the form keeps its text (stories/E11-6, acceptance 3; src/lib/session.ts
  // signedIn). A redirect here would reach Next's client as a reply it cannot read and replace
  // the page with the error page. A fetch action is a POST with the next-action header
  // (node_modules/next/dist/server/lib/server-action-request-meta.js, isFetchAction); a form
  // posted before hydration (multipart, no header) still goes to sign-in, as before. Every
  // action checks the session itself (SECURITY.md, Auth and sessions).
  if (request.method === "POST" && request.headers.has("next-action")) return next(request, csp);
  const wanted = path + request.nextUrl.search;
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", wanted);
  return NextResponse.redirect(signIn);
}

// Every path but Next's built files, its image route, the favicon and the public assets
// (proxy.md, "Matcher"; the CSP guide's matcher, without its prefetch exception, so a prefetched
// page carries the policy too).
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"] };
