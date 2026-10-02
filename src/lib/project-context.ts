// The project context (stories/E3-1, acceptance 3; decision 0020): one text on what the
// project is about and one line of terms to keep as written, 2,000 characters together, counted
// live on Import and refused on the server above that. Pure, shared by the form and the action.
// The message: docs/copy/errors.md, "Context over 2,000 characters".
export const CONTEXT_MAX = 2000;

export function contextLength(goal: string, terms: string): number {
  return goal.length + terms.length;
}

export function contextCount(goal: string, terms: string): string {
  return `${contextLength(goal, terms).toLocaleString("en-GB")} of ${CONTEXT_MAX.toLocaleString("en-GB")} characters`;
}

export function contextError(goal: string, terms: string): string | null {
  const n = contextLength(goal, terms);
  return n > CONTEXT_MAX ? `Your project context is ${n.toLocaleString("en-GB")} characters. Shorten it to ${CONTEXT_MAX.toLocaleString("en-GB")} or fewer.` : null;
}
