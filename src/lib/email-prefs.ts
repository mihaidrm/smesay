// The person's email switches and the stop link (stories/E16-1, acceptance 5): read and save
// the three switches for the Settings card, and stop one kind for the person behind a token.
// The token is the one src/db/queries/emails.ts made for the person's emails; a token not on
// file is unknown, and the page answers 404.
import { emails } from "@/db/queries";
import { isEmailKind } from "@/db/queries/emails";
import { EMAIL_KINDS, type EmailKind, type EmailPrefs } from "@/db/types";

export { isEmailKind };

export async function readEmailPrefs(userId: string): Promise<EmailPrefs> {
  return emails.prefs(userId);
}

// Saves one switch, in one statement so two saves at once both land; anything but a kind on
// the list and a boolean is refused.
export async function setEmailPref(userId: string, kind: unknown, on: unknown): Promise<EmailPrefs | null> {
  if (!isEmailKind(kind) || typeof on !== "boolean") return null;
  await emails.setPref(userId, kind, on);
  return emails.prefs(userId);
}

export type StopTarget = { kind: EmailKind; name: string; already: boolean };

// The stop page's question: who the token belongs to and whether the kind is on.
export async function stopTarget(token: unknown, kind: unknown): Promise<StopTarget | null> {
  if (typeof token !== "string" || !isEmailKind(kind)) return null;
  const person = await emails.byToken(token);
  return person ? { kind, name: person.name, already: !person.prefs[kind] } : null;
}

export async function stopEmails(token: unknown, kind: unknown): Promise<boolean> {
  if (typeof token !== "string" || !isEmailKind(kind)) return false;
  return emails.stop(token, kind);
}

export const EMAIL_KIND_LIST: readonly EmailKind[] = EMAIL_KINDS;
