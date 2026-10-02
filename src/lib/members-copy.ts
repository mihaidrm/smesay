// The Members section's messages (docs/copy/errors.md, "Sign-in and workspace"; docs/copy/
// app.md, "Settings, Members"), shared by the server (src/lib/members.ts) and the screen.
import { INVITE_LIMIT, INVITE_LIMIT_MINUTES, INVITE_VALID_MINUTES } from "@/lib/invites";

export const MEMBERS_COPY = {
  alreadyMember: (email: string) => `${email} is already a member of this workspace.`,
  emptyAddress: "Enter the email address to invite.",
  badAddress: (text: string) => `${text} is not an email address. Check it and try again.`,
  tooMany: `Up to ${INVITE_LIMIT} invites every ${INVITE_LIMIT_MINUTES} minutes. Try again in ${INVITE_LIMIT_MINUTES} minutes.`,
  notSent: (email: string) => `The invite to ${email} was not sent. Check the address and try again.`,
  gone: "This person is no longer a member of this workspace.",
  lastOwner: "This workspace needs at least one owner. Make someone else an owner first.",
  sent: `Invite sent. They get a sign-in link that works once and expires in ${INVITE_VALID_MINUTES} minutes.`,
};
