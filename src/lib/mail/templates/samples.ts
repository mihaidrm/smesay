// One filled example of each email (stories/E12-3, acceptances 3 and 4), shared by the unit test
// and scripts/email-samples.ts, so the samples Mihai opens are the ones the test checks. The
// workspace, project, items and respondents are the Marlow Group fixture's
// (src/db/seed/sample.ts); the PM's name is not in the fixture and is made up here. The
// minutes come from minutesFor, the token has the app's shape (32 hex characters,
// src/lib/sharing.ts newToken), and the sign-in link carries better-auth's callbackURL, so the
// samples are as long as the real ones.
import * as seed from "@/db/seed/sample";
import type { EmailKind } from "@/db/types";
import { stopLink } from "@/lib/mail/stop-link";
import { closingEmail } from "./closing";
import { completeEmail } from "./complete";
import { digestEmail } from "./digest";
import { invitationEmail } from "./invitation";
import { seriesEmail } from "./series";
import { minutesFor } from "@/lib/invitees-rules";
import type { Email } from "./layout";
import { deletionEmail } from "./deletion";
import { inviteEmail } from "./invite";
import { receiptEmail } from "./receipt";
import { reminderEmail } from "./reminder";
import { signInEmail } from "./sign-in";

export const SAMPLE_NAMES = ["sign-in", "invite", "reminder", "receipt", "deletion", "closing", "complete", "digest", "invitation", "series-start", "series-import", "series-share", "series-last"] as const;
export type SampleName = (typeof SAMPLE_NAMES)[number];
// The address the committed samples are rendered on (scripts/email-samples.ts --origin).
export const SAMPLE_ORIGIN = "http://localhost:3000";
export const PM_NAME = "Mara Stan";
const SUPPORT = "hello@smesay.com";
// The sample project's id is the seed's; the samples need only an address.
const PROJECT_ID = "7c3a1f2e-5b4d-4a6e-9f10-2b3c4d5e6f70";
const SIGNED_UP = "you signed up for SMEsay on 2026-10-05.";

export function sampleEmails(origin: string): Record<SampleName, Email> {
  const link = new URL("/r/3f9c2a7be41d0c58a6e19f7b2d4c8e05", origin).toString();
  const itemCount = seed.items.length;
  const sam = seed.people.find((p) => p.name === "Sam Hill")!;
  const ioana = seed.people.find((p) => p.name === "Ioana Marin")!;
  const first = (name: string) => name.split(" ")[0];
  const results = new URL(`/app/projects/${PROJECT_ID}/results`, origin).toString();
  const stop = (kind: EmailKind, reason: string) => ({ reason, url: stopLink(origin, "3f9c2a7be41d0c58a6e19f7b2d4c8e05", kind).url });
  return {
    "sign-in": signInEmail(new URL(`/api/auth/magic-link/verify?token=Qm8xR2v7LpT4nZc9WsY1aK3d&callbackURL=${encodeURIComponent("/app")}`, origin).toString()),
    invite: inviteEmail({ pmName: PM_NAME, workspaceName: seed.workspace.name, projectName: seed.project.name, respondentName: first(sam.name), itemCount, minutes: minutesFor(itemCount), intro: seed.instrument.intro, url: link, closesAt: seed.instrument.closesAt }),
    reminder: reminderEmail({ pmName: PM_NAME, projectName: seed.project.name, respondentName: first(sam.name), answered: 3, itemCount, url: link, closesAt: seed.instrument.closesAt }),
    receipt: receiptEmail({ respondentName: first(ioana.name), projectName: seed.project.name, workspaceName: seed.workspace.name, submittedAt: new Date(ioana.submittedAt!), closesAt: seed.instrument.closesAt, counts: { items: itemCount, changed: 2, rated: 0, notNeeded: 0, unclear: 1, missing: 0, confidence: ioana.confidence! }, rateBlind: false, url: link }),
    deletion: deletionEmail(seed.workspace.name, new Date("2026-10-21T09:00:00Z"), origin),
    // E16-1 and E16-2: the member is the PM; the stop token is made up like the link's.
    closing: closingEmail({ memberName: first(PM_NAME), projectName: seed.project.name, workspaceName: seed.workspace.name, closedAt: seed.instrument.closesAt, personal: { submitted: 5, invited: 6 }, publicCount: 2, topItems: [{ text: seed.items[2].reader, percent: 43 }, { text: seed.items[4].reader, percent: 57 }, { text: seed.items[1].reader, percent: 71 }], url: results, stop: stop("validations", `you are a member of ${seed.workspace.name}.`) }),
    complete: completeEmail({ memberName: first(PM_NAME), projectName: seed.project.name, invited: 6, closesAt: seed.instrument.closesAt, publicOpen: true, url: results, stop: stop("validations", `you are a member of ${seed.workspace.name}.`) }),
    digest: digestEmail({ memberName: first(PM_NAME), rows: [{ projectName: seed.project.name, workspaceName: seed.workspace.name, fresh: 2, submitted: 5, invited: 6, closesAt: seed.instrument.closesAt, url: results }], stop: stop("digest", "you turned on the daily digest in Settings.") }),
    invitation: invitationEmail({ inviterName: PM_NAME, inviterEmail: "mara@marlow.example", workspaceName: seed.workspace.name, url: new URL(`/api/auth/magic-link/verify?token=Qm8xR2v7LpT4nZc9WsY1aK3d&callbackURL=${encodeURIComponent("/app")}`, origin).toString() }),
    "series-start": seriesEmail({ step: "start", name: first(PM_NAME), workspaceName: seed.workspace.name, project: null, origin, supportEmail: SUPPORT, stop: stop("guide", SIGNED_UP) }),
    "series-import": seriesEmail({ step: "import", name: first(PM_NAME), workspaceName: seed.workspace.name, project: null, origin, supportEmail: SUPPORT, stop: stop("guide", SIGNED_UP) }),
    "series-share": seriesEmail({ step: "share", name: first(PM_NAME), workspaceName: seed.workspace.name, project: { id: PROJECT_ID, name: seed.project.name }, origin, supportEmail: SUPPORT, stop: stop("guide", SIGNED_UP) }),
    "series-last": seriesEmail({ step: "last", name: first(PM_NAME), workspaceName: seed.workspace.name, project: null, origin, supportEmail: SUPPORT, stop: stop("guide", SIGNED_UP) }),
  };
}
