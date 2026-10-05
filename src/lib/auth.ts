// better-auth server instance (stories/E2-1, E2-2). Magic link sign-in (E2-1) and "Continue
// with Google" (E2-2; Microsoft and Apple after launch, decision 0034). Sources: betterAuth and the drizzle adapter,
// better-auth.com/docs/installation and /docs/adapters/drizzle; the magic link plugin and its
// options (expiresIn in seconds, sendMagicLink, storeToken "hashed" so a database read does not
// yield working links), better-auth.com/docs/plugins/magic-link and node_modules/better-auth/
// dist/plugins/magic-link/index.d.mts; session.expiresIn and updateAge in seconds, baseURL,
// secret and advanced.disableOriginCheck, node_modules/@better-auth/core/dist/types/
// init-options.d.mts; nextCookies so a server action can set the cookie,
// node_modules/better-auth/dist/integrations/next-js.d.mts.
//
// Cookies are httpOnly and SameSite=Lax; Secure (with the __Secure- name prefix) follows the
// scheme of the base URL, not NODE_ENV (node_modules/better-auth/dist/cookies/index.mjs,
// createCookieGetter). The base URL is therefore required, and a production process refuses an
// http one unless it is localhost: without a base URL the magic link and the trusted origin
// would follow the request's Host header (node_modules/better-auth/dist/auth/base.mjs,
// getBaseURL from the request).
//
// Google (stories/E2-2): socialProviders.google with clientId and clientSecret
// (node_modules/@better-auth/core/src/social-providers/google.ts, GoogleOptions); better-auth
// sends state and a PKCE code verifier itself and checks them on the callback
// (node_modules/better-auth/dist/api/routes/callback.mjs, parseState). The provider is
// configured only when both variables exist; without them the button is hidden and the server
// log names the variable (acceptance 4). One email is one user row (acceptance 2): better-auth
// links a Google sign-in to the existing user when Google's email_verified claim is true and
// the local row's email is verified (node_modules/better-auth/dist/oauth2/link-account.mjs,
// handleOAuthUserInfo; the magic link marks the email verified, dist/plugins/magic-link/
// index.mjs). An unverified Google email is refused in both directions (acceptance 3): for
// an existing user, better-auth answers account_not_linked; for a new email, the
// databaseHooks.user.create.before hook below returns false (init-options.d.mts: "if the hook
// returns false, the user will not be created"), so no row and no session exist, and the
// provider's requireEmailVerification (node_modules/@better-auth/core/src/oauth2/
// oauth-provider.ts) withholds the session as a second guard. Every refusal, a cancel at
// Google (access_denied) and a state error (state_mismatch, state_not_found) land on
// GOOGLE_ERROR_PATH: the first two through errorCallbackURL (dist/oauth2/errors.mjs,
// redirectOnError), the state errors through onAPIError.errorURL (dist/api/routes/
// callback.mjs, defaultErrorURL). The ?error code is not shown.
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendMail } from "@/lib/mail";
import { SIGN_IN_LINK_MINUTES, signInEmail } from "@/lib/mail/templates/sign-in";
import { addressOf, LOCAL, minutesOf, signInLimit } from "@/lib/ratelimit";
import { SIGN_IN_COPY } from "@/lib/sign-in-copy";
import { track } from "@/lib/analytics";
import { log } from "@/lib/log";

const DAY = 60 * 60 * 24;
export const SESSION_DAYS = 30;

export type AuthEnv = { baseURL: string; secret: string; google: { clientId: string; clientSecret: string } | null };

export type EnvLike = { BETTER_AUTH_URL?: string; BETTER_AUTH_SECRET?: string; NODE_ENV?: string; GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string };

export const GOOGLE_ERROR_PATH = "/sign-in/google-failed";

export function readAuthEnv(env: EnvLike = process.env): AuthEnv {
  const baseURL = env.BETTER_AUTH_URL;
  const secret = env.BETTER_AUTH_SECRET;
  for (const [name, value] of [["BETTER_AUTH_URL", baseURL], ["BETTER_AUTH_SECRET", secret]] as const) {
    if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in (docs/setup.md).`);
  }
  // Secure is off on http://localhost only (stories/E2-1, acceptance 4): CI builds and runs the
  // production server there, and so does `npm run build` on a laptop.
  if (env.NODE_ENV === "production" && !baseURL!.startsWith("https://") && !isLocalhost(baseURL!)) {
    throw new Error("BETTER_AUTH_URL must start with https:// in production, so the session cookie is Secure.");
  }
  return { baseURL: baseURL!, secret: secret!, google: readGoogleEnv(env) };
}

// Both Google variables, or neither: a half-filled pair is treated as missing and named once.
export function readGoogleEnv(env: EnvLike = process.env, warn: (line: string) => void = (line) => log("warn", line)): AuthEnv["google"] {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (clientId && clientSecret) return { clientId, clientSecret };
  const missing = [!clientId && "GOOGLE_CLIENT_ID", !clientSecret && "GOOGLE_CLIENT_SECRET"].filter(Boolean).join(" and ");
  warn(`${missing} not set: the Google sign-in button is hidden (docs/accounts.md step 6).`);
  return null;
}

function isLocalhost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

const addressOfCtx = (getHeader: (key: string) => string | null) => addressOf(new Headers({ "x-forwarded-for": getHeader("x-forwarded-for") ?? "local" }));
const tooMany = (retryAfterMs: number) => {
  const waitMinutes = minutesOf(retryAfterMs);
  return new APIError("TOO_MANY_REQUESTS", { code: "RATE_LIMITED", message: SIGN_IN_COPY.tooManyFor(waitMinutes), waitMinutes }, { "retry-after": String(Math.ceil(retryAfterMs / 1000)) });
};
const limitSignIn = createAuthMiddleware(async (ctx) => {
  // A call from the app's own server (auth.api.signInMagicLink for a member invitation,
  // src/lib/members.ts) carries no request: the workspace's invite limit applies there.
  if (!ctx.request) return;
  const now = Date.now();
  const ip = addressOfCtx(ctx.getHeader);
  const address = ip === LOCAL ? null : `address:${ip}`;
  if (ctx.path === "/sign-in/magic-link") {
    const email = typeof ctx.body?.email === "string" ? ctx.body.email.trim().toLowerCase().slice(0, 320) : "";
    // The address first: a blocked address is refused before its email is counted.
    const byAddress = address ? signInLimit.attempt(address, now) : null;
    if (byAddress && !byAddress.allowed) throw tooMany(byAddress.retryAfterMs);
    const byEmail = email ? signInLimit.attempt(`email:${email}`, now) : null;
    if (byEmail && !byEmail.allowed) throw tooMany(byEmail.retryAfterMs);
  }
  if (address && ctx.path.startsWith("/callback/")) {
    const verdict = signInLimit.check(address, now);
    if (!verdict.allowed) throw ctx.redirect(`${GOOGLE_ERROR_PATH}?wait=${minutesOf(verdict.retryAfterMs)}`);
  }
});
// A callback failed when it answered an error or sent the person to an error address.
const countFailedCallback = createAuthMiddleware(async (ctx) => {
  if (!ctx.path.startsWith("/callback/")) return;
  const returned = ctx.context.returned;
  const location = ctx.context.responseHeaders?.get("location") ?? (returned instanceof APIError ? new Headers(returned.headers).get("location") : null) ?? "";
  const failed = (returned instanceof APIError && returned.statusCode >= 400) || location.includes("error=") || location.includes(GOOGLE_ERROR_PATH);
  const ip = addressOfCtx(ctx.getHeader);
  if (failed && ip !== LOCAL) signInLimit.attempt(`address:${ip}`, Date.now());
});

export function createAuth({ baseURL, secret, google }: AuthEnv, options: { disableOriginCheck?: boolean } = {}) {
  return betterAuth({
    baseURL,
    secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    socialProviders: google ? { google: { clientId: google.clientId, clientSecret: google.clientSecret, requireEmailVerification: true } } : undefined,
    account: { accountLinking: { enabled: true } },
    onAPIError: { errorURL: `${baseURL}${GOOGLE_ERROR_PATH}` },
    databaseHooks: {
      user: {
        create: {
          // A user row needs a verified email: the magic link verifies it on creation; a social
          // sign-in with an unverified claim creates nothing (stories/E2-2, acceptance 3).
          before: async (user) => (user.emailVerified === true ? undefined : false),
          // The sign-up event (stories/E13-1), after the row is committed: better-auth queues
          // create.after until its transaction ends (node_modules/better-auth/dist/db/
          // with-hooks.mjs, queueAfterTransactionHook).
          after: async (user) => { await track("signed_up", {}, { workspaceId: null, userId: user.id }); },
        },
      },
      // The last sign-in the admin People pages show (stories/E14-3): every new session is a
      // sign-in. A failed write is logged and never stops the sign-in
      // (node_modules/@better-auth/core/dist/types/init-options.d.mts, session.create.after).
      session: {
        create: {
          after: async (session) => {
            try {
              await db.update(schema.user).set({ lastSignInAt: new Date(session.createdAt ?? Date.now()) }).where(eq(schema.user.id, session.userId));
            } catch (error) {
              log("error", "auth:last sign-in not recorded.", { error: error instanceof Error ? error.message : String(error) });
            }
          },
        },
      },
    },
    session: {
      expiresIn: SESSION_DAYS * DAY,
      updateAge: DAY,
      // The current workspace lives on the session row (stories/E2-3, acceptance 4): never set
      // from a request body (input: false), only by src/lib/current-workspace.ts after the
      // membership check. Extending the session schema: better-auth.com/docs/concepts/database,
      // "Extending core schema"; the column is session.current_workspace_id (migration 0002).
      additionalFields: { currentWorkspaceId: { type: "string", required: false, input: false } },
    },
    advanced: { disableOriginCheck: options.disableOriginCheck },
    // Sign-in attempts (stories/E11-1, acceptance 2): 5 per email and 5 per address, then a wait
    // that doubles from one minute (src/lib/ratelimit.ts signInLimit). A magic link request is an
    // attempt; a provider callback counts when it fails, and a blocked address goes to the Google
    // page with the wait. Hooks: node_modules/@better-auth/core/dist/types/init-options.d.mts
    // (hooks.before, hooks.after) and createAuthMiddleware (better-auth/api), whose context has
    // path, body, getHeader and, after the endpoint, context.returned and responseHeaders.
    hooks: { before: limitSignIn, after: countFailedCallback },
    plugins: [
      magicLink({
        expiresIn: SIGN_IN_LINK_MINUTES * 60,
        storeToken: "hashed",
        sendMagicLink: async ({ email, url }) => { await sendMail({ to: email, ...signInEmail(url) }); },
      }),
      nextCookies(),
    ],
  });
}

export const auth = createAuth(readAuthEnv());
