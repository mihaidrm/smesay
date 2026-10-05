// Email 6 of docs/copy/emails.md (stories/E11-2, acceptance 3): the one email the removal job
// sends the owner who deleted a workspace, once everything in it is gone. The shared frame
// (layout.ts, stories/E12-3) with no button: there is nothing to do. origin is the app's own
// address (BETTER_AUTH_URL), for the mark and the privacy link; null leaves both out.
import { formatUtc } from "@/lib/sharing-format";
import { renderEmail, type Email } from "./layout";

export function deletionEmail(workspace: string, deletedAt: Date, origin: string | null): Email {
  return renderEmail({
    origin,
    subject: `${workspace} was deleted`,
    before: [
      { text: "Hi," },
      { text: `Everything in ${workspace} was deleted on ${formatUtc(deletedAt)}.` },
      { text: "Its projects, responses, files and members are removed. Nothing in it can be brought back." },
    ],
  });
}
