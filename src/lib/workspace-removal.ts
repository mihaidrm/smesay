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
import { deletionEmail } from "@/lib/mail/deletion-email";
import { deleteObject, listKeys } from "@/lib/storage";

export const OBJECT_PREFIXES = ["logos", "uploads"] as const;

export type PurgeReport = { workspaces: number; responses: number; projects: number; objects: number; emails: number; failed: number };

// One workspace at a time; a failure is logged with the workspace's id and the step, counted,
// and the job goes on to the next, so one workspace cannot hold the others past their 24 hours.
// The email is sent inside the rows' transaction: if it fails, the rows stay for the next run.
export async function purgeDeletedWorkspaces(send: typeof sendMail = sendMail): Promise<PurgeReport> {
  const report: PurgeReport = { workspaces: 0, responses: 0, projects: 0, objects: 0, emails: 0, failed: 0 };
  for (const ws of await internal.deletedWorkspaces()) {
    let step = "objects";
    try {
      const keys = (await Promise.all(OBJECT_PREFIXES.map((p) => listKeys(`${p}/${ws.id}/`)))).flat();
      for (const key of keys) await deleteObject(key);
      report.objects += keys.length;
      step = "rows";
      let emailed = false;
      const rows = await internal.purgeWorkspace(ws.id, async () => {
        if (!ws.deletedByEmail) return;
        step = "email";
        await send({ to: ws.deletedByEmail, ...deletionEmail(ws.name, ws.deletedAt) });
        emailed = true;
      });
      report.responses += rows.responses;
      report.projects += rows.projects;
      report.workspaces += rows.workspaces;
      if (emailed) report.emails += 1;
      console.log(`jobs:purge workspace ${ws.id}: ${keys.length} objects, ${rows.responses} responses, ${rows.projects} projects`);
    } catch (error) {
      report.failed += 1;
      console.error(`jobs:purge workspace ${ws.id} failed at ${step}: ${error instanceof Error ? error.name : "error"}`);
    }
  }
  return report;
}
