// The browser side of better-auth (stories/E2-1): createAuthClient from "better-auth/react" and
// the magic link client plugin (better-auth.com/docs/plugins/magic-link, "Add the client
// Plugin"). signIn.magicLink sends the email; signOut ends the session.
import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({ plugins: [magicLinkClient()] });
