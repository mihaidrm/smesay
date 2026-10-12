// Email 8 of docs/copy/emails.md (stories/E16-1, acceptance 2): to a member of the workspace
// on the Submit that completes the personal invites of a validation, on the shared frame.
import { formatUtc } from "@/lib/sharing-format";
import { greeting, renderEmail, type Email } from "./layout";

export type CompleteEmailInput = {
  memberName: string | null;
  projectName: string;
  invited: number;
  // The link's close date; null when the invites carry none.
  closesAt: Date | null;
  // Whether a public link is still open beside the personal invites.
  publicOpen: boolean;
  url: string;
  stop: { reason: string; url: string };
};

export function completeEmail(input: CompleteEmailInput): Email {
  const { memberName, projectName, invited, closesAt, publicOpen, url, stop } = input;
  const people = `${invited} ${invited === 1 ? "person" : "people"}`;
  const closing = closesAt
    ? `The link closes on ${formatUtc(closesAt)}; you can close it now from Share, or leave it open for changes until then.`
    : "The link stays open for changes until you close it from Share.";
  return renderEmail({
    origin: url,
    subject: `Everyone has submitted on ${projectName}`,
    preheader: `All ${people} you invited have submitted.`,
    before: [
      greeting(memberName),
      { text: `All ${people} you invited to ${projectName} have submitted. ${closing}${publicOpen ? " The public link stays open until then." : ""}` },
    ],
    button: { label: "See the results", url },
    stop,
  });
}
