// Email 3 of docs/copy/emails.md (the reminder, stories/E6-3; template stories/E12-3) on the
// shared frame (layout.ts). The branch is "You have not started yet." when no answer exists,
// else "You answered [N] of [M] items." The close instant is written in UTC
// (src/lib/sharing-format.ts formatUtc).
import { formatUtc } from "@/lib/sharing-format";
import { renderEmail, type Email } from "./layout";

export type ReminderEmailInput = { pmName: string; projectName: string; respondentName: string | null; answered: number; itemCount: number; url: string; closesAt: Date | null };

export function reminderEmail(input: ReminderEmailInput): Email {
  const { pmName, projectName, answered, itemCount, url, closesAt } = input;
  const closeDay = closesAt ? formatUtc(closesAt).split(",")[0] : "";
  return renderEmail({
    origin: url,
    subject: closesAt ? `Reminder: ${projectName} closes on ${closeDay}` : `Reminder: ${projectName}`,
    preheader: `${answered} of ${itemCount} answered so far.`,
    before: [
      { text: input.respondentName ? `Hi ${input.respondentName},` : "Hi," },
      { text: closesAt ? `${pmName} is still waiting for your answers on ${projectName}. The link closes on ${formatUtc(closesAt)}.` : `${pmName} is still waiting for your answers on ${projectName}.` },
      { text: answered === 0 ? "You have not started yet." : `You answered ${answered} of ${itemCount} ${itemCount === 1 ? "item" : "items"}. Your answers are saved; pick up where you left off.` },
    ],
    button: { label: "Carry on", url },
    after: [{ text: `If you cannot take part, reply to this email and say so, and ${pmName} will stop reminding you.` }],
  });
}
