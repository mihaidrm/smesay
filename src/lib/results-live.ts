// The client side of live updates on Results (stories/E8-7), without the browser, so it can be
// tested with fake timers and a fake stream (src/lib/results-live.test.ts). The page
// (live-updates.tsx) gives it an EventSource factory and router.refresh.
// - Only "ping" and "change" prove the chain works, since both travel through Postgres; the
//   route's own "ready" does not. A stream with neither for 15 seconds is stale: the banner
//   shows, the stream is closed and opened again after 1, 2, 4, 8, 16, then 30 seconds, and
//   again each time a reopened stream stays silent for 15 seconds; the first ping or change
//   clears the banner and resets the backoff.
// - Every "change", and the first ping after a reconnect, reads the page again.
// - Reads are throttled: the first 250 ms after a change, then at most one a second, and none
//   while the tab is hidden; a change in a hidden tab is read when it shows again.
export const HEARTBEAT_MS = 5_000;
export const STALE_MS = 15_000;
const MAX_DELAY_MS = 30_000;
export const FIRST_READ_MS = 250;
export const MIN_READ_GAP_MS = 1_000;

export const isStale = (lastBeat: number, now: number): boolean => now - lastBeat > STALE_MS;

export const reconnectDelay = (attempt: number): number => Math.min(MAX_DELAY_MS, 1_000 * 2 ** Math.max(0, attempt));

// How long to wait before reading the page again, given when it was last read.
export const readDelay = (lastRead: number | null, now: number): number => Math.max(FIRST_READ_MS, lastRead === null ? 0 : MIN_READ_GAP_MS - (now - lastRead));

// One server-sent event (html.spec.whatwg.org/multipage/server-sent-events.html, the event
// stream format): a named event with its data line, then a blank line.
export const sseEvent = (event: string, data: Record<string, unknown>): string => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export type StreamLike = { addEventListener(type: string, fn: () => void): void; onerror: ((ev: Event) => unknown) | null; close(): void };
export type LiveDeps = { open: () => StreamLike; refresh: () => void; setStale: (stale: boolean) => void; hidden: () => boolean };

export function createLiveClient({ open: openStream, refresh, setStale, hidden }: LiveDeps) {
  let source: StreamLike | null = null;
  let lastBeat = Date.now();
  let attempt = 0;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let read: ReturnType<typeof setTimeout> | null = null;
  let lastRead: number | null = null;
  let dirty = false;
  let stale = false;
  let opened = 0;
  let catchUp = false;
  let stopped = false;

  const readSoon = () => {
    if (hidden()) { dirty = true; return; }
    if (read) return;
    read = setTimeout(() => { read = null; lastRead = Date.now(); dirty = false; refresh(); }, readDelay(lastRead, Date.now()));
  };
  const alive = () => {
    lastBeat = Date.now();
    attempt = 0;
    if (stale) { stale = false; setStale(false); catchUp = true; }
    if (catchUp) { catchUp = false; readSoon(); }
  };
  const again = () => {
    source?.close();
    source = null;
    if (!retry && !stopped) retry = setTimeout(() => { retry = null; open(); }, reconnectDelay(attempt++));
  };
  const open = () => {
    if (stopped) return;
    lastBeat = Date.now();
    // A reopened stream reads the page once it proves alive: changes may have been missed.
    if (opened++ > 0) catchUp = true;
    const s = openStream();
    source = s;
    s.addEventListener("ping", alive);
    s.addEventListener("change", () => { alive(); readSoon(); });
    // A drop or a refused stream: close it and open it again after the backoff; the browser's
    // own retry would not back off, and stops for good after a refused one.
    s.onerror = again;
  };
  // Silent for 15 seconds, the first time or again after a reopen: the banner (once), and
  // another reopen with a longer wait. open() starts the 15 seconds again.
  const watch = setInterval(() => {
    if (retry || !isStale(lastBeat, Date.now())) return;
    if (!stale) { stale = true; setStale(true); }
    again();
  }, 1_000);
  open();
  return {
    // The tab shows again: read what changed while it was hidden.
    visible() { if (dirty) readSoon(); },
    stop() {
      stopped = true;
      clearInterval(watch);
      if (retry) clearTimeout(retry);
      if (read) clearTimeout(read);
      source?.close();
      source = null;
    },
  };
}
