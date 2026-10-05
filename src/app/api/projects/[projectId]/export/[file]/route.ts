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
// /export/summary (E10-3) is the PDF summary under the page's filter, rendered by Chromium
// (src/lib/export/pdf.ts), with its page count in the x-summary-pages header so the Export tab
// can say when it runs over 30 pages; logged with the page count as its rows. Next leaves
// playwright-core out of the server bundle (node_modules/next/dist/lib/
// server-external-packages.jsonc lists it).
import { exportLogs, instruments, projects } from "@/db/queries";
import { resultsPrefs } from "@/db/queries/results";
import { EXPORT_FILES, type CsvFile, type ExportFile } from "@/db/types";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { EXPORT_COPY } from "@/lib/export/copy";
import { BOM, line } from "@/lib/export/csv";
import { exportTable } from "@/lib/export/files";
import { renderPdf } from "@/lib/export/pdf";
import { exportProject } from "@/lib/export/project";
import { summaryView } from "@/lib/export/summary";
import { summaryFooter, summaryHeader, summaryHtml } from "@/lib/export/summary-html";
import { describeFilter, filterActive, parseResultsFilter, type FilterContext, type SearchParams } from "@/lib/results-filter";
import { track } from "@/lib/analytics";
import { DEFAULT_TILES, storedTiles } from "@/lib/results-tiles";

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
    await track("export_downloaded", { format: "json" }, { workspaceId: current.ws, userId: session.user.id });
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": attachment(EXPORT_COPY.fileName(project.name, "project", date)), "cache-control": "no-store" } });
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
  const logFilter = filterActive(filter) ? describeFilter(filter, ctx, true) : null;
  if (file === "summary") {
    const view = await summaryView({ ws: current.ws, workspace: current.workspace.name, project, instrument, filter, ctx, tiles: storedTiles(prefs.tiles) ?? DEFAULT_TILES, now: new Date() });
    if (!view) return new Response(null, { status: 404 });
    const pdf = await renderPdf(summaryHtml(view), { header: summaryHeader(view), footer: summaryFooter() });
    await exportLogs.create(current.ws, { projectId: project.id, madeBy: session.user.id, file: "summary", filter: logFilter, rows: pdf.pages });
    await track("export_downloaded", { format: "pdf" }, { workspaceId: current.ws, userId: session.user.id });
    return new Response(new Uint8Array(pdf.bytes), { headers: { "content-type": "application/pdf", "content-disposition": attachment(EXPORT_COPY.fileName(project.name, "summary", date)), "x-summary-pages": String(pdf.pages), "cache-control": "no-store" } });
  }
  const table = await exportTable(current.ws, instrument, file as CsvFile, filter, ctx, project.isSample);
  await exportLogs.create(current.ws, { projectId: project.id, madeBy: session.user.id, file: file as ExportFile, filter: logFilter, rows: table.rows.length });
  await track("export_downloaded", { format: "csv" }, { workspaceId: current.ws, userId: session.user.id });
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
