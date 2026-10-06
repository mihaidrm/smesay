// Visitor analytics with Plausible (stories/E13-3), off until the launch gate. Two variables,
// both from the site's settings in Plausible (docs/accounts.md step 11): PLAUSIBLE_DOMAIN, the
// site's domain as added there, and PLAUSIBLE_SCRIPT_SRC, the src of the script tag in the
// site's snippet ("you can find your JavaScript snippet" under the site's General settings,
// Tracking: plausible.io/docs/plausible-script). With either missing nothing loads and nothing
// is sent (decision 0006). Plausible sets no cookies and keeps no IP address: it counts a
// visitor from a hash of a daily salt, the site, the IP address and the user agent, and deletes
// the salt every 24 hours (plausible.io/data-policy).
//
// Goals: a click is sent from the page with plausible(name) (plausible.io/docs/
// custom-event-goals); a step the server sees (the first project, the first published
// instrument) is sent to the Events API, POST https://plausible.io/api/event with the domain,
// the name and the page's URL, and the visitor's User-Agent and X-Forwarded-For, which
// Plausible needs to count the visitor (plausible.io/docs/events-api).
import { headers } from "next/headers";
import { addressOf, LOCAL } from "@/lib/ratelimit";
import { after } from "next/server";
import { log } from "@/lib/log";

export const PLAUSIBLE_ORIGIN = "https://plausible.io";
const EVENT_URL = `${PLAUSIBLE_ORIGIN}/api/event`;
const SEND_TIMEOUT_MS = 3_000;

export type PlausibleConfig = { domain: string; scriptSrc: string };

export function plausibleConfig(env: Record<string, string | undefined> = process.env): PlausibleConfig | null {
  const domain = env.PLAUSIBLE_DOMAIN?.trim();
  const scriptSrc = env.PLAUSIBLE_SCRIPT_SRC?.trim();
  if (!domain || !scriptSrc || !scriptSrc.startsWith(`${PLAUSIBLE_ORIGIN}/js/`)) return null;
  return { domain, scriptSrc };
}

// The goals' names, as they are set up in Plausible.
export const GOALS = { startFree: "Start free", trySample: "Try the sample", signUp: "Sign up", firstProject: "First project", firstPublished: "First validation published" } as const;
export type Goal = (typeof GOALS)[keyof typeof GOALS];
// Sign up counts on the workspace step only within this long of the account's creation.
export const SIGN_UP_WINDOW_MS = 30 * 60_000;
export const isFreshSignUp = (createdAt: Date | string, now = Date.now()): boolean => now - new Date(createdAt).getTime() < SIGN_UP_WINDOW_MS;

export type GoalRequest = { url: string; userAgent: string | null; forwardedFor: string | null };

export function goalBody(config: PlausibleConfig, name: Goal, url: string): string {
  return JSON.stringify({ domain: config.domain, name, url });
}

// Sends a goal after the response, so the person never waits on Plausible (after():
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md); a failure is
// logged without the request's values. Outside a request (a script, a test) it sends at once.
// The send gives up after 3 seconds (AbortSignal.timeout: developer.mozilla.org/docs/Web/API/
// AbortSignal/timeout_static).
// Without the visitor's address Plausible would see the server's and drop the event (its bot
// filter, plausible.io/docs/events-api), so nothing is sent then.
export function sendGoal(name: Goal, request: GoalRequest, send: typeof fetch = fetch): void {
  const config = plausibleConfig();
  if (!config || !request.userAgent || !request.forwardedFor) return;
  const go = async () => {
    try {
      const headers: Record<string, string> = { "content-type": "application/json", "user-agent": request.userAgent! };
      if (request.forwardedFor) headers["x-forwarded-for"] = request.forwardedFor;
      const response = await send(EVENT_URL, { method: "POST", headers, body: goalBody(config, name, request.url), signal: AbortSignal.timeout(SEND_TIMEOUT_MS) });
      if (!response.ok) log("warn", "A Plausible goal was not taken.", { detail: name, reason: String(response.status) });
    } catch (error) {
      log("warn", "A Plausible goal could not be sent.", { detail: name, error: error instanceof Error ? error.name : "error" });
    }
  };
  try { after(go); } catch { void go(); }
}

// The visitor's request as Plausible needs it, for a goal sent from a server action: the page
// the step happened on (on the app's address, BETTER_AUTH_URL), the user agent and the
// forwarded address the host set.
export async function goalRequest(path: string): Promise<GoalRequest> {
  const h = await headers();
  // The client's address is the last entry, the one the host appends (SECURITY.md, Rate
  // limits; src/lib/ratelimit.ts addressOf); the rest of the chain is not passed on.
  const ip = addressOf(h);
  return { url: new URL(path, process.env.BETTER_AUTH_URL ?? "http://localhost:3000").toString(), userAgent: h.get("user-agent"), forwardedFor: ip === LOCAL ? null : ip };
}
