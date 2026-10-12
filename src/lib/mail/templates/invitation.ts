// Email 10 of docs/copy/emails.md (stories/E16-1, acceptance 4): the workspace invitation, in
// place of the sign-in email when a member invites a person from Settings. The link is
// better-auth's magic link, so the minutes are the sign-in email's (SIGN_IN_LINK_MINUTES).
import { renderEmail, type Email } from "./layout";
import { SIGN_IN_LINK_MINUTES } from "./sign-in";

export type InvitationEmailInput = { inviterName: string; inviterEmail: string; workspaceName: string; url: string };

export function invitationEmail(input: InvitationEmailInput): Email {
  const { inviterName, inviterEmail, workspaceName, url } = input;
  const minutes = SIGN_IN_LINK_MINUTES;
  const inviter = inviterName === inviterEmail ? inviterEmail : `${inviterName} (${inviterEmail})`;
  return renderEmail({
    origin: url,
    subject: `${inviterName} invited you to ${workspaceName} on SMEsay`,
    preheader: `The link works once, for ${minutes} minutes.`,
    before: [
      { text: "Hi," },
      { text: `${inviter} added you to ${workspaceName}, a workspace on SMEsay. SMEsay checks a list of requirements with the people who will use it: the list goes out as a link, and the answers come back as a dashboard.` },
      { text: `Here is your link to sign in. It works once and stops working in ${minutes} minutes.` },
    ],
    button: { label: `Join ${workspaceName}`, url },
    after: [{ text: `If you do not know ${inviterName}, ignore this email. Nobody can sign in without the link.` }],
  });
}
