// Email 2 of docs/copy/emails.md (the personal invite, stories/E6-2; template stories/E12-3) on
// the shared frame (layout.ts). The PM's intro from Build is cut to three lines. The close
// instant is written in UTC (src/lib/sharing-format.ts formatUtc), the zone named. The minutes
// estimate is minutesFor() in src/lib/invitees-rules.ts, shared with the reminder (E6-3).
import { formatUtc } from "@/lib/sharing-format";
import { renderEmail, type Email } from "./layout";

// opensAt: only when the link opens later than the send (the line "It opens on ...").
export type InviteEmailInput = { pmName: string; workspaceName: string; projectName: string; respondentName: string | null; itemCount: number; minutes: number; intro: string | null; url: string; opensAt?: Date | null; closesAt: Date | null };

export function inviteEmail(input: InviteEmailInput): Email {
  const { pmName, workspaceName, projectName, itemCount, minutes, url, closesAt } = input;
  const intro = (input.intro ?? "").split("\n").filter((l) => l.trim()).slice(0, 3).join("\n");
  const list = `a list of ${itemCount} ${itemCount === 1 ? "requirement" : "requirements"}`;
  const closes = [input.opensAt ? `It opens on ${formatUtc(input.opensAt)}.` : "", closesAt ? `It closes on ${formatUtc(closesAt)}.` : ""].filter(Boolean).join(" ");
  return renderEmail({
    origin: url,
    subject: `${pmName} asks for your view on ${projectName}`,
    preheader: `The list has ${itemCount} ${itemCount === 1 ? "item" : "items"} and takes about ${minutes} minutes, on your phone or laptop.`,
    before: [
      { text: input.respondentName ? `Hi ${input.respondentName},` : "Hi," },
      { text: `${pmName} at ${workspaceName} is checking ${list} for ${projectName} and wants your view.` },
      ...(intro ? [{ text: intro, preLine: true }] : []),
      { text: `For each item you say whether you agree with the proposed priority, or what it should be and why. It takes about ${minutes} minutes. You can stop and come back; your answers are saved as you go. No account is needed.` },
    ],
    button: { label: "Open your link", url },
    after: [{ text: `This link is yours. Do not forward it; answers sent through it are recorded under your name. ${closes}`.trim() }],
  });
}
