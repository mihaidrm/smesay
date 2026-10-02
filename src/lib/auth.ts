// better-auth server instance (stories/E2-1). Magic link sign-in only in E2-1; Google and
// Microsoft come with E2-2. Sources: betterAuth and the drizzle adapter,
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

export type AuthEnv = { baseURL: string; secret: string };

export type EnvLike = { BETTER_AUTH_URL?: string; BETTER_AUTH_SECRET?: string; NODE_ENV?: string };

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
  return { baseURL: baseURL!, secret: secret! };
}

function isLocalhost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function createAuth({ baseURL, secret }: AuthEnv, options: { disableOriginCheck?: boolean } = {}) {
  return betterAuth({
    baseURL,
    secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    session: { expiresIn: SESSION_DAYS * DAY, updateAge: DAY },
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
