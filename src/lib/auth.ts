// better-auth server instance (stories/E2-1). Magic link sign-in only in E2-1; Google and
// Microsoft come with E2-2. Sources: betterAuth and the drizzle adapter,
// better-auth.com/docs/installation and /docs/adapters/drizzle; the magic link plugin and its
// options (expiresIn in seconds, sendMagicLink, the 5 per minute rate limit it ships with),
// better-auth.com/docs/plugins/magic-link and node_modules/better-auth/dist/plugins/magic-link/
// index.d.mts; session.expiresIn and updateAge in seconds, node_modules/@better-auth/core/dist/
// types/init-options.d.mts; nextCookies so a server action can set the cookie,
// node_modules/better-auth/dist/integrations/next-js.d.mts. Cookies are httpOnly and secure in
// production by default (better-auth.com/docs/concepts/cookies). BETTER_AUTH_SECRET and
// BETTER_AUTH_URL are read from the environment (init-options.d.mts).
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

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  session: { expiresIn: SESSION_DAYS * DAY, updateAge: DAY },
  plugins: [
    magicLink({
      expiresIn: SIGN_IN_LINK_MINUTES * 60,
      sendMagicLink: async ({ email, url }) => { await sendMail({ to: email, ...signInEmail(url) }); },
    }),
    nextCookies(),
  ],
});
