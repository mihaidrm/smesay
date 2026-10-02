// The invitation rules shared by the server and the Members screen (stories/E2-4, acceptance 2):
// an invitation is valid as long as the sign-in link it was sent with (stories/E2-1's 15
// minutes), and a workspace sends at most INVITE_LIMIT invitations per INVITE_LIMIT_MINUTES,
// because the invite is sent through better-auth's server API, which the sign-in route's own
// limiter does not cover (node_modules/better-auth/dist/api/index.mjs, onRequestRateLimit runs in
// the handler only). No server import here, so the client side can show the numbers.
import { SIGN_IN_LINK_MINUTES } from "@/lib/mail/sign-in-email";

export const INVITE_VALID_MINUTES = SIGN_IN_LINK_MINUTES;
export const INVITE_LIMIT = 5;
export const INVITE_LIMIT_MINUTES = 10;
