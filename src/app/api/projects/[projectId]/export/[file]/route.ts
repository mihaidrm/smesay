// GET /api/projects/[projectId]/export/[file]?[the Results page's query] (stories/E10-1): one
// CSV file of the Export tab (answers, items, people, missing) under the page's filter and
// switch. The project is found through the session's workspace (404 otherwise), the filter is
// read as the page reads it (parseResultsFilter with the PM's stored switch), the rows come
// from the same queries (src/lib/export/files.ts), and the file is streamed in chunks of 500
// lines from a ReadableStream (node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/route.md, Streaming) as an attachment (Content-Disposition:
// developer.mozilla.org/docs/Web/HTTP/Headers/Content-Disposition). Every download writes an
// export_log row: who, when, the file, the filter in words (without what a text filter holds)
// and the rows (acceptance 5). A request another site starts (Sec-Fetch-Site: cross-site,
// developer.mozilla.org/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site) gets 403 and writes no
// row, so a link elsewhere cannot fill the log.
// /export/project (E10-2) is the whole project as one JSON file (ProjectExport), whatever the
// filter, logged the same way with the number of responses as its rows.
import { exportLogs, instruments, projects } from "@/db/queries";
import { resultsPrefs } from "@/db/queries/results";
import { EXPORT_FILES, type CsvFile, type ExportFile } from "@/db/types";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { EXPORT_COPY } from "@/lib/export/copy";
import { BOM, line } from "@/lib/export/csv";
import { exportTable } from "@/lib/export/files";
import { exportProject } from "@/lib/export/project";
import { describeFilter, filterActive, parseResultsFilter, type FilterContext, type SearchParams } from "@/lib/results-filter";

const CHUNK = 500;

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string; file: string }> }) {
  const { projectId, file } = await params;
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403 });
  const { session, current } = await requireCurrentWorkspace(`/app/projects/${projectId}/results?tab=export`);
  if (!(EXPORT_FILES as readonly string[]).includes(file)) return new Response(null, { status: 404 });
  const project = await projects.get(current.ws, projectId);
  const instrument = project ? await instruments.latestForProject(current.ws, project.id) : null;
  if (!project) return new Response(null, { status: 404 });
  const date = new Date().toISOString().slice(0, 10);
  const attachment = (name: string) => `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`;
  if (file === "project") {
    const body = await exportProject({ ws: current.ws, userId: session.user.id }, project.id);
    await exportLogs.create(current.ws, { projectId: project.id, madeBy: session.user.id, file: "project", filter: null, rows: body.responses.length });
    return new Response(JSON.stringify(body, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": attachment(EXPORT_COPY.fileName(project.name, "project", date)), "cache-control": "no-store" } });
  }
  if (!instrument) return new Response(null, { status: 404 });
  const query: SearchParams = {};
  for (const [k, v] of new URL(request.url).searchParams) {
    const had = query[k];
    query[k] = had === undefined ? v : Array.isArray(had) ? [...had, v] : [had, v];
  }
  const prefs = await resultsPrefs.get(session.user.id, instrument.id);
  const ctx: FilterContext = { fields: instrument.respondentFields, perspectives: instrument.perspectives };
  const filter = parseResultsFilter(query, ctx, typeof prefs.includeUnsubmitted === "boolean" ? prefs.includeUnsubmitted : null);
  const table = await exportTable(current.ws, instrument, file as CsvFile, filter, ctx, project.isSample);
  await exportLogs.create(current.ws, { projectId: project.id, madeBy: session.user.id, file: file as ExportFile, filter: filterActive(filter) ? describeFilter(filter, ctx, true) : null, rows: table.rows.length });
  const lines = [...table.preamble, table.header, ...table.rows];
  const encoder = new TextEncoder();
  let at = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (at === 0) controller.enqueue(encoder.encode(BOM));
      const next = lines.slice(at, at + CHUNK);
      at += CHUNK;
      if (next.length > 0) controller.enqueue(encoder.encode(next.map(line).join("")));
      if (at >= lines.length) controller.close();
    },
  });
  const name = EXPORT_COPY.fileName(project.name, file as ExportFile, date);
  return new Response(stream, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": attachment(name),
      "cache-control": "no-store",
    },
  });
}
