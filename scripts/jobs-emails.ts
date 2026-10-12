// npm run jobs:emails (stories/E16-1, acceptance 6; E16-2): sends the closing summaries, the
// daily digests (at 06:00 UTC) and the getting-started series (only with LIFECYCLE_EMAILS=on;
// otherwise counted) that are due, from src/lib/notifications.ts. By hand locally; hourly by
// cron on the host at the launch gate, beside jobs:purge (docs/runbooks). Prints the counts;
// exits 1 when a send failed, after the others.
import { sendDueEmails, SERIES_FLAG } from "../src/lib/notifications";

async function run() {
  const origin = process.env.BETTER_AUTH_URL;
  if (!origin) throw new Error("BETTER_AUTH_URL is not set. The emails' links need the site's address (docs/setup.md).");
  const r = await sendDueEmails(origin, new Date());
  const series = process.env[SERIES_FLAG] === "on" ? `${r.series} getting-started` : `${r.seriesDue} getting-started due, none sent (${SERIES_FLAG} is not on)`;
  console.log(`jobs:emails done: ${r.closings} closing summaries, ${r.skipped} closes too old to send, ${r.digests} digests, ${series}, ${r.failed} failed`);
  process.exit(r.failed > 0 ? 1 : 0);
}

run()
  // The name and the SQLSTATE only: a database error's message carries the query's values.
  .catch((error: unknown) => { const code = (error as { cause?: { code?: string } })?.cause?.code; console.error(`jobs:emails failed: ${error instanceof Error ? error.message : "error"}${code ? ` (SQLSTATE ${code})` : ""}`); process.exit(1); });
