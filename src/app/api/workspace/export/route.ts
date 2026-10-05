// GET /api/workspace/export (stories/E11-2, acceptance 1): Export everything, the current
// workspace as one zip (src/lib/workspace-data.ts), owner only (403 for a member), logged in
// export_log with file "workspace", no project and the number of projects as its rows. A request
// another site starts gets 403 and writes nothing (as the export route, E10-1).
import { exportLogs } from "@/db/queries";
import { requireWritableWorkspace } from "@/lib/current-workspace";
import { ForbiddenError } from "@/lib/errors";
import { track } from "@/lib/analytics";
import { exportWorkspace } from "@/lib/workspace-data";

export async function GET(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403 });
  const { session, current } = await requireWritableWorkspace("/app/settings");
  let out: Awaited<ReturnType<typeof exportWorkspace>>;
  try {
    out = await exportWorkspace({ ws: current.ws, userId: session.user.id });
  } catch (error) {
    if (error instanceof ForbiddenError) return new Response(null, { status: 403 });
    throw error;
  }
  await exportLogs.create(current.ws, { projectId: null, madeBy: session.user.id, file: "workspace", filter: null, rows: out.projects });
  await track("export_downloaded", { format: "zip" }, { workspaceId: current.ws, userId: session.user.id });
  return new Response(new Uint8Array(out.zip), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${out.name.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(out.name)}`,
      "cache-control": "no-store",
    },
  });
}
