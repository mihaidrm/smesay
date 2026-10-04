// The actions output (INTERFACES.md, "InsightOutput"; stories/E9-1, acceptance 2). Every
// object strict (E4-1). Citations are refs from the data: A[n] for an answer, M[n] for a
// missing item (src/lib/ai/prompts/insights.ts), never database ids, so the model can only
// cite what it was given; src/lib/insights.ts maps them back and drops an action whose
// refs do not exist or that cites nothing (acceptance 2 and 3).
import { z } from "zod";
import { INSIGHT_KINDS } from "@/db/types";

export const ACTIONS_MAX = 8;

export const InsightOutput = z.strictObject({
  actions: z.array(z.strictObject({
    kind: z.enum(INSIGHT_KINDS).describe("rewrite: an item to reword; conflict: groups that disagree; followUp: an open question to answer; coverage: an area few could rate"),
    title: z.string().min(1).max(140).describe("What to do, one short sentence starting with a verb"),
    why: z.string().min(1).max(400).describe("Why, in one or two sentences, from the answers cited"),
    answers: z.array(z.string()).describe("The refs of the answers behind it, as given (A1, A2 ...)"),
    missing: z.array(z.string()).describe("The refs of the missing items behind it, as given (M1 ...)"),
  })).max(ACTIONS_MAX).describe("At most eight actions, the most useful first"),
});

export type InsightOutput = z.infer<typeof InsightOutput>;
