// One real call to the model with the key in .env.local (stories/E4-1, acceptance 6):
// `npm run ai:smoke`. Picks the first project that is not the sample in the oldest workspace,
// asks for a one-field JSON object, prints the tokens, the cost and the ai_run row. Costs a
// cent at most, and the row counts as one shaping run of that project in usage (E2-6). The
// script runs outside src/, so it may read the database directly.
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { project, workspace } from "@/db/schema";
import { unsafeWorkspaceId } from "@/db/queries/scoped";
import { runModel } from "@/lib/ai/client";

async function main() {
  const [ws] = await db.select().from(workspace).orderBy(asc(workspace.createdAt)).limit(1);
  if (!ws) throw new Error("No workspace yet. Sign in to the app once, then run this again.");
  const [own] = await db.select().from(project).where(eq(project.workspaceId, ws.id)).orderBy(asc(project.isSample), asc(project.createdAt)).limit(1);
  if (!own || own.isSample) throw new Error(`Workspace ${ws.name} has no project of its own. Create one in the app, then run this again.`);
  const result = await runModel({
    ws: unsafeWorkspaceId(ws.id),
    projectId: own.id,
    purpose: "shape",
    instructions: "Answer with a JSON object with one field, greeting: a short hello in plain English that names the product in the user message.",
    data: "SMEsay",
    schema: z.strictObject({ greeting: z.string() }),
    check: (out) => (out.greeting.includes("SMEsay") ? null : "the greeting does not name the product"),
    maxOutputTokens: 256,
  });
  if (!result.ok) throw new Error(`${result.reason}: ${result.detail}. Shown to the user as: ${result.message}`);
  console.log(`Answer: ${result.output.greeting}`);
  console.log(`Model ${result.run.model}, ${result.run.tokensIn} tokens in, ${result.run.tokensOut} out, ${result.run.costEurCents} euro cent(s), ${result.run.durationMs} ms, ai_run ${result.run.id} in workspace ${ws.name}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("The smoke call did not go through. " + (error instanceof Error ? error.message : String(error)));
    process.exit(1);
  });
