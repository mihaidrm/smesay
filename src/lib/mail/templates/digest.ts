// Email 9 of docs/copy/emails.md (stories/E16-1, acceptance 3): the daily digest a member
// turned on, one line per open validation with a new submission in the last day, on the
// shared frame. Sent only on a day with something new.
import { formatUtc } from "@/lib/sharing-format";
import { greeting, renderEmail, type Email } from "./layout";

export type DigestRow = { projectName: string; workspaceName: string; fresh: number; submitted: number; invited: number; closesAt: Date | null; url: string };
export type DigestEmailInput = { memberName: string | null; rows: DigestRow[]; stop: { reason: string; url: string } };

export function digestEmail(input: DigestEmailInput): Email {
  const { memberName, rows, stop } = input;
  const fresh = rows.reduce((n, r) => n + r.fresh, 0);
  const responses = `${fresh} new ${fresh === 1 ? "response" : "responses"}`;
  const subject = rows.length === 1 ? `${responses} since yesterday on ${rows[0].projectName}` : `${responses} since yesterday across ${rows.length} validations`;
  const lines = rows.map((r) => {
    const invited = r.invited > 0 ? `${r.submitted} of ${r.invited} submitted` : `${r.submitted} submitted`;
    const closes = r.closesAt ? `closes on ${formatUtc(r.closesAt)}` : "no close date";
    return `${r.projectName} (${r.workspaceName}): ${r.fresh} new, ${invited}, ${closes}.`;
  });
  return renderEmail({
    origin: rows[0].url,
    subject,
    preheader: lines[0],
    before: [
      greeting(memberName),
      { text: "In the last day:" },
      { text: lines.join("\n"), preLine: true },
    ],
    button: { label: "See the results", url: rows[0].url },
    stop,
  });
}
