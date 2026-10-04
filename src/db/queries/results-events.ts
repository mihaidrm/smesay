// Live updates on Results (stories/E8-7): one LISTEN on the channel "results" per server
// process (drizzle/0020_results_notify.sql sends the instrument's id on every write to an
// answer, a response or a missing item), fanned out to the open streams of that instrument.
// postgres.js keeps the listen on a dedicated connection that reconnects by itself
// (node_modules/postgres/README.md, Listen & notify; ListenMeta.unlisten:
// node_modules/postgres/types/index.d.ts). The payload is an id the stream compares with its
// own instrument, which the route found through the session's workspace; nothing is read
// from it.
import { db } from "@/db";

type Listener = () => void;
type Hub = { subscribers: Map<string, Set<Listener>>; listening: Promise<unknown> | null };

// Kept on globalThis so a reloaded module in development does not open a second LISTEN.
const hub: Hub = ((globalThis as { __resultsHub?: Hub }).__resultsHub ??= { subscribers: new Map(), listening: null });

function ensureListening(): Promise<unknown> {
  hub.listening ??= db.$client.listen("results", (instrumentId) => {
    for (const fn of hub.subscribers.get(instrumentId) ?? []) fn();
  }).catch((error: unknown) => {
    // A failed LISTEN fails the stream that asked (the route answers 503 and the page tries
    // again with backoff); the next stream tries LISTEN again.
    hub.listening = null;
    throw error;
  });
  return hub.listening;
}

// Calls `fn` after every committed write to the instrument's answers, responses or missing
// items; the returned function stops it.
export async function onResultsChange(instrumentId: string, fn: Listener): Promise<() => void> {
  await ensureListening();
  const set = hub.subscribers.get(instrumentId) ?? new Set<Listener>();
  set.add(fn);
  hub.subscribers.set(instrumentId, set);
  return () => {
    set.delete(fn);
    if (set.size === 0) hub.subscribers.delete(instrumentId);
  };
}
