// npm run jobs:purge (stories/E11-2, acceptance 3): removes every workspace marked deleted, its
// objects and its rows, and emails the owner who deleted it; then deletes what has passed its
// retention (decision 0054): ended sessions, expired sign-in links, old usage events and old
// admin log rows (src/lib/workspace-removal.ts). By hand locally; hourly by cron on the host at
// the launch gate (docs/runbooks, E11-4). Prints the counts; exits 1 when a workspace failed
// (its id and step are logged), after the others.
import { purgeDeletedWorkspaces, purgeExpired } from "../src/lib/workspace-removal";

async function run() {
  const r = await purgeDeletedWorkspaces();
  const e = await purgeExpired();
  console.log(`jobs:purge done: ${r.workspaces} workspaces, ${r.responses} responses, ${r.projects} projects, ${r.objects} objects, ${r.emails} emails, ${r.failed} failed; expired: ${e.sessions} sessions, ${e.links} sign-in links, ${e.events} events, ${e.audit} admin log rows`);
  process.exit(r.failed > 0 ? 1 : 0);
}

run()
  // The name and the SQLSTATE only: a database error's message carries the query's values.
  .catch((error: unknown) => { const code = (error as { cause?: { code?: string } })?.cause?.code; console.error(`jobs:purge failed: ${error instanceof Error ? error.name : "error"}${code ? ` (SQLSTATE ${code})` : ""}`); process.exit(1); });
