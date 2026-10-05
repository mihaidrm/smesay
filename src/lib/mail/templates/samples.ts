// One filled example of each email (stories/E12-3, acceptances 3 and 4), shared by the unit test
// and scripts/email-samples.ts, so the samples Mihai opens are the ones the test checks. The
// workspace, project, items and respondents are the Marlow Group fixture's
// (src/db/seed/sample.ts); the PM's name is not in the fixture and is made up here. The
// minutes come from minutesFor, the token has the app's shape (32 hex characters,
// src/lib/sharing.ts newToken), and the sign-in link carries better-auth's callbackURL, so the
// samples are as long as the real ones.
import * as seed from "@/db/seed/sample";
import { minutesFor } from "@/lib/invitees-rules";
import type { Email } from "./layout";
import { deletionEmail } from "./deletion";
import { inviteEmail } from "./invite";
import { receiptEmail } from "./receipt";
import { reminderEmail } from "./reminder";
import { signInEmail } from "./sign-in";

export const SAMPLE_NAMES = ["sign-in", "invite", "reminder", "receipt", "deletion"] as const;
export type SampleName = (typeof SAMPLE_NAMES)[number];
// The address the committed samples are rendered on (scripts/email-samples.ts --origin).
export const SAMPLE_ORIGIN = "http://localhost:3000";
export const PM_NAME = "Mara Stan";

export function sampleEmails(origin: string): Record<SampleName, Email> {
  const link = new URL("/r/3f9c2a7be41d0c58a6e19f7b2d4c8e05", origin).toString();
  const itemCount = seed.items.length;
  const sam = seed.people.find((p) => p.name === "Sam Hill")!;
  const ioana = seed.people.find((p) => p.name === "Ioana Marin")!;
  const first = (name: string) => name.split(" ")[0];
  return {
    "sign-in": signInEmail(new URL(`/api/auth/magic-link/verify?token=Qm8xR2v7LpT4nZc9WsY1aK3d&callbackURL=${encodeURIComponent("/app")}`, origin).toString()),
    invite: inviteEmail({ pmName: PM_NAME, workspaceName: seed.workspace.name, projectName: seed.project.name, respondentName: first(sam.name), itemCount, minutes: minutesFor(itemCount), intro: seed.instrument.intro, url: link, closesAt: seed.instrument.closesAt }),
    reminder: reminderEmail({ pmName: PM_NAME, projectName: seed.project.name, respondentName: first(sam.name), answered: 3, itemCount, url: link, closesAt: seed.instrument.closesAt }),
    receipt: receiptEmail({ respondentName: first(ioana.name), projectName: seed.project.name, workspaceName: seed.workspace.name, submittedAt: new Date(ioana.submittedAt!), closesAt: seed.instrument.closesAt, counts: { items: itemCount, changed: 2, rated: 0, notNeeded: 0, unclear: 1, missing: 0, confidence: ioana.confidence! }, rateBlind: false, url: link }),
    deletion: deletionEmail(seed.workspace.name, new Date("2026-10-21T09:00:00Z"), origin),
  };
}
