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
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendMail } from "@/lib/mail";
import { SIGN_IN_LINK_MINUTES, signInEmail } from "@/lib/mail/sign-in-email";

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
export function readGoogleEnv(env: EnvLike = process.env, log: (line: string) => void = (line) => console.warn(line)): AuthEnv["google"] {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (clientId && clientSecret) return { clientId, clientSecret };
  const missing = [!clientId && "GOOGLE_CLIENT_ID", !clientSecret && "GOOGLE_CLIENT_SECRET"].filter(Boolean).join(" and ");
  log(`${missing} not set: the Google sign-in button is hidden (docs/accounts.md step 6).`);
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
