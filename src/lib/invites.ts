// An invitation is valid as long as the sign-in link it was sent with (stories/E2-4,
// acceptance 2; the link is stories/E2-1's 15 minutes). No server import here, so the client
// side of the Members section can show the number.
import { SIGN_IN_LINK_MINUTES } from "@/lib/mail/sign-in-email";

export const INVITE_VALID_MINUTES = SIGN_IN_LINK_MINUTES;
