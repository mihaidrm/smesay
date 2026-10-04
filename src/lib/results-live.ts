// The client side of live updates on Results (stories/E8-7, acceptance 3), without the
// browser: the stream is stale after 15 seconds without a heartbeat (the route sends one
// every 5), and a dropped stream is opened again after 1, 2, 4, 8, 16, then 30 seconds.
export const HEARTBEAT_MS = 5_000;
export const STALE_MS = 15_000;
const MAX_DELAY_MS = 30_000;

export const isStale = (lastBeat: number, now: number): boolean => now - lastBeat > STALE_MS;

export const reconnectDelay = (attempt: number): number => Math.min(MAX_DELAY_MS, 1_000 * 2 ** Math.max(0, attempt));

// One server-sent event (html.spec.whatwg.org/multipage/server-sent-events.html, the event
// stream format): a named event with its data line, then a blank line.
export const sseEvent = (event: string, data: Record<string, unknown>): string => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
