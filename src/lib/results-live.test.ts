// The live-update rules of the page (stories/E8-7, acceptance 3) and the event format.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLiveClient, isStale, readDelay, reconnectDelay, sseEvent, STALE_MS, type StreamLike } from "@/lib/results-live";

describe("live updates on Results", () => {
  it("calls a stream stale after 15 seconds without a heartbeat", () => {
    expect(isStale(0, STALE_MS)).toBe(false);
    expect(isStale(0, STALE_MS + 1)).toBe(true);
  });
  it("opens a dropped stream again after 1, 2, 4, 8, 16, then 30 seconds", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 20].map(reconnectDelay)).toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000, 30_000]);
  });
  it("writes a named event with one data line and a blank line", () => {
    expect(sseEvent("change", { instrument: "i", version: 2 })).toBe('event: change\ndata: {"instrument":"i","version":2}\n\n');
  });
});

describe("readDelay", () => {
  it("reads 250 ms after a change, then at most once a second", () => {
    expect(readDelay(null, 10_000)).toBe(250);
    expect(readDelay(10_000, 10_100)).toBe(900);
    expect(readDelay(10_000, 12_000)).toBe(250);
  });
});

// A fake EventSource: the test fires its events.
class FakeStream implements StreamLike {
  handlers = new Map<string, (() => void)[]>();
  onerror: ((ev: Event) => unknown) | null = null;
  closed = false;
  addEventListener(type: string, fn: () => void) { this.handlers.set(type, [...(this.handlers.get(type) ?? []), fn]); }
  fire(type: string) { for (const fn of this.handlers.get(type) ?? []) fn(); }
  close() { this.closed = true; }
}

describe("the live client", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  const make = (hidden = () => false) => {
    const streams: FakeStream[] = [];
    const reads: number[] = [];
    const stale: boolean[] = [];
    const client = createLiveClient({ open: () => { const s = new FakeStream(); streams.push(s); return s; }, refresh: () => reads.push(Date.now()), setStale: (v) => stale.push(v), hidden });
    return { client, streams, reads, stale };
  };

  it("shows the banner after 15 s without an event, reconnects with backoff and clears it", () => {
    const { client, streams, reads, stale } = make();
    streams[0].fire("ready");
    vi.advanceTimersByTime(STALE_MS + 1_000);
    expect(stale).toEqual([true]);
    expect(streams[0].closed).toBe(true);
    // The first retry after 1 s; it is refused, the next after 2 s.
    vi.advanceTimersByTime(1_000);
    expect(streams).toHaveLength(2);
    streams[1].onerror!(new Event("error"));
    vi.advanceTimersByTime(1_999);
    expect(streams).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(streams).toHaveLength(3);
    // It comes back: the first ping through Postgres clears the banner and the page is read
    // once to catch up.
    streams[2].fire("ready");
    expect(stale).toEqual([true]);
    streams[2].fire("ping");
    expect(stale).toEqual([true, false]);
    vi.advanceTimersByTime(250);
    expect(reads).toHaveLength(1);
    client.stop();
  });

  it("reads the page again after a reconnect shorter than 15 s", () => {
    const { client, streams, reads } = make();
    streams[0].fire("ready");
    streams[0].onerror!(new Event("error"));
    vi.advanceTimersByTime(1_000);
    streams[1].fire("ready");
    vi.advanceTimersByTime(250);
    expect(reads).toHaveLength(0);
    streams[1].fire("ping");
    vi.advanceTimersByTime(250);
    expect(reads).toHaveLength(1);
    client.stop();
  });

  it("keeps the banner while reopened streams only say ready, and waits longer each time", () => {
    const { client, streams, stale } = make();
    vi.advanceTimersByTime(16_000);
    expect(stale).toEqual([true]);
    const opens: number[] = [];
    for (let t = 0; t < 120_000; t += 1_000) {
      const n = streams.length;
      vi.advanceTimersByTime(1_000);
      if (streams.length > n) { opens.push(Date.now()); streams.at(-1)!.fire("ready"); }
    }
    expect(stale).toEqual([true]);
    // Each silent stream is given 15 s, then the wait before the next grows: 2, 4, 8 s...
    const gaps = opens.slice(1).map((t, i) => t - opens[i]);
    expect(gaps.slice(0, 3)).toEqual([18_000, 20_000, 24_000]);
    client.stop();
  });

  it("reopens a stream that hangs with no event and no error", () => {
    const { client, streams } = make();
    vi.advanceTimersByTime(16_000);
    vi.advanceTimersByTime(1_000);
    expect(streams).toHaveLength(2);
    vi.advanceTimersByTime(16_000 + 2_000);
    expect(streams).toHaveLength(3);
    expect(streams[1].closed).toBe(true);
    client.stop();
  });

  it("throttles reads to one a second under a burst of changes", () => {
    const { client, streams, reads } = make();
    streams[0].fire("ready");
    for (let i = 0; i < 40; i++) { streams[0].fire("change"); vi.advanceTimersByTime(100); }
    // 4 seconds of changes every 100 ms: the first read at 250 ms, then one a second.
    expect(reads.length).toBeGreaterThanOrEqual(3);
    expect(reads.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < reads.length; i++) expect(reads[i] - reads[i - 1]).toBeGreaterThanOrEqual(1_000);
    client.stop();
  });

  it("holds reads while the tab is hidden and reads once when it shows", () => {
    let hidden = true;
    const { client, streams, reads } = make(() => hidden);
    streams[0].fire("ready");
    streams[0].fire("change");
    streams[0].fire("change");
    vi.advanceTimersByTime(5_000);
    expect(reads).toHaveLength(0);
    hidden = false;
    client.visible();
    vi.advanceTimersByTime(250);
    expect(reads).toHaveLength(1);
    client.stop();
  });

  it("stops: no timer and no stream left", () => {
    const { client, streams } = make();
    client.stop();
    expect(streams[0].closed).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
