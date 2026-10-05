// The removal job (stories/E11-2, acceptance 3): every workspace marked deleted loses its
// objects in the bucket, then its rows (in decision 0028's order, one transaction:
// internal.purgeWorkspace), and the owner who deleted it gets one email. Objects first, so a job
// stopped half way leaves the marked row for the next run, which finds no objects and deletes the
// rows: the job is idempotent. The prefixes are the bucket's per-workspace segments (the story's
// technical notes: logos/[id]/, E2-5, and uploads/[id]/, E3-2; a new prefix adds a line here).
// Run by `npm run jobs:purge` (scripts/jobs-purge.ts): by hand locally, by cron hourly at the
// launch gate. Counts are logged; no name or email.
import { internal } from "@/db/queries/internal";
import { sendMail } from "@/lib/mail";
import { deletionEmail } from "@/lib/mail/templates/deletion";
import { deleteObject, listKeys } from "@/lib/storage";
import { log } from "@/lib/log";

export const OBJECT_PREFIXES = ["logos", "uploads"] as const;

export type PurgeReport = { workspaces: number; responses: number; projects: number; objects: number; emails: number; failed: number };

// One workspace at a time; a failure is logged with the workspace's id and the step, counted,
// and the job goes on to the next, so one workspace cannot hold the others past their 24 hours.
// The email goes after the rows are gone: the deletion never waits on mail. If it fails, the
// failure is logged with the workspace's id and counted, and no second email follows, since the
// workspace is gone (docs/review-list.md).
export async function purgeDeletedWorkspaces(send: typeof sendMail = sendMail): Promise<PurgeReport> {
  const report: PurgeReport = { workspaces: 0, responses: 0, projects: 0, objects: 0, emails: 0, failed: 0 };
  // The email's mark and privacy link are on the app's address (stories/E12-3); without
  // BETTER_AUTH_URL the email goes without them, and the deletion is never held up by it.
  const origin = process.env.BETTER_AUTH_URL || null;
  for (const ws of await internal.deletedWorkspaces()) {
    let step = "objects";
    try {
      const keys = (await Promise.all(OBJECT_PREFIXES.map((p) => listKeys(`${p}/${ws.id}/`)))).flat();
      for (const key of keys) await deleteObject(key);
      report.objects += keys.length;
      step = "rows";
      const rows = await internal.purgeWorkspace(ws.id);
      report.responses += rows.responses;
      report.projects += rows.projects;
      report.workspaces += rows.workspaces;
      log("info", "jobs:purge removed a workspace.", { workspace: ws.id, objects: keys.length, responses: rows.responses, projects: rows.projects });
      if (rows.workspaces === 1 && ws.deletedByEmail) {
        step = "email";
        await send({ to: ws.deletedByEmail, ...deletionEmail(ws.name, ws.deletedAt, origin) });
        report.emails += 1;
      }
    } catch (error) {
      report.failed += 1;
      log("error", "jobs:purge failed for a workspace.", { workspace: ws.id, step, error: error instanceof Error ? error.name : "error" });
    }
  }
  return report;
}

// How long SMEsay keeps what has no other end (decision 0054; docs/legal/privacy.md, and the
// review sheet docs/legal/lawyer-review.md where the lawyer checks each period). The same hourly
// job deletes past these, so the privacy page's periods are what the code does: ended sessions
// and expired sign-in links at the next run, usage events after EVENT_RETENTION_MONTHS and admin
// log rows after AUDIT_RETENTION_MONTHS. Counts are logged; no id, name or email.
export const EVENT_RETENTION_MONTHS = 25;
export const AUDIT_RETENTION_MONTHS = 24;

const monthsBefore = (now: Date, months: number) => { const d = new Date(now); d.setUTCMonth(d.getUTCMonth() - months); return d; };

export async function purgeExpired(now = new Date()): Promise<{ sessions: number; links: number; events: number; audit: number }> {
  const counts = await internal.purgeExpired(now, monthsBefore(now, EVENT_RETENTION_MONTHS), monthsBefore(now, AUDIT_RETENTION_MONTHS));
  log("info", "jobs:purge removed expired records.", { detail: `sessions ${counts.sessions}, sign-in links ${counts.links}, events ${counts.events}, admin log rows ${counts.audit}` });
  return counts;
}
