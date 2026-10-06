// Who sees whose answers (stories/E5-7; INTERFACES.md Anonymity; design note 100): the three
// levels the PM picks on Build, the rule on the respondent fields under the two that hide
// names, and the words. No database import, so the Build card, About you and Results can use
// it. Named is today's behaviour and the default. Names hidden keeps personal invites and
// reminders, and hides names, fields and times from Results, the exports and the AI.
// Anonymous is the public link only. Under both, the respondent fields can only be dropdowns:
// a text or an email field could carry a name. Messages: docs/copy/errors.md, Build and
// Share; the card: docs/copy/app.md, Build.
import type { Anonymity, RespondentFieldSpec } from "@/db/types";

export const DEFAULT_ANONYMITY: Anonymity = "named";

export const ANONYMITY_META: { key: Anonymity; label: string; hint: string }[] = [
  { key: "named", label: "Named", hint: "Results show each person's name and fields. The default." },
  { key: "hidden", label: "Names hidden", hint: "Personal invites and reminders still work, and Share shows who has finished. Results, exports and the AI show answers without names or fields. With few people, the finishing times on Share can still point to someone." },
  { key: "anonymous", label: "Anonymous", hint: "The public link only: no personal invites, and no name or email fields." },
];

export const isAnonymity = (value: unknown): value is Anonymity => value === "named" || value === "hidden" || value === "anonymous";

// Whether Results, the exports and the AI may show who answered.
export const namesShown = (level: Anonymity): boolean => level === "named";

const list = (labels: string[]) => (labels.length <= 1 ? labels.join("") : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`);

export const ANONYMITY_ERRORS = {
  badLevel: "Pick who sees whose answers: Named, Names hidden or Anonymous.",
  locked: "Published validations keep who sees whose answers. Build a new validation to change it.",
  // Choosing Names hidden or Anonymous while a text or email field exists (acceptance 2).
  levelNeedsDropdowns: (level: string, labels: string[]) => `${level} needs dropdown fields only. Remove ${list(labels)} or make ${labels.length === 1 ? "it a dropdown" : "them dropdowns"} on the Respondent fields card, then pick ${level} again.`,
  // Saving a text or email field under Names hidden or Anonymous (acceptance 2).
  fieldsNeedDropdowns: (level: string, labels: string[]) => `This validation is set to ${level}, so its fields can only be dropdowns. Remove ${list(labels)} or make ${labels.length === 1 ? "it a dropdown" : "them dropdowns"}.`,
} as const;

export const labelOf = (level: Anonymity): string => ANONYMITY_META.find((m) => m.key === level)?.label ?? level;

// The labels of the fields that may not stay under the level: every text and email field
// under Names hidden and Anonymous, none under Named.
export function fieldsBlocking(fields: Pick<RespondentFieldSpec, "label" | "type">[], level: Anonymity): string[] {
  if (namesShown(level)) return [];
  return fields.filter((f) => f.type !== "dropdown").map((f) => f.label);
}
