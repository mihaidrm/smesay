// GET /api/projects/[projectId]/events (stories/E8-7): the server-sent events of the project's
// Results while the page is open. The project is found through the session's workspace (404
// otherwise), then its latest instrument; the stream sends "ready" once, "change" with the
// instrument id and a version counter after every committed write to its answers, responses
// or missing items (src/db/queries/results-events.ts), and "ping" every 5 seconds so the page
// can tell a dropped stream (acceptance 3). No answer content travels (acceptance 4); the page reads
// the numbers again through the scoped queries. The format: text/event-stream
// (html.spec.whatwg.org/multipage/server-sent-events.html); a streamed Response from a
// ReadableStream in a Route Handler (node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/route.md, Streaming); the stream ends when the request's signal aborts
// (developer.mozilla.org/docs/Web/API/Request/signal).
import { instruments, projects } from "@/db/queries";
import { onResultsChange } from "@/db/queries/results-events";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { HEARTBEAT_MS, sseEvent } from "@/lib/results-live";

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { current } = await requireCurrentWorkspace(`/app/projects/${projectId}/results`);
  const project = await projects.get(current.ws, projectId);
  const instrument = project ? await instruments.latestForProject(current.ws, project.id) : null;
  if (!instrument) return new Response(null, { status: 404 });
  const encoder = new TextEncoder();
  let version = 0;
  let stop: (() => void) | null = null;
  let beat: ReturnType<typeof setInterval> | null = null;
  const end = () => {
    stop?.();
    stop = null;
    if (beat) clearInterval(beat);
    beat = null;
  };
  let controller: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) { controller = c; },
    cancel() { end(); },
  });
  const send = (event: string, data: Record<string, unknown>) => {
    try { controller.enqueue(encoder.encode(sseEvent(event, data))); } catch { end(); }
  };
  try {
    stop = await onResultsChange(instrument.id, () => send("change", { instrument: instrument.id, version: ++version }));
  } catch {
    return new Response(null, { status: 503 });
  }
  beat = setInterval(() => send("ping", {}), HEARTBEAT_MS);
  request.signal.addEventListener("abort", () => {
    end();
    try { controller.close(); } catch { /* already closed */ }
  });
  send("ready", { instrument: instrument.id, version });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
  });
}
