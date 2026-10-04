// Settings, Data (stories/E11-2): Export everything and Delete this workspace, both owner only
// through can() (src/lib/permissions.ts: workspace.export, workspace.delete).
// - exportWorkspace: one zip (src/lib/export/zip.ts) with projects/[N]-[name].json for every
//   project (E10-2's file, the sample's marked as such), workspace.json (the settings),
//   members.csv (name, email, role, joined) and the logo; the download is logged by the route.
// - deleteWorkspace: the typed name must match; deleted_at and deleted_by are set
//   (workspaces.markDeleted), so the workspace leaves every member's reads at once and its links
//   read as revoked (src/db/queries/links.ts). The rows and objects go with the removal job
//   (scripts/jobs-purge.ts) within 24 hours.
import { members, projects, workspaces } from "@/db/queries";
import { csv } from "@/lib/export/csv";
import { EXPORT_COPY } from "@/lib/export/copy";
import { exportProject } from "@/lib/export/project";
import { zip, type ZipEntry } from "@/lib/export/zip";
import { NotFoundError } from "@/lib/errors";
import { requireRole, type Actor } from "@/lib/members";
import { getObject } from "@/lib/storage";
import { WORKSPACE_DATA_COPY } from "./workspace-data-copy";

const fileStem = (name: string) => name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || "project";

export async function exportWorkspace(actor: Actor, now = new Date()): Promise<{ zip: Buffer; projects: number; name: string }> {
  await requireRole(actor, "workspace.export");
  const ws = await workspaces.getById(actor.ws);
  if (!ws) throw new NotFoundError();
  const list = await projects.list(actor.ws);
  const entries: ZipEntry[] = [];
  for (const [i, p] of list.entries()) {
    const file = await exportProject(actor, p.id, now);
    entries.push({ name: `projects/${String(i + 1).padStart(3, "0")}-${fileStem(p.name)}.json`, data: Buffer.from(JSON.stringify(file)) });
  }
  const settings = { name: ws.name, slug: ws.slug, plan: ws.plan, accentHex: ws.accentHex, aiBudgetEur: ws.aiBudgetEur, createdAt: ws.createdAt.toISOString(), logo: ws.logoObjectKey ? ws.logoObjectKey.split("/").pop() : null, exportedAt: now.toISOString() };
  entries.push({ name: "workspace.json", data: Buffer.from(JSON.stringify(settings, null, 2)) });
  const people = await members.listWithUsers(actor.ws);
  entries.push({ name: "members.csv", data: Buffer.from(csv([], WORKSPACE_DATA_COPY.membersHeader, people.map((m) => [m.name, m.email, WORKSPACE_DATA_COPY.roles[m.role] ?? m.role, m.createdAt.toISOString()]))) });
  if (ws.logoObjectKey) {
    const logo = await getObject(ws.logoObjectKey);
    if (logo) entries.push({ name: `logo/${ws.logoObjectKey.split("/").pop()}`, data: Buffer.from(logo.body) });
  }
  return { zip: zip(entries, now), projects: list.length, name: `${fileStem(ws.name)}-${EXPORT_COPY.everythingSuffix}-${now.toISOString().slice(0, 10)}.zip` };
}

export async function deleteWorkspace(actor: Actor, typedName: unknown, now = new Date()): Promise<{ error: string } | { deletedAt: Date }> {
  await requireRole(actor, "workspace.delete");
  const ws = await workspaces.getById(actor.ws);
  if (!ws) throw new NotFoundError();
  if (typeof typedName !== "string" || typedName.trim() !== ws.name.trim()) return { error: WORKSPACE_DATA_COPY.wrongName };
  const marked = await workspaces.markDeleted(actor.ws, actor.userId, now);
  if (!marked) throw new NotFoundError();
  return { deletedAt: now };
}
