// Live updates on Results (stories/E8-7): one LISTEN on the channel "results" per server
// process (drizzle/0020_results_notify.sql sends the instrument's id on every write to an
// answer, a response or a missing item), fanned out to the open streams of that instrument.
// postgres.js keeps the listen on a dedicated connection that reconnects by itself, and calls
// its third argument on the first LISTEN and on every reconnect (node_modules/postgres/
// README.md, Listen & notify; node_modules/postgres/types/index.d.ts, listen). The payload is
// an id the stream compares with its own instrument, which the route found through the
// session's workspace; nothing is read from it.
//
// The heartbeat travels the same way: while a stream is open the process sends NOTIFY
// results 'ping' every 5 seconds through the pool, and each stream sends its ping when it
// comes back, so a page whose pings stop knows the chain to Postgres is broken, not only its
// own connection. After a reconnect every stream is told to read again, since notifications
// sent while the LISTEN was down are lost.
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { HEARTBEAT_MS } from "@/lib/results-live";

export type ResultsListener = { change: () => void; ping: () => void };
type Hub = { subscribers: Map<string, Set<ResultsListener>>; listening: Promise<unknown> | null; listens: number; beat: ReturnType<typeof setInterval> | null; seen: Set<string> };

const PING = "ping";

// Kept on globalThis so a reloaded module in development does not open a second LISTEN.
const hub: Hub = ((globalThis as { __resultsHub?: Hub }).__resultsHub ??= { subscribers: new Map(), listening: null, listens: 0, beat: null, seen: new Set() });

const everyone = (): ResultsListener[] => [...hub.subscribers.values()].flatMap((set) => [...set]);

function dispatch(payload: string) {
  // A LISTEN that failed and was asked again can leave postgres.js with the handler twice
  // (node_modules/postgres/src/index.js, listen); the calls for one notification come in the
  // same tick, so they collapse into one.
  if (hub.seen.has(payload)) return;
  hub.seen.add(payload);
  queueMicrotask(() => hub.seen.delete(payload));
  if (payload === PING) for (const l of everyone()) l.ping();
  else for (const l of hub.subscribers.get(payload) ?? []) l.change();
}

function ensureListening(): Promise<unknown> {
  hub.listening ??= db.$client.listen("results", dispatch, () => {
    // The first LISTEN, then each reconnect: changes may have been missed in between.
    if (hub.listens++ > 0) for (const l of everyone()) l.change();
  }).catch((error: unknown) => {
    // A failed LISTEN fails the stream that asked (the route answers 503 and the page tries
    // again with backoff); the next stream tries LISTEN again.
    hub.listening = null;
    throw error;
  });
  return hub.listening;
}

function heartbeat(on: boolean) {
  if (on && !hub.beat) {
    hub.beat = setInterval(() => {
      db.execute(sql`select pg_notify('results', ${PING})`).catch(() => { /* the pages' pings stop, and they say so */ });
    }, HEARTBEAT_MS);
  } else if (!on && hub.beat) {
    clearInterval(hub.beat);
    hub.beat = null;
  }
}

// Calls `listener.change` after every committed write to the instrument's answers, responses
// or missing items, and after a reconnect; `listener.ping` with every heartbeat. The returned
// function stops it, once.
export async function onResultsChange(instrumentId: string, listener: ResultsListener): Promise<() => void> {
  await ensureListening();
  const set = hub.subscribers.get(instrumentId) ?? new Set<ResultsListener>();
  set.add(listener);
  hub.subscribers.set(instrumentId, set);
  heartbeat(true);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    set.delete(listener);
    if (set.size === 0 && hub.subscribers.get(instrumentId) === set) hub.subscribers.delete(instrumentId);
    if (hub.subscribers.size === 0) heartbeat(false);
  };
}

// For tests: how many streams listen to the instrument.
export const subscriberCount = (instrumentId: string): number => hub.subscribers.get(instrumentId)?.size ?? 0;
