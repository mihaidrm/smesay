// GET /api/projects/[projectId]/events (stories/E8-7): the server-sent events of the project's
// Results while the page is open. The project is found through the session's workspace (404
// otherwise), then its latest instrument; the stream sends "ready" once, "change" with the
// instrument id and the stream's version counter after every committed write to its answers,
// responses or missing items and after the server's LISTEN reconnects, and "ping" every 5
// seconds through Postgres
// (src/db/queries/results-events.ts) so the page can tell a broken chain (acceptance 3). No
// answer content travels (acceptance 4); the page reads the numbers again through the scoped
// queries. The format: text/event-stream (html.spec.whatwg.org/multipage/server-sent-
// events.html); a streamed Response from a ReadableStream in a Route Handler
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md,
// Streaming). The stream ends when the request's signal aborts
// (developer.mozilla.org/docs/Web/API/Request/signal), also when it aborted while the route
// was still looking the project up.
import { instruments, projects } from "@/db/queries";
import { onResultsChange } from "@/db/queries/results-events";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { sseEvent } from "@/lib/results-live";

// HEAD would otherwise run GET and leave its stream open with no reader
// (node_modules/next/dist/server/route-modules/app-route/helpers/auto-implement-methods.js).
export function HEAD(): Response {
  return new Response(null, { status: 405, headers: { Allow: "GET" } });
}

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/results`);
  const project = await projects.get(current.ws, projectId);
  const instrument = project ? await instruments.latestForProject(current.ws, project.id) : null;
  if (!instrument) return new Response(null, { status: 404 });
  if (request.signal.aborted) return new Response(null, { status: 204 });
  const encoder = new TextEncoder();
  let stop: (() => void) | null = null;
  let ended = false;
  let version = 0;
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  const end = () => {
    ended = true;
    stop?.();
    stop = null;
    try { controller?.close(); } catch { /* already closed */ }
  };
  const stream = new ReadableStream<Uint8Array>({
    start(c) { controller = c; },
    cancel() { end(); },
  });
  const send = (event: string, data: Record<string, unknown>) => {
    if (ended || !controller) return;
    try { controller.enqueue(encoder.encode(sseEvent(event, data))); } catch { end(); }
  };
  request.signal.addEventListener("abort", end);
  try {
    const off = await onResultsChange(instrument.id, { change: () => send("change", { instrument: instrument.id, version: ++version }), ping: () => send("ping", {}) });
    // The tab closed while the LISTEN was being set up.
    if (ended || request.signal.aborted) { off(); end(); return new Response(null, { status: 204 }); }
    stop = off;
  } catch {
    end();
    return new Response(null, { status: 503 });
  }
  send("ready", { instrument: instrument.id, version });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
  });
}
