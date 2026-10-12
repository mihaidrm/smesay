// Email 7 of docs/copy/emails.md (stories/E16-1, acceptance 1): the closing summary to a
// member of the workspace when a validation's link closes, on the shared frame (layout.ts).
// The counts are the Results page's (src/db/queries/results.ts numbers) and the three items
// with the most disagreement are the Agreement table's, by the agree percent; an item's text
// is cut at 90 characters. Nothing from a respondent's own words is in the email.
import { formatUtc } from "@/lib/sharing-format";
import { greeting, renderEmail, type Email } from "./layout";

export type ClosingEmailInput = {
  memberName: string | null;
  projectName: string;
  workspaceName: string;
  closedAt: Date;
  // The personal invites: how many submitted of how many sent; null when none were sent.
  personal: { submitted: number; invited: number } | null;
  // Responses through the public link; null when there was no public link.
  publicCount: number | null;
  // The items with the most disagreement, up to three, with the agree percent (0 to 100).
  topItems: { text: string; percent: number }[];
  url: string;
  stop: { reason: string; url: string };
};

const cut = (text: string, max = 90) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);
const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

export function closingEmail(input: ClosingEmailInput): Email {
  const { memberName, projectName, personal, publicCount, topItems, url, stop } = input;
  const closed = formatUtc(input.closedAt);
  const subject = personal
    ? `${projectName} closed: ${personal.submitted} of ${personal.invited} submitted`
    : `${projectName} closed: ${publicCount ?? 0} ${publicCount === 1 ? "response" : "responses"}`;
  const counts = [
    personal ? `${personal.submitted} of the ${people(personal.invited)} you invited submitted.` : "",
    publicCount !== null ? (personal ? `${publicCount} more answered through the public link.` : `${people(publicCount)} answered through the public link.`) : "",
  ].filter(Boolean).join(" ");
  const items = topItems.map((it, i) => `${i + 1}. ${cut(it.text)} (${it.percent}% agree)`);
  return renderEmail({
    origin: url,
    subject,
    preheader: `The link closed on ${closed}.`,
    before: [
      greeting(memberName),
      { text: `The link for ${projectName} closed on ${closed}.` },
      { text: counts },
      ...(items.length ? [{ text: `The items with the most disagreement:\n${items.join("\n")}`, preLine: true }] : []),
    ],
    button: { label: "See the results", url },
    after: [{ text: "Write actions on the Actions tab turns the disagreements into a list of things to decide." }],
    stop,
  });
}
