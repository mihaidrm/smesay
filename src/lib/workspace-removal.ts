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

export type PurgeReport = { workspaces: number; responses: number; projects: number; objects: number; emails: number };

export async function purgeDeletedWorkspaces(send: typeof sendMail = sendMail): Promise<PurgeReport> {
  const report: PurgeReport = { workspaces: 0, responses: 0, projects: 0, objects: 0, emails: 0 };
  for (const ws of await internal.deletedWorkspaces()) {
    const keys = (await Promise.all(OBJECT_PREFIXES.map((p) => listKeys(`${p}/${ws.id}/`)))).flat();
    for (const key of keys) await deleteObject(key);
    const rows = await internal.purgeWorkspace(ws.id);
    report.objects += keys.length;
    report.responses += rows.responses;
    report.projects += rows.projects;
    report.workspaces += rows.workspaces;
    if (rows.workspaces === 1 && ws.deletedByEmail) {
      await send({ to: ws.deletedByEmail, ...deletionEmail(ws.name, ws.deletedAt) });
      report.emails += 1;
    }
    console.log(`jobs:purge workspace ${ws.id}: ${keys.length} objects, ${rows.responses} responses, ${rows.projects} projects`);
  }
  return report;
}
