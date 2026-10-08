// The guide through the Build page (design note 122; Mihai, 2026-10-08: "the build phase is
// also so huge on the screen"). The five cards (Intro, Scoring, Perspectives, Closing,
// Respondent fields) are collapsible (src/components/app/collapsible-card.tsx) and one is
// open at a time; each closed one carries its settings on its title row, so the page reads
// as a list of what the validation does. Pure: the page reads the open card from its data
// and the summaries from the instrument. Copy: docs/copy/app.md, Build.
import type { Layout, ReasonRule, ScoringMethod } from "@/db/types";
import { LAYOUTS_META, METHODS } from "@/lib/scoring";

export type BuildCards = { intro: boolean; scoring: boolean; perspectives: boolean; closing: boolean; fields: boolean };

// Intro is open while nothing is written in it (the work that comes first); with an intro,
// every card is closed and the summaries say what is set. The sample project, which cannot
// be edited, opens nothing. The page applies this on the first render only (the card's
// `hold`): a save never closes the card the person is working in.
export function openBuildCards(d: { intro: string | null; readOnly: boolean }): BuildCards {
  const none: BuildCards = { intro: false, scoring: false, perspectives: false, closing: false, fields: false };
  if (d.readOnly) return none;
  return { ...none, intro: (d.intro ?? "").trim() === "" };
}

const n = (x: number) => x.toLocaleString("en-GB");

// "Name and Role", "Name, Role and Team".
export const listOf = (words: string[]): string => (words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`);

const REASON_SUMMARY: Record<ReasonRule, string> = {
  differs: "a reason when the answer differs",
  never: "no reason required",
  always: "a reason on every answer",
};

export const BUILD_CARD_COPY = {
  intro: {
    summary: (title: string, intro: string | null) => `${title}. ${(intro ?? "").trim() || "No intro yet."}`,
  },
  scoring: {
    summary: (s: { method: ScoringMethod; showProposed: boolean; reasonRule: ReasonRule; layout: Layout }) => {
      const method = METHODS.find((m) => m.key === s.method)?.label ?? s.method;
      const layout = (LAYOUTS_META.find((l) => l.key === s.layout)?.label ?? s.layout).toLowerCase();
      return `${method}, proposal ${s.showProposed ? "shown" : "hidden"}, ${REASON_SUMMARY[s.reasonRule]}, ${layout}`;
    },
  },
  perspectives: {
    summary: (names: string[], tagged: number, total: number) =>
      names.length === 0 ? "None. Every item goes to everyone." : `${names.join(", ")}. ${n(tagged)} of ${n(total)} items carry a perspective.`,
  },
  closing: {
    summary: (c: { closingQuestion?: string | null; missingForm: boolean }) =>
      `${(c.closingQuestion ?? "").trim() ? "A closing question" : "No closing question"}. ${c.missingForm ? "Asks for missing items" : "Does not ask for missing items"}. Confidence always on.`,
  },
  fields: {
    count: (total: number) => `${n(total)} ${total === 1 ? "field" : "fields"}`,
    summary: (fields: { label: string; mandatory: boolean }[]) => {
      const required = fields.filter((f) => f.mandatory).length;
      const total = fields.length;
      const rule = required === total ? (total === 1 ? "Required." : total === 2 ? "Both required." : "All required.")
        : required === 0 ? (total === 1 ? "Optional." : "All optional.")
        : `${n(required)} of ${n(total)} required.`;
      return `${listOf(fields.map((f) => f.label))}. ${rule}`;
    },
  },
} as const;
