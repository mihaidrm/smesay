// The project context in the prompts (stories/E4-5; decision 0011): the goal and audience
// from Import and the terms to keep as written, passed as data in their own section before
// the list, never in the instructions. The same builder serves shaping (E4-2) and insights
// (E9). An empty context gives no section and no instruction sentence (acceptance 1).
export type ProjectContext = { goal: string | null; terms: string | null };

const fold = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

export function hasContext(ctx: ProjectContext): boolean {
  return fold(ctx.goal) !== "" || fold(ctx.terms) !== "";
}

// The data section, or null when there is nothing to say.
export function contextBlock(ctx: ProjectContext): string | null {
  if (!hasContext(ctx)) return null;
  const lines = ["PROJECT CONTEXT"];
  if (fold(ctx.goal)) lines.push(`Goal and audience: ${fold(ctx.goal)}`);
  if (fold(ctx.terms)) lines.push(`Terms to keep as written: ${fold(ctx.terms)}`);
  return lines.join("\n");
}

// The instruction sentence that goes with the section, in the system prompt; it names no
// term and no goal, those stay in the data.
export const CONTEXT_INSTRUCTION = "A PROJECT CONTEXT section may come before the list in the user message. Use its goal and audience to choose the areas, their order and the tone of the reader versions. Every term under \"Terms to keep as written\" is the project's own name for a thing: wherever an item uses it, the reader version uses it exactly as written, never translated, expanded, shortened or renamed.";
